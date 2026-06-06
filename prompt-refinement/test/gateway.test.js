const test = require("node:test");
const assert = require("node:assert/strict");
const gateway = require("../shared/gateway.js");

test("parses string completion content", () => {
  assert.deepEqual(gateway.parseCompletion({
    choices: [{ message: { content: "  Refined prompt\nwith lines  " } }]
  }), {
    ok: true,
    text: "Refined prompt\nwith lines"
  });
});

test("parses text-part completion content", () => {
  assert.deepEqual(gateway.parseCompletion({
    choices: [{ message: { content: [
      { type: "text", text: "First" },
      { type: "text", text: " line" }
    ] } }]
  }), {
    ok: true,
    text: "First line"
  });
});

test("rejects malformed and empty model responses", () => {
  assert.equal(gateway.parseCompletion({}).error.code, "EMPTY_RESPONSE");
  assert.equal(gateway.parseCompletion({
    choices: [{ message: { content: "   " } }]
  }).error.code, "EMPTY_RESPONSE");
});

test("maps authentication, budget, rate, server, and model failures", () => {
  assert.equal(gateway.mapHttpError(401, {}).code, "AUTH_FAILED");
  assert.equal(gateway.mapHttpError(403, {}).code, "AUTH_FAILED");
  assert.equal(gateway.mapHttpError(402, {}).code, "BUDGET_EXHAUSTED");
  assert.equal(gateway.mapHttpError(429, {}).code, "RATE_LIMITED");
  assert.equal(gateway.mapHttpError(503, {}).code, "GATEWAY_UNAVAILABLE");
  assert.equal(gateway.mapHttpError(400, { error: { message: "Unknown model" } }).code, "INVALID_MODEL");
});
