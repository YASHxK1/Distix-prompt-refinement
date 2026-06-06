# prompt-refinement

A Chrome Manifest V3 extension that refines prompts through Vercel AI Gateway in ChatGPT, Claude, DeepSeek, or a standalone toolbar popup.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this repository.
4. Open the extension Settings page and save a Vercel AI Gateway API key and model.

The default model is `deepseek/deepseek-v4-pro`.

## Development

The extension uses vanilla HTML, CSS, and JavaScript with no bundler or runtime dependencies.

```powershell
npm test
npm run check
```

Regenerate packaged PNG icons with:

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-icons.ps1
```

## Security and privacy

The service worker reads credentials directly from trusted extension storage. Content scripts receive only refinement results and never receive the API key. Prompts are sent only after an explicit Refine action. See `PRIVACY.md` for the full disclosure.
