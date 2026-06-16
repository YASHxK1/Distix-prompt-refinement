(function initProviders(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};
  const constants = namespace.constants || (typeof require !== "undefined" ? require("./constants.js") : null);

  const definitions = Object.freeze({
    [constants.PROVIDERS.VERCEL]: Object.freeze({
      id: constants.PROVIDERS.VERCEL,
      label: "Vercel AI Gateway",
      defaultModel: constants.DEFAULT_MODEL,
      apiKeyStorageKey: constants.STORAGE_KEYS.API_KEY,
      modelStorageKey: constants.STORAGE_KEYS.MODEL
    }),
    [constants.PROVIDERS.OPENROUTER]: Object.freeze({
      id: constants.PROVIDERS.OPENROUTER,
      label: "OpenRouter",
      defaultModel: constants.DEFAULT_OPENROUTER_MODEL,
      apiKeyStorageKey: constants.STORAGE_KEYS.OPENROUTER_API_KEY,
      modelStorageKey: constants.STORAGE_KEYS.OPENROUTER_MODEL
    })
  });

  function getProvider(value) {
    return definitions[value] || definitions[constants.DEFAULT_PROVIDER];
  }

  function buildCompletionRequest(provider, apiKey, model, messages) {
    const definition = getProvider(provider);
    const baseUrl = definition.id === constants.PROVIDERS.OPENROUTER
      ? constants.OPENROUTER_BASE_URL
      : constants.GATEWAY_BASE_URL;

    return {
      url: `${baseUrl}/chat/completions`,
      options: {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, messages, stream: false })
      }
    };
  }

  function buildConnectionRequests(provider, apiKey, model) {
    const definition = getProvider(provider);
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    const modelPath = model.split("/").map(encodeURIComponent).join("/");

    if (definition.id === constants.PROVIDERS.OPENROUTER) {
      return [
        { kind: "key", url: `${constants.OPENROUTER_BASE_URL}/key`, options: { headers } },
        { kind: "model", url: `${constants.OPENROUTER_BASE_URL}/model/${modelPath}`, options: { headers } }
      ];
    }

    return [{
      kind: "model",
      url: `${constants.GATEWAY_BASE_URL}/models/${modelPath}`,
      options: { headers }
    }];
  }

  namespace.providers = {
    definitions,
    getProvider,
    buildCompletionRequest,
    buildConnectionRequests
  };

  if (typeof module !== "undefined") {
    module.exports = namespace.providers;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
