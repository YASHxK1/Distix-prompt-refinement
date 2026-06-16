# Prompt Refinement

Turn rough instructions into clearer, more specific, and better-structured prompts without leaving your AI chat.

Prompt Refinement is a Chrome extension that works directly with:

- ChatGPT
- Claude
- DeepSeek
- The extension's standalone popup

It uses your own Vercel AI Gateway or OpenRouter API key and model. A prompt is processed only when you select **Refine**.

## What It Does

The extension rewrites your prompt while preserving its original:

- Intent and important details
- Constraints and language
- Meaningful formatting and line breaks

It aims to improve clarity and structure without adding unnecessary requirements or changing what you are asking for.

The extension only rewrites the prompt. It never sends the prompt to ChatGPT, Claude, or DeepSeek for you.

## What You Need

- Google Chrome 102 or newer
- A Vercel AI Gateway or OpenRouter API key
- Access to a model through the selected provider

The default model is:

```text
deepseek/deepseek-v4-pro
```

You can replace it with another model ID supported by the selected provider.

## Install the Extension

This repository can be installed locally as an unpacked Chrome extension:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** in the top-right corner.
4. Select **Load unpacked**.
5. Choose the `prompt-refinement` folder containing `manifest.json`.
6. Pin **Prompt Refinement** from Chrome's Extensions menu for easier access.

Chrome may ask you to reload the extension after files are updated.

## Set It Up

1. Select the **Prompt Refinement** icon in the Chrome toolbar.
2. Select **Settings**.
3. Choose **Vercel AI Gateway** or **OpenRouter**.
4. Enter the selected provider's API key.
5. Enter a model ID in `provider/model` format.
6. Select **Save**.
7. Select **Test connection** to verify the key and model.

Example model ID:

```text
deepseek/deepseek-v4-pro
```

The connection test validates the selected provider's saved key and model. It does not send a prompt or generate model tokens.

## Use It on an AI Website

1. Open [ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), or [DeepSeek](https://chat.deepseek.com).
2. Write or paste a prompt into the site's message box.
3. Select the **Refine** button added near the message box.
4. Wait for the revised prompt to replace the original text.
5. Review and edit the result before sending it.

The extension does not automatically submit your message.

If you edit the prompt while refinement is still running, the extension preserves your newer text instead of overwriting it.

## Use the Popup

You can refine text without opening a supported AI website:

1. Select the extension icon in the Chrome toolbar.
2. Write or paste a rough prompt.
3. Select **Refine**.
4. Review the refined result.
5. Select **Copy** and paste it wherever you need it.

Your original text remains visible in the popup so you can compare it with the refined version.

## Change the Model

Open the extension popup and select **Settings**. Enter a model identifier in this format:

```text
provider/model
```

Then select **Save** or **Test connection**. Testing also saves the values currently entered on the page. The extension retains separate keys and models for Vercel and OpenRouter.

The provider and model settings are stored with Chrome Sync when browser sync is enabled. API keys are stored only in Chrome's local extension storage on the current device.

## Privacy and Security

- Prompts are sent only after you explicitly select **Refine**.
- The extension does not store prompt history.
- The extension does not collect analytics or advertising data.
- The API key is not exposed to ChatGPT, Claude, DeepSeek, or the content scripts running on those pages.
- The trusted extension service worker sends the prompt and active API key only to the selected provider.
- Vercel AI Gateway may route requests to the provider of the selected model. OpenRouter requests are sent directly to OpenRouter.
- The extension does not automatically submit prompts to any website.

Use of Vercel AI Gateway, OpenRouter, and model providers is subject to their respective terms and privacy policies. See [PRIVACY.md](prompt-refinement/PRIVACY.md) for the complete data-handling policy.

## Permissions

The extension requests only:

- **Storage:** saves provider-specific API keys and models plus the active provider.
- **ChatGPT, Claude, and DeepSeek access:** adds the Refine button and updates the message box.
- **Vercel AI Gateway access:** sends refinement requests after you select Refine.
- **OpenRouter access:** sends refinement requests when OpenRouter is selected.

It does not request browsing history, `activeTab`, scripting, analytics, or a general clipboard permission.

## Troubleshooting

### The Refine button does not appear

- Confirm the extension is enabled at `chrome://extensions`.
- Reload the ChatGPT, Claude, or DeepSeek page.
- Confirm you are using a supported address:
  - `https://chatgpt.com`
  - `https://claude.ai`
  - `https://chat.deepseek.com`
- If the website recently changed its interface, the extension's page integration may need an update.

### The extension asks for an API key

Open **Settings**, choose the provider, enter a valid API key, and select **Save**. The key must not contain spaces.

### Authentication failed

The saved API key was rejected. Replace it in **Settings**, save it, and run **Test connection** again.

### The model is invalid or unavailable

Check that the model uses the `provider/model` format and is available through the selected provider.

### The budget is exhausted

Check the billing, credits, and key limits associated with the selected provider.

### The request timed out or the provider is unavailable

Check your internet connection and try again. Requests stop after 30 seconds. Temporary provider outages may also cause this message.

### My text was not replaced

The extension intentionally leaves the original text unchanged when:

- The request fails.
- The page's message box changes while the request is running.
- You edit the prompt before refinement finishes.
- The model returns an empty or invalid response.

## Remove Saved Data

To remove an API key:

1. Open the extension's **Settings** page.
2. Select its provider.
3. Select **Clear key**.

Removing the extension clears its local extension data. Provider and model settings may also exist in Chrome Sync and can be managed through Chrome's sync settings.

## For Developers

The extension uses Manifest V3 with vanilla HTML, CSS, and JavaScript. It has no bundler or runtime package dependencies.

Run the automated tests and release-readiness checks with:

```powershell
npm test
npm run check
```

For a technical explanation of request handling, storage boundaries, and error mapping, see [BACKEND_FLOW.md](BACKEND_FLOW.md).
