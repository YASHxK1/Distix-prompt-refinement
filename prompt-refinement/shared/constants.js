(function initConstants(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};

  namespace.constants = Object.freeze({
    DEFAULT_MODEL: "deepseek/deepseek-v4-pro",
    DEFAULT_OPENROUTER_MODEL: "openai/gpt-4o",
    DEFAULT_BEDROCK_MODEL: "us.anthropic.claude-sonnet-4-6",
    DEFAULT_BEDROCK_REGION: "us-east-1",
    DEFAULT_PROVIDER: "vercel",
    GATEWAY_BASE_URL: "https://ai-gateway.vercel.sh/v1",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    REQUEST_TIMEOUT_MS: 30000,
    PROVIDERS: Object.freeze({
      VERCEL: "vercel",
      OPENROUTER: "openrouter",
      BEDROCK: "bedrock"
    }),
    STORAGE_KEYS: Object.freeze({
      API_KEY: "apiKey",
      MODEL: "model",
      OPENROUTER_API_KEY: "openRouterApiKey",
      OPENROUTER_MODEL: "openRouterModel",
      BEDROCK_API_KEY: "bedrockApiKey",
      BEDROCK_MODEL: "bedrockModel",
      BEDROCK_REGION: "bedrockRegion",
      PROVIDER: "provider"
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
