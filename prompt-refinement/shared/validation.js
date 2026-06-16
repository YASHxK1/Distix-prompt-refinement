(function initValidation(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};
  const MODEL_PATTERN = /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:-]*$/i;

  function validatePrompt(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return { ok: false, code: "EMPTY_PROMPT", message: "Enter a prompt to refine." };
    }
    if (value.length > 100000) {
      return { ok: false, code: "PROMPT_TOO_LONG", message: "The prompt is too long to refine." };
    }
    return { ok: true, value };
  }

  function providerLabel(provider) {
    if (provider === "openrouter") return "OpenRouter";
    return "Vercel AI Gateway";
  }

  function validateProvider(value) {
    if (value === "vercel" || value === "openrouter") {
      return { ok: true, value };
    }
    return { ok: false, code: "INVALID_PROVIDER", message: "Choose Vercel or OpenRouter in Settings." };
  }

  function validateApiKey(value, provider) {
    const label = providerLabel(provider);
    if (typeof value !== "string" || value.trim().length === 0) {
      return { ok: false, code: "MISSING_API_KEY", message: `Add your ${label} API key in Settings.` };
    }
    const trimmed = value.trim();
    if (trimmed.length < 12 || /\s/.test(trimmed)) {
      return { ok: false, code: "INVALID_API_KEY", message: `The saved ${label} API key appears invalid. Update it in Settings.` };
    }
    return { ok: true, value: trimmed };
  }

  function validateModel(value, provider) {
    const label = providerLabel(provider);
    if (typeof value !== "string" || value.trim().length === 0) {
      return { ok: false, code: "MISSING_MODEL", message: `Choose a ${label} model in Settings.` };
    }
    const model = value.trim();
    if (model.length > 160 || !MODEL_PATTERN.test(model)) {
      const example = provider === "openrouter"
        ? "openai/gpt-4o"
        : "deepseek/deepseek-v4-pro";
      return { ok: false, code: "INVALID_MODEL", message: `Use an identifier such as ${example}.` };
    }
    return { ok: true, value: model };
  }

  namespace.validation = { validatePrompt, validateProvider, validateApiKey, validateModel };

  if (typeof module !== "undefined") {
    module.exports = namespace.validation;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
