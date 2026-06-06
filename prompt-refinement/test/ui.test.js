const test = require("node:test");
const assert = require("node:assert/strict");
const ui = require("../shared/ui.js");

test("does not create duplicate mounted controls", () => {
  const children = [];
  const container = {
    querySelector(selector) {
      return children.find((child) => `#${child.id}` === selector) || null;
    },
    appendChild(child) {
      children.push(child);
    }
  };

  const first = ui.ensureSingleElement(container, "refine", () => ({ id: "" }));
  const second = ui.ensureSingleElement(container, "refine", () => ({ id: "" }));

  assert.equal(first, second);
  assert.equal(children.length, 1);
});
