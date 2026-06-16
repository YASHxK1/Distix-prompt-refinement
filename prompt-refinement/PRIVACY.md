# Privacy Policy

Last updated: June 16, 2026

`prompt-refinement` refines text only when the user explicitly selects **Refine**.

## Data processed

- The prompt entered in a supported website composer or the extension popup.
- User-provided Vercel AI Gateway and OpenRouter API keys.
- The selected provider and provider-specific model identifiers.

## Storage

- API keys are stored separately in `chrome.storage.local` on the user's device.
- The selected provider and provider-specific model identifiers are stored in `chrome.storage.sync` and may be synchronized by Chrome when browser sync is enabled.
- Storage access is restricted to trusted extension contexts. Content scripts and visited websites cannot read these values through the extension.
- The extension does not store prompt history.

## Data transfer

When the user selects **Refine**, the current prompt, fixed refinement instructions, and selected model identifier are sent to the selected provider. Vercel AI Gateway may route the request to the model provider. OpenRouter requests are sent directly to OpenRouter. Only the API key for the active provider is sent for authentication.

When the user selects **Test connection**, the extension sends authenticated metadata requests to the selected provider to validate the key and model. The test does not send the user's prompt or request a model completion.

The extension does not sell data, use data for advertising, run analytics, or automatically submit prompts to supported websites.

## Data removal

Users can clear each provider's API key from the extension settings. Removing the extension clears its local extension storage. Chrome sync data is managed through Chrome's sync controls.

## Third parties

Use of Vercel AI Gateway, OpenRouter, and selected model providers is subject to their terms and privacy policies.
