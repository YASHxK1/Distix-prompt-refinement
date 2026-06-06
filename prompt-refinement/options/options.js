(function initOptions() {
  const { constants, validation, ui } = PromptRefinement;
  const { API_KEY, MODEL } = constants.STORAGE_KEYS;
  const form = document.getElementById("settings-form");
  const apiKey = document.getElementById("api-key");
  const model = document.getElementById("model");
  const keyState = document.getElementById("key-state");
  const status = document.getElementById("status");
  const testButton = document.getElementById("test");
  const clearButton = document.getElementById("clear-key");

  async function loadSettings() {
    const [local, sync] = await Promise.all([
      chrome.storage.local.get(API_KEY),
      chrome.storage.sync.get(MODEL)
    ]);
    const hasKey = Boolean(local[API_KEY]);
    apiKey.value = "";
    apiKey.placeholder = hasKey ? "Saved key (enter a new value to replace)" : "Enter your API key";
    keyState.textContent = hasKey ? "An API key is saved on this device." : "No API key is saved.";
    model.value = sync[MODEL] || constants.DEFAULT_MODEL;
  }

  async function saveSettings() {
    const modelCheck = validation.validateModel(model.value);
    if (!modelCheck.ok) {
      ui.setStatus(status, modelCheck.message, "error");
      model.focus();
      return false;
    }

    const pendingKey = apiKey.value.trim();
    if (pendingKey) {
      const keyCheck = validation.validateApiKey(pendingKey);
      if (!keyCheck.ok) {
        ui.setStatus(status, keyCheck.message, "error");
        apiKey.focus();
        return false;
      }
      await chrome.storage.local.set({ [API_KEY]: keyCheck.value });
    }
    await chrome.storage.sync.set({ [MODEL]: modelCheck.value });
    await loadSettings();
    return true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!await saveSettings()) return;
    ui.setStatus(status, "Settings saved.", "success");
  });

  clearButton.addEventListener("click", async () => {
    await chrome.storage.local.remove(API_KEY);
    await loadSettings();
    ui.setStatus(status, "API key cleared.", "success");
  });

  testButton.addEventListener("click", async () => {
    testButton.disabled = true;
    testButton.textContent = "Testing...";
    ui.setStatus(status, "", "");
    try {
      if (!await saveSettings()) return;
      const response = await chrome.runtime.sendMessage({
        type: constants.MESSAGE_TYPES.TEST_CONNECTION
      });
      if (!response?.ok) {
        ui.setStatus(status, response?.error?.message || "Connection test failed.", "error");
        return;
      }
      ui.setStatus(status, `Connection succeeded for ${response.model}.`, "success");
    } catch {
      ui.setStatus(status, "Connection test failed. Try again.", "error");
    } finally {
      testButton.disabled = false;
      testButton.textContent = "Test connection";
    }
  });

  loadSettings().catch(() => {
    ui.setStatus(status, "Could not load saved settings.", "error");
  });
})();
