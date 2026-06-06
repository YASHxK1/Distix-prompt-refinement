(function initPopup() {
  const { constants, validation, ui } = PromptRefinement;
  const prompt = document.getElementById("prompt");
  const result = document.getElementById("result");
  const resultSection = document.getElementById("result-section");
  const refineButton = document.getElementById("refine");
  const copyButton = document.getElementById("copy");
  const status = document.getElementById("status");
  let activeRequest = false;

  document.getElementById("open-settings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  refineButton.addEventListener("click", async () => {
    if (activeRequest) return;
    const check = validation.validatePrompt(prompt.value);
    if (!check.ok) {
      ui.setStatus(status, check.message, "error");
      prompt.focus();
      return;
    }

    activeRequest = true;
    refineButton.disabled = true;
    refineButton.textContent = "Refining...";
    ui.setStatus(status, "", "");

    try {
      const response = await chrome.runtime.sendMessage({
        type: constants.MESSAGE_TYPES.REFINE_PROMPT,
        prompt: prompt.value
      });
      if (!response?.ok) {
        ui.setStatus(status, response?.error?.message || "Refinement failed. Try again.", "error");
        return;
      }
      result.value = response.text;
      resultSection.hidden = false;
      ui.setStatus(status, "Prompt refined.", "success");
    } catch {
      ui.setStatus(status, "The extension could not complete the request. Try again.", "error");
    } finally {
      activeRequest = false;
      refineButton.disabled = false;
      refineButton.textContent = "Refine";
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await ui.copyText(result.value);
      ui.setStatus(status, "Copied to clipboard.", "success");
    } catch {
      ui.setStatus(status, "Could not copy the result. Select and copy it manually.", "error");
    }
  });
})();
