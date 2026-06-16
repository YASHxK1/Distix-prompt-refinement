(function initContentScript() {
  const { constants, validation, adapters, ui } = PromptRefinement;
  const adapter = adapters.getActiveAdapter();
  if (!adapter) return;

  const BUTTON_ID = "prompt-refinement-button";
  const NOTICE_ID = "prompt-refinement-notice";
  const BUTTON_GAP = 8;
  const DEFAULT_BUTTON_PLACEMENT = { leftOffset: 0, topOffset: 16 };
  let activeRequest = false;
  let observerTimer = 0;

  function showNotice(message, canOpenSettings) {
    document.getElementById(NOTICE_ID)?.remove();
    const notice = document.createElement("div");
    notice.id = NOTICE_ID;
    notice.setAttribute("role", "status");
    notice.textContent = message;

    if (canOpenSettings) {
      const settings = document.createElement("button");
      settings.type = "button";
      settings.textContent = "Open settings";
      settings.addEventListener("click", () => chrome.runtime.openOptionsPage());
      notice.appendChild(settings);
    }

    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 7000);
  }

  async function handleRefine(button) {
    if (activeRequest) return;

    const composer = adapter.findComposer();
    if (!composer) {
      showNotice("The prompt composer is temporarily unavailable.", false);
      return;
    }

    const originalText = adapter.getText(composer);
    const promptCheck = validation.validatePrompt(originalText);
    if (!promptCheck.ok) {
      showNotice(promptCheck.message, false);
      composer.focus();
      return;
    }

    activeRequest = true;
    button.disabled = true;
    button.textContent = "Refining...";

    try {
      const response = await chrome.runtime.sendMessage({
        type: constants.MESSAGE_TYPES.REFINE_PROMPT,
        prompt: originalText
      });

      if (!response?.ok) {
        const error = response?.error || { code: "UNKNOWN", message: "Refinement failed. Try again." };
        showNotice(error.message, ["MISSING_API_KEY", "INVALID_API_KEY", "MISSING_MODEL", "INVALID_MODEL"].includes(error.code));
        return;
      }

      const currentComposer = adapter.findComposer();
      if (!currentComposer) {
        showNotice("The composer changed before refinement finished. Your prompt was not replaced.", false);
        return;
      }
      if (adapter.getText(currentComposer) !== originalText) {
        showNotice("The prompt changed while refinement was running. Your newer text was preserved.", false);
        return;
      }
      adapter.replaceText(currentComposer, response.text);
      currentComposer.focus();
    } catch {
      showNotice("The extension could not complete the request. Try again.", false);
    } finally {
      activeRequest = false;
      button.disabled = false;
      button.textContent = "Refine";
    }
  }

  function createButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "prompt-refinement-button";
    button.textContent = "Refine";
    button.setAttribute("aria-label", "Refine current prompt");
    button.addEventListener("click", () => handleRefine(button));
    return button;
  }

  function positionButton(button, composer) {
    const rect = composer.getBoundingClientRect();
    const placement = { ...DEFAULT_BUTTON_PLACEMENT, ...adapter.buttonPlacement };
    button.style.left = `${Math.max(BUTTON_GAP, rect.left - placement.leftOffset)}px`;
    button.style.top = `${Math.max(BUTTON_GAP, rect.top - button.offsetHeight - BUTTON_GAP - placement.topOffset)}px`;
  }

  function mountButton() {
    const composer = adapter.findComposer();
    if (!composer) return;

    let button = document.getElementById(BUTTON_ID);
    if (!button) {
      button = createButton();
      button.id = BUTTON_ID;
      document.body.appendChild(button);
    }

    positionButton(button, composer);
  }

  const observer = new MutationObserver(() => {
    clearTimeout(observerTimer);
    observerTimer = setTimeout(mountButton, 150);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", mountButton);
  window.addEventListener("scroll", mountButton, true);
  mountButton();
})();
