(function initConstants(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};

  namespace.constants = Object.freeze({
    DEFAULT_MODEL: "deepseek/deepseek-v4-pro",
    GATEWAY_BASE_URL: "https://ai-gateway.vercel.sh/v1",
    REQUEST_TIMEOUT_MS: 30000,
    STORAGE_KEYS: Object.freeze({
      API_KEY: "apiKey",
      MODEL: "model"
    }),
    MESSAGE_TYPES: Object.freeze({
      REFINE_PROMPT: "REFINE_PROMPT",
      TEST_CONNECTION: "TEST_CONNECTION"
    })
  });

  if (typeof module !== "undefined") {
    module.exports = namespace.constants;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
