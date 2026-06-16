const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const constants = require("../shared/constants.js");
const providers = require("../shared/providers.js");
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

function setupContentScriptPlacementTest(buttonPlacement) {
  const composer = {
    getBoundingClientRect() {
      return { left: 120, top: 230 };
    }
  };
  const elements = {};
  const listeners = {};

  global.PromptRefinement = {
    constants,
    validation,
    ui,
    adapters: {
      getActiveAdapter() {
        return {
          buttonPlacement,
          findComposer: () => composer,
          getText: () => "rough prompt",
          replaceText() {}
        };
      }
    }
  };
  global.document = {
    body: {
      appendChild(element) {
        elements[element.id] = element;
        element.parentElement = this;
      }
    },
    documentElement: {},
    createElement() {
      return {
        style: {},
        offsetHeight: 30,
        setAttribute() {},
        addEventListener() {}
      };
    },
    getElementById(id) {
      return elements[id] || null;
    }
  };
  global.window = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    }
  };
  global.MutationObserver = class {
    constructor(listener) {
      this.listener = listener;
    }
    observe() {}
  };

  loadScript("content/content-script.js");

  return { button: elements["prompt-refinement-button"], listeners };
}

test("content script applies chatgpt floating button offsets", () => {
  const { button, listeners } = setupContentScriptPlacementTest({ leftOffset: 32, topOffset: 16 });

  assert.equal(button.style.left, "88px");
  assert.equal(button.style.top, "176px");
  assert.equal(typeof listeners.resize, "function");
  assert.equal(typeof listeners.scroll, "function");
});

test("content script can align floating button to composer edge", () => {
  const { button } = setupContentScriptPlacementTest({ leftOffset: 0, topOffset: 16 });

  assert.equal(button.style.left, "120px");
  assert.equal(button.style.top, "176px");
});

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
    provider: createElement("vercel"),
    "api-key": createElement(),
    "api-key-label": createElement(),
    model: createElement(),
    "model-label": createElement(),
    "model-hint": createElement(),
    "key-state": createElement(),
    status: createElement(),
    test: createElement(),
    "clear-key": createElement()
  };
  const local = {};
  const sync = {};
  let tested = false;
  const consoleCalls = [];
  const originalLog = console.log;

  global.PromptRefinement = { constants, providers, validation, ui };
  global.document = { getElementById: (id) => elements[id] };
  global.chrome = {
    storage: {
      local: {
        async get(key) {
          const keys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map((item) => [item, local[item]]));
        },
        async set(values) { Object.assign(local, values); },
        async remove(key) { delete local[key]; }
      },
      sync: {
        async get(key) {
          const keys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map((item) => [item, sync[item]]));
        },
        async set(values) { Object.assign(sync, values); }
      }
    },
    runtime: {
      async sendMessage(message) {
        assert.equal(message.type, constants.MESSAGE_TYPES.TEST_CONNECTION);
        tested = true;
        const provider = providers.getProvider(sync.provider);
        return { ok: true, provider: provider.id, model: sync[provider.modelStorageKey] };
      }
    }
  };

  console.log = (...args) => consoleCalls.push(args);
  try {
    loadScript("options/options.js");
    await new Promise((resolve) => setImmediate(resolve));

    elements["api-key"].value = "example-key-value-123";
    elements.model.value = "deepseek/deepseek-v4-pro";
    await elements["settings-form"].trigger("submit");
    assert.equal(local.apiKey, "example-key-value-123");
    assert.equal(sync.model, "deepseek/deepseek-v4-pro");
    assert.equal(sync.provider, "vercel");

    elements.provider.value = "openrouter";
    await elements.provider.trigger("change");
    assert.equal(sync.provider, "vercel");

    elements["api-key"].value = "openrouter-key-value-123";
    elements.model.value = "openai/gpt-4o";
    await elements["settings-form"].trigger("submit");
    assert.equal(local.openRouterApiKey, "openrouter-key-value-123");
    assert.equal(sync.openRouterModel, "openai/gpt-4o");
    assert.equal(local.apiKey, "example-key-value-123");

    await elements.test.trigger("click");
    assert.equal(tested, true);

    await elements["clear-key"].trigger("click");
    assert.equal(local.openRouterApiKey, undefined);
    assert.equal(local.apiKey, "example-key-value-123");
  } finally {
    console.log = originalLog;
  }
  const logged = JSON.stringify(consoleCalls);
  assert.equal(logged.includes("example-key-value-123"), false);
  assert.equal(logged.includes("openrouter-key-value-123"), false);
  assert.equal(logged.includes("example-ke"), false);
  assert.equal(logged.includes("openrouter"), false);
});

test("options falls back from stored Bedrock provider to Vercel", async () => {
  const elements = {
    "settings-form": createElement(),
    provider: createElement("vercel"),
    "api-key": createElement(),
    "api-key-label": createElement(),
    model: createElement(),
    "model-label": createElement(),
    "model-hint": createElement(),
    "key-state": createElement(),
    status: createElement(),
    test: createElement(),
    "clear-key": createElement()
  };
  const local = {};
  const sync = { provider: "bedrock" };

  global.PromptRefinement = { constants, providers, validation, ui };
  global.document = { getElementById: (id) => elements[id] };
  global.chrome = {
    storage: {
      local: {
        async get(key) {
          const keys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map((item) => [item, local[item]]));
        },
        async set(values) { Object.assign(local, values); },
        async remove(key) { delete local[key]; }
      },
      sync: {
        async get(key) {
          const keys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map((item) => [item, sync[item]]));
        },
        async set(values) { Object.assign(sync, values); }
      }
    },
    runtime: {
      async sendMessage() {
        return { ok: true, provider: sync.provider, model: sync.model };
      }
    }
  };

  loadScript("options/options.js");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(elements.provider.value, "vercel");
  assert.equal(elements.model.value, constants.DEFAULT_MODEL);
});
