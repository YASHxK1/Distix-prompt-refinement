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

  function validateApiKey(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return { ok: false, code: "MISSING_API_KEY", message: "Add your AI Gateway API key in Settings." };
    }
    if (value.trim().length < 12 || /\s/.test(value.trim())) {
      return { ok: false, code: "INVALID_API_KEY", message: "The saved API key appears invalid. Update it in Settings." };
    }
    return { ok: true, value: value.trim() };
  }

  function validateModel(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return { ok: false, code: "MISSING_MODEL", message: "Choose an AI Gateway model in Settings." };
    }
    const model = value.trim();
    if (model.length > 160 || !MODEL_PATTERN.test(model)) {
      return { ok: false, code: "INVALID_MODEL", message: "Use a Gateway model ID such as deepseek/deepseek-v4-pro." };
    }
    return { ok: true, value: model };
  }

  namespace.validation = { validatePrompt, validateApiKey, validateModel };

  if (typeof module !== "undefined") {
    module.exports = namespace.validation;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
