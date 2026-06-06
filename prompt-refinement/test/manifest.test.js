const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

test("manifest requests only the intended extension permission", () => {
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.permissions.includes("activeTab"), false);
  assert.equal(manifest.permissions.includes("scripting"), false);
});

test("manifest host access is limited to supported sites and AI Gateway", () => {
  assert.deepEqual(manifest.host_permissions.sort(), [
    "https://ai-gateway.vercel.sh/*",
    "https://chat.deepseek.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*"
  ]);
});

test("all manifest-referenced local files exist", () => {
  const files = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    manifest.options_page,
    ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap((entry) => [...entry.js, ...entry.css])
  ];
  for (const file of files) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});
