const test = require("node:test");
const assert = require("node:assert/strict");

function makeEvent(type) {
  return class {
    constructor(eventType, options) {
      this.type = eventType || type;
      Object.assign(this, options);
    }
  };
}

global.Event = makeEvent("event");
global.InputEvent = makeEvent("input");
global.HTMLTextAreaElement = class {};
global.HTMLInputElement = class {};

const adapters = require("../content/adapters.js");

test("reads textarea and contenteditable text", () => {
  assert.equal(adapters.getText({ value: "textarea" }), "textarea");
  assert.equal(adapters.getText({ innerText: "editable" }), "editable");
});

test("replaces textarea text and dispatches input and change events", () => {
  const events = [];
  const prototype = {
    set value(nextValue) {
      this._value = nextValue;
    }
  };
  const element = Object.create(prototype);
  element.dispatchEvent = (event) => events.push(event.type);

  adapters.replaceTextarea(element, "line one\nline two");

  assert.equal(element._value, "line one\nline two");
  assert.deepEqual(events, ["input", "change"]);
});

test("replaces contenteditable text while preserving line breaks", () => {
  const events = [];
  const children = [];
  global.window = { getSelection: () => null };
  global.document = {
    execCommand: undefined,
    createElement: (tagName) => ({ tagName }),
    createTextNode: (text) => ({ text })
  };
  const element = {
    focus() {},
    replaceChildren() {
      children.length = 0;
    },
    appendChild(child) {
      children.push(child);
    },
    dispatchEvent(event) {
      events.push(event.type);
    }
  };

  adapters.replaceContentEditable(element, "first\nsecond");

  assert.deepEqual(children, [
    { text: "first" },
    { tagName: "br" },
    { text: "second" }
  ]);
  assert.deepEqual(events, ["input", "change"]);
});

test("defines isolated adapters for all supported hosts", () => {
  assert.deepEqual(adapters.adapters.map((adapter) => adapter.id), [
    "chatgpt",
    "claude",
    "deepseek"
  ]);
});
