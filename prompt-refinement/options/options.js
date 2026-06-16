(function initOptions() {
  const { constants, providers, validation, ui } = PromptRefinement;
  const { PROVIDER } = constants.STORAGE_KEYS;
  const form = document.getElementById("settings-form");
  const providerSelect = document.getElementById("provider");
  const apiKey = document.getElementById("api-key");
  const apiKeyLabel = document.getElementById("api-key-label");
  const model = document.getElementById("model");
  const modelLabel = document.getElementById("model-label");
  const modelHint = document.getElementById("model-hint");
  const keyState = document.getElementById("key-state");
  const status = document.getElementById("status");
  const testButton = document.getElementById("test");
  const clearButton = document.getElementById("clear-key");

  function updateProviderCopy(provider) {
    apiKeyLabel.textContent = `${provider.label} API key`;
    modelLabel.textContent = `${provider.label} model ID`;
    model.placeholder = provider.defaultModel;

    if (provider.id === constants.PROVIDERS.OPENROUTER) {
      modelHint.textContent = "Use a provider/model identifier, for example openai/gpt-4o, anthropic/claude-3.5-sonnet, or google/gemini-2.0-flash.";
    } else {
      modelHint.textContent = "Use a provider/model identifier, for example deepseek/deepseek-v4-pro.";
    }
  }

  async function loadProviderSettings(providerId) {
    const provider = providers.getProvider(providerId);
    const [local, sync] = await Promise.all([
      chrome.storage.local.get(provider.apiKeyStorageKey),
      chrome.storage.sync.get(provider.modelStorageKey)
    ]);
    const storedKey = local[provider.apiKeyStorageKey];
    const hasKey = typeof storedKey === "string" && storedKey.trim().length > 0;
    updateProviderCopy(provider);
    apiKey.value = "";
    apiKey.placeholder = hasKey ? "Saved key (enter a new value to replace)" : "Enter your API key";
    keyState.textContent = hasKey
      ? `A ${provider.label} API key is saved on this device.`
      : `No ${provider.label} API key is saved.`;
    model.value = sync[provider.modelStorageKey] || provider.defaultModel;
  }

  async function loadSettings() {
    const sync = await chrome.storage.sync.get(PROVIDER);
    const provider = providers.getProvider(sync[PROVIDER]);
    providerSelect.value = provider.id;
    await loadProviderSettings(provider.id);
  }

  async function saveSettings() {
    const providerCheck = validation.validateProvider(providerSelect.value);
    if (!providerCheck.ok) {
      ui.setStatus(status, providerCheck.message, "error");
      return false;
    }
    const provider = providers.getProvider(providerCheck.value);
    const modelCheck = validation.validateModel(model.value, provider.id);
    if (!modelCheck.ok) {
      ui.setStatus(status, modelCheck.message, "error");
      model.focus();
      return false;
    }

    const pendingKey = apiKey.value.trim();
    if (pendingKey) {
      const keyCheck = validation.validateApiKey(pendingKey, provider.id);
      if (!keyCheck.ok) {
        ui.setStatus(status, keyCheck.message, "error");
        apiKey.focus();
        return false;
      }
      await chrome.storage.local.set({ [provider.apiKeyStorageKey]: keyCheck.value });
    }

    var syncPayload = {};
    syncPayload[PROVIDER] = provider.id;
    syncPayload[provider.modelStorageKey] = modelCheck.value;

    await chrome.storage.sync.set(syncPayload);
    await loadProviderSettings(provider.id);
    return true;
  }

  providerSelect.addEventListener("change", async () => {
    const provider = providers.getProvider(providerSelect.value);
    await loadProviderSettings(provider.id);
    ui.setStatus(status, "", "");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!await saveSettings()) return;
    ui.setStatus(status, "Settings saved.", "success");
  });

  clearButton.addEventListener("click", async () => {
    const provider = providers.getProvider(providerSelect.value);
    await chrome.storage.local.remove(provider.apiKeyStorageKey);
    await loadProviderSettings(provider.id);
    ui.setStatus(status, `${provider.label} API key cleared.`, "success");
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
      const provider = providers.getProvider(response.provider || providerSelect.value);
      ui.setStatus(status, `${provider.label} connection succeeded for ${response.model}.`, "success");
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
