importScripts(
  "../shared/constants.js",
  "../shared/system-prompt.js",
  "../shared/validation.js",
  "../shared/gateway.js"
);

const { constants, systemPrompt, validation, gateway } = PromptRefinement;
const { API_KEY, MODEL } = constants.STORAGE_KEYS;

async function restrictStorageAccess() {
  await Promise.all([
    chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    chrome.storage.sync.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  ]);
}

chrome.runtime.onInstalled.addListener(() => {
  restrictStorageAccess().catch(() => {});
  chrome.storage.sync.get(MODEL).then((stored) => {
    if (!stored[MODEL]) {
      return chrome.storage.sync.set({ [MODEL]: constants.DEFAULT_MODEL });
    }
  }).catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  restrictStorageAccess().catch(() => {});
});

restrictStorageAccess().catch(() => {});

async function readSettings() {
  const [local, sync] = await Promise.all([
    chrome.storage.local.get(API_KEY),
    chrome.storage.sync.get(MODEL)
  ]);
  return {
    apiKey: local[API_KEY],
    model: sync[MODEL] || constants.DEFAULT_MODEL
  };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), constants.REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function refinePrompt(prompt) {
  const promptCheck = validation.validatePrompt(prompt);
  if (!promptCheck.ok) return { ok: false, error: promptCheck };

  const settings = await readSettings();
  const keyCheck = validation.validateApiKey(settings.apiKey);
  if (!keyCheck.ok) return { ok: false, error: keyCheck };

  const modelCheck = validation.validateModel(settings.model);
  if (!modelCheck.ok) return { ok: false, error: modelCheck };

  try {
    const response = await fetchWithTimeout(`${constants.GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${keyCheck.value}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelCheck.value,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptCheck.value }
        ],
        stream: false
      })
    });
    const payload = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: gateway.mapHttpError(response.status, payload) };
    }
    return gateway.parseCompletion(payload);
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT", message: "The request timed out. Try again." } };
    }
    return { ok: false, error: { code: "NETWORK_ERROR", message: "Could not reach AI Gateway. Check your connection and try again." } };
  }
}

async function testConnection() {
  const settings = await readSettings();
  const keyCheck = validation.validateApiKey(settings.apiKey);
  if (!keyCheck.ok) return { ok: false, error: keyCheck };

  const modelCheck = validation.validateModel(settings.model);
  if (!modelCheck.ok) return { ok: false, error: modelCheck };

  try {
    const modelPath = modelCheck.value.split("/").map(encodeURIComponent).join("/");
    const response = await fetchWithTimeout(`${constants.GATEWAY_BASE_URL}/models/${modelPath}`, {
      headers: {
        "Authorization": `Bearer ${keyCheck.value}`,
        "Content-Type": "application/json"
      }
    });
    const payload = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: gateway.mapHttpError(response.status, payload) };
    }
    return { ok: true, model: modelCheck.value };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT", message: "The connection test timed out." } };
    }
    return { ok: false, error: { code: "NETWORK_ERROR", message: "Could not reach AI Gateway." } };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;

  if (message.type === constants.MESSAGE_TYPES.REFINE_PROMPT) {
    refinePrompt(message.prompt).then(sendResponse);
    return true;
  }
  if (message.type === constants.MESSAGE_TYPES.TEST_CONNECTION) {
    testConnection().then(sendResponse);
    return true;
  }
  return false;
});
