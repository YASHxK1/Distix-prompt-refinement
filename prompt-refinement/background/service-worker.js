importScripts(
  "../shared/constants.js",
  "../shared/system-prompt.js",
  "../shared/validation.js",
  "../shared/gateway.js",
  "../shared/providers.js"
);

const { constants, systemPrompt, validation, gateway, providers } = PromptRefinement;
const { PROVIDER } = constants.STORAGE_KEYS;

async function restrictStorageAccess() {
  await Promise.all([
    chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    chrome.storage.sync.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  ]);
}

chrome.runtime.onInstalled.addListener(() => {
  restrictStorageAccess().catch(() => { });
  chrome.storage.sync.get([
    PROVIDER,
    constants.STORAGE_KEYS.MODEL,
    constants.STORAGE_KEYS.OPENROUTER_MODEL
  ]).then((stored) => {
    const defaults = {};
    if (!stored[PROVIDER]) defaults[PROVIDER] = constants.DEFAULT_PROVIDER;
    if (!stored[constants.STORAGE_KEYS.MODEL]) {
      defaults[constants.STORAGE_KEYS.MODEL] = constants.DEFAULT_MODEL;
    }
    if (!stored[constants.STORAGE_KEYS.OPENROUTER_MODEL]) {
      defaults[constants.STORAGE_KEYS.OPENROUTER_MODEL] = constants.DEFAULT_OPENROUTER_MODEL;
    }
    if (Object.keys(defaults).length) return chrome.storage.sync.set(defaults);
  }).catch(() => { });
});

chrome.runtime.onStartup.addListener(() => {
  restrictStorageAccess().catch(() => { });
});

restrictStorageAccess().catch(() => { });

async function readSettings() {
  const sync = await chrome.storage.sync.get([
    PROVIDER,
    constants.STORAGE_KEYS.MODEL,
    constants.STORAGE_KEYS.OPENROUTER_MODEL
  ]);
  const provider = providers.getProvider(sync[PROVIDER]);
  const local = await chrome.storage.local.get(provider.apiKeyStorageKey);
  const apiKey = local[provider.apiKeyStorageKey];
  const model = sync[provider.modelStorageKey] || provider.defaultModel;

  console.log("[readSettings]", {
    rawProvider: sync[PROVIDER],
    resolvedProvider: provider.id,
    model: model
  });

  return {
    provider: provider.id,
    apiKey: apiKey,
    model: model
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
  const keyCheck = validation.validateApiKey(settings.apiKey, settings.provider);
  if (!keyCheck.ok) {
    console.error("[refinePrompt] key validation failed:", keyCheck);
    return { ok: false, error: keyCheck };
  }

  const modelCheck = validation.validateModel(settings.model, settings.provider);
  if (!modelCheck.ok) {
    console.error("[refinePrompt] model validation failed:", modelCheck);
    return { ok: false, error: modelCheck };
  }

  try {
    const request = providers.buildCompletionRequest(
      settings.provider,
      keyCheck.value,
      modelCheck.value,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptCheck.value }
      ]
    );
    console.log("[refinePrompt] sending completion request:", { url: request.url, method: request.options.method });
    const response = await fetchWithTimeout(request.url, request.options);
    const payload = await readJson(response);
    console.log("[refinePrompt] response:", { status: response.status, ok: response.ok, hasOutput: !!payload?.output });
    if (!response.ok) {
      console.error("[refinePrompt] non-ok response:", { status: response.status, payload });
      return { ok: false, error: gateway.mapHttpError(response.status, payload, settings.provider) };
    }
    return gateway.parseCompletion(payload, settings.provider);
  } catch (error) {
    console.error("[refinePrompt] caught error:", { name: error?.name, message: error?.message, stack: error?.stack });
    if (error?.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT", message: "The request timed out. Try again." } };
    }
    const label = providers.getProvider(settings.provider).label;
    return { ok: false, error: { code: "NETWORK_ERROR", message: `Could not reach ${label}. Check your connection and try again.` } };
  }
}

async function testConnection() {
  const settings = await readSettings();
  const keyCheck = validation.validateApiKey(settings.apiKey, settings.provider);
  if (!keyCheck.ok) {
    console.error("[testConnection] key validation failed:", keyCheck);
    return { ok: false, error: keyCheck };
  }

  const modelCheck = validation.validateModel(settings.model, settings.provider);
  if (!modelCheck.ok) {
    console.error("[testConnection] model validation failed:", modelCheck);
    return { ok: false, error: modelCheck };
  }

  try {
    const requests = providers.buildConnectionRequests(settings.provider, keyCheck.value, modelCheck.value);
    for (const request of requests) {
      console.log("[testConnection] sending request:", { kind: request.kind, url: request.url });
      const response = await fetchWithTimeout(request.url, request.options);
      const payload = await readJson(response);
      console.log("[testConnection] response:", { kind: request.kind, status: response.status, ok: response.ok, payload });
      if (!response.ok) {
        return { ok: false, error: gateway.mapHttpError(response.status, payload, settings.provider) };
      }
      if (request.kind === "key" && gateway.hasExhaustedCredits(payload)) {
        console.error("[testConnection] credits exhausted:", payload?.data);
        return {
          ok: false,
          error: {
            code: "BUDGET_EXHAUSTED",
            message: "OpenRouter credits are exhausted. Add credits or increase the key limit."
          }
        };
      }
    }
    console.log("[testConnection] success");
    return { ok: true, provider: settings.provider, model: modelCheck.value };
  } catch (error) {
    console.error("[testConnection] caught error:", { name: error?.name, message: error?.message, stack: error?.stack });
    if (error?.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT", message: "The connection test timed out." } };
    }
    const label = providers.getProvider(settings.provider).label;
    return { ok: false, error: { code: "NETWORK_ERROR", message: `Could not reach ${label}.` } };
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
