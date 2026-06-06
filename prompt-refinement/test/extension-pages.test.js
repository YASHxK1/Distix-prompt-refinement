const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const constants = require("../shared/constants.js");
const validation = require("../shared/validation.js");
const ui = require("../shared/ui.js");

function createElement(value = "") {
  const listeners = {};
  return {
    value,
    textContent: "",
    placeholder: "",
    hidden: false,
    disabled: false,
    dataset: {},
    focus() {},
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    async trigger(type) {
      return listeners[type]?.({ preventDefault() {} });
    }
  };
}

function loadScript(relativePath) {
  const resolved = path.resolve(__dirname, "..", relativePath);
  delete require.cache[resolved];
  require(resolved);
}

test("popup refines without clearing input and copies the result", async () => {
  const elements = {
    prompt: createElement("rough prompt"),
    result: createElement(),
    "result-section": createElement(),
    refine: createElement(),
    copy: createElement(),
    status: createElement(),
    "open-settings": createElement()
  };
  let copied = "";

  global.PromptRefinement = { constants, validation, ui };
  global.document = { getElementById: (id) => elements[id] };
  global.chrome = {
    runtime: {
      openOptionsPage() {},
      async sendMessage(message) {
        assert.equal(message.prompt, "rough prompt");
        return { ok: true, text: "refined prompt" };
      }
    }
  };
  Object.defineProperty(global, "navigator", {
    configurable: true,
    value: { clipboard: { writeText: async (text) => { copied = text; } } }
  });

  loadScript("popup/popup.js");
  await elements.refine.trigger("click");

  assert.equal(elements.prompt.value, "rough prompt");
  assert.equal(elements.result.value, "refined prompt");
  assert.equal(elements["result-section"].hidden, false);

  await elements.copy.trigger("click");
  assert.equal(copied, "refined prompt");
});

test("options save settings, clear the key, and test the saved connection", async () => {
  const elements = {
    "settings-form": createElement(),
    "api-key": createElement(),
    model: createElement(),
    "key-state": createElement(),
    status: createElement(),
    test: createElement(),
    "clear-key": createElement()
  };
  const local = {};
  const sync = {};
  let tested = false;

  global.PromptRefinement = { constants, validation, ui };
  global.document = { getElementById: (id) => elements[id] };
  global.chrome = {
    storage: {
      local: {
        async get(key) { return { [key]: local[key] }; },
        async set(values) { Object.assign(local, values); },
        async remove(key) { delete local[key]; }
      },
      sync: {
        async get(key) { return { [key]: sync[key] }; },
        async set(values) { Object.assign(sync, values); }
      }
    },
    runtime: {
      async sendMessage(message) {
        assert.equal(message.type, constants.MESSAGE_TYPES.TEST_CONNECTION);
        tested = true;
        return { ok: true, model: sync.model };
      }
    }
  };

  loadScript("options/options.js");
  await new Promise((resolve) => setImmediate(resolve));

  elements["api-key"].value = "example-key-value-123";
  elements.model.value = "deepseek/deepseek-v4-pro";
  await elements["settings-form"].trigger("submit");
  assert.equal(local.apiKey, "example-key-value-123");
  assert.equal(sync.model, "deepseek/deepseek-v4-pro");

  await elements.test.trigger("click");
  assert.equal(tested, true);

  await elements["clear-key"].trigger("click");
  assert.equal(local.apiKey, undefined);
});
