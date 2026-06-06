# Privacy Policy

Last updated: June 6, 2026

`prompt-refinement` refines text only when the user explicitly selects **Refine**.

## Data processed

- The prompt entered in a supported website composer or the extension popup.
- A user-provided Vercel AI Gateway API key.
- A user-selected Vercel AI Gateway model identifier.

## Storage

- The API key is stored in `chrome.storage.local` on the user's device.
- The model identifier is stored in `chrome.storage.sync` and may be synchronized by Chrome when browser sync is enabled.
- Storage access is restricted to trusted extension contexts. Content scripts and visited websites cannot read these values through the extension.
- The extension does not store prompt history.

## Data transfer

When the user selects **Refine**, the current prompt, fixed refinement instructions, and selected model identifier are sent to Vercel AI Gateway. Vercel may route the request to the selected model provider. The API key is sent only to Vercel AI Gateway for authentication.

The extension does not sell data, use data for advertising, run analytics, or automatically submit prompts to supported websites.

## Data removal

Users can clear the API key from the extension settings. Removing the extension clears its local extension storage. Chrome sync data is managed through Chrome's sync controls.

## Third parties

Use of Vercel AI Gateway and the selected model provider is subject to their terms and privacy policies.
