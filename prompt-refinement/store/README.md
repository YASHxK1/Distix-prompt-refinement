# Chrome Web Store Readiness

## Automated

- Run `npm test`.
- Run `npm run check`.
- Confirm the package contains no `node_modules`, secrets, build output, or remotely hosted executable code.

## Listing assets required before publication

- 128x128 extension icon: `icons/icon-128.png`
- At least one 1280x800 or 640x400 screenshot
- Store description matching actual functionality
- Publicly hosted privacy policy matching `PRIVACY.md`
- Support contact and publisher information

## Manual verification

- Load the repository root through `chrome://extensions` using **Load unpacked**.
- Test logged-in ChatGPT, Claude, and DeepSeek sessions in light and dark themes.
- Confirm one Refine button appears and remounts after navigation or composer rerenders.
- Confirm refinement preserves line breaks, focuses the composer, and never submits.
- Confirm empty prompts, bad keys, invalid models, 401/403, 402, 429, timeouts, and malformed responses preserve the original prompt.
- Confirm editing the prompt while refinement is running preserves the newer text.
- Test popup refinement, comparison, copying, errors, and Settings navigation.
- Test Save, Clear key, and Test connection.
- Reload the extension and restart Chrome to verify local key and synced model persistence.
- Inspect service-worker and content-script consoles for errors.

## Permission justification

- `storage`: stores the user's API key locally and selected model in sync storage.
- Supported-site host access: mounts and operates the composer Refine control.
- `https://ai-gateway.vercel.sh/*`: sends explicit refinement requests from the service worker.

No `activeTab`, `scripting`, analytics, history, clipboard permission, or remotely hosted code is used.
