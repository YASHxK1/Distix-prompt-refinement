const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

check(manifest.manifest_version === 3, "manifest_version must be 3");
check(JSON.stringify(manifest.permissions) === JSON.stringify(["storage"]), "only the storage permission is allowed");
check(!manifest.permissions.includes("activeTab"), "activeTab must not be requested");
check(!manifest.permissions.includes("scripting"), "scripting must not be requested");

const expectedHosts = new Set([
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://chat.deepseek.com/*",
  "https://ai-gateway.vercel.sh/*",
  "https://openrouter.ai/*"
]);
check(manifest.host_permissions.length === expectedHosts.size, "unexpected host permission count");
for (const host of manifest.host_permissions) {
  check(expectedHosts.has(host), `unexpected host permission: ${host}`);
}

const referencedFiles = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap((entry) => [...entry.js, ...entry.css])
];
for (const file of referencedFiles) {
  check(fs.existsSync(path.join(root, file)), `missing manifest file: ${file}`);
}

const sourceFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(js|html)$/.test(entry.name)) sourceFiles.push(fullPath);
  }
}
walk(root);

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const remoteScripts = source.match(/<script[^>]+src=["']https?:\/\//gi) || [];
  check(remoteScripts.length === 0, `remote executable script found in ${path.relative(root, file)}`);
  check(!/\beval\s*\(/.test(source), `eval found in ${path.relative(root, file)}`);
  check(!/\bnew\s+Function\s*\(/.test(source), `new Function found in ${path.relative(root, file)}`);
}

check(fs.existsSync(path.join(root, "PRIVACY.md")), "PRIVACY.md is required");
check(fs.existsSync(path.join(root, "store", "README.md")), "store readiness checklist is required");

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Readiness check passed: ${referencedFiles.length} manifest assets, ${sourceFiles.length} source files.`);
