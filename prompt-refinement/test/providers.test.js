const test = require("node:test");
const assert = require("node:assert/strict");
const constants = require("../shared/constants.js");
const providers = require("../shared/providers.js");

test("defaults unknown providers to Vercel without changing legacy storage keys", () => {
  const provider = providers.getProvider("unknown");

  assert.equal(provider.id, constants.PROVIDERS.VERCEL);
  assert.equal(provider.apiKeyStorageKey, "apiKey");
  assert.equal(provider.modelStorageKey, "model");
});

test("falls back from disabled Bedrock provider to Vercel", () => {
  const provider = providers.getProvider(constants.PROVIDERS.BEDROCK);

  assert.equal(provider.id, constants.PROVIDERS.VERCEL);
  assert.equal(provider.apiKeyStorageKey, "apiKey");
  assert.equal(provider.modelStorageKey, "model");
});

test("builds OpenRouter chat completion requests", () => {
  const request = providers.buildCompletionRequest(
    constants.PROVIDERS.OPENROUTER,
    "openrouter-key-value",
    "openai/gpt-4o",
    [{ role: "user", content: "Prompt" }]
  );

  assert.equal(request.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(request.options.headers.Authorization, "Bearer openrouter-key-value");
  assert.deepEqual(JSON.parse(request.options.body), {
    model: "openai/gpt-4o",
    messages: [{ role: "user", content: "Prompt" }],
    stream: false
  });
});

test("builds provider-specific connection checks", () => {
  const openRouter = providers.buildConnectionRequests(
    constants.PROVIDERS.OPENROUTER,
    "openrouter-key-value",
    "anthropic/claude-3.5-sonnet"
  );
  assert.deepEqual(openRouter.map((request) => request.url), [
    "https://openrouter.ai/api/v1/key",
    "https://openrouter.ai/api/v1/model/anthropic/claude-3.5-sonnet"
  ]);

  const vercel = providers.buildConnectionRequests(
    constants.PROVIDERS.VERCEL,
    "vercel-key-value",
    "deepseek/deepseek-v4-pro"
  );
  assert.equal(vercel[0].url, "https://ai-gateway.vercel.sh/v1/models/deepseek/deepseek-v4-pro");
});
