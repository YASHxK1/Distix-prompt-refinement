const test = require("node:test");
const assert = require("node:assert/strict");
const validation = require("../shared/validation.js");

test("rejects empty prompts and preserves valid prompt whitespace", () => {
  assert.equal(validation.validatePrompt(" \n ").code, "EMPTY_PROMPT");
  assert.deepEqual(validation.validatePrompt("  keep this  "), {
    ok: true,
    value: "  keep this  "
  });
});

test("validates API keys without relying on a provider-specific prefix", () => {
  assert.equal(validation.validateApiKey("").code, "MISSING_API_KEY");
  assert.equal(validation.validateApiKey("too short").code, "INVALID_API_KEY");
  assert.equal(validation.validateApiKey("example-key-value-123").ok, true);
});

test("requires provider/model identifiers", () => {
  assert.equal(validation.validateModel("").code, "MISSING_MODEL");
  assert.equal(validation.validateModel("gpt-5.4").code, "INVALID_MODEL");
  assert.deepEqual(validation.validateModel(" deepseek/deepseek-v4-pro "), {
    ok: true,
    value: "deepseek/deepseek-v4-pro"
  });
});

test("validates supported providers and OpenRouter model variants", () => {
  assert.deepEqual(validation.validateProvider("openrouter"), { ok: true, value: "openrouter" });
  assert.equal(validation.validateProvider("other").code, "INVALID_PROVIDER");
  assert.equal(validation.validateModel("google/gemini-2.0-flash", "openrouter").ok, true);
  assert.equal(validation.validateModel("meta-llama/llama-3.3-70b-instruct:free", "openrouter").ok, true);
});

test("rejects disabled Bedrock provider", () => {
  assert.equal(validation.validateProvider("bedrock").code, "INVALID_PROVIDER");
});

test("does not log API key details during validation", () => {
  const originalWarn = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    validation.validateApiKey("too short");
    validation.validateApiKey("example-key-value-123");
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(calls, []);
});
