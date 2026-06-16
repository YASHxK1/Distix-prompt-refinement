(function initGateway(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};

  function extractErrorMessage(payload) {
    if (!payload || typeof payload !== "object") return "";
    if (typeof payload.error === "string") return payload.error;
    if (payload.error && typeof payload.error.message === "string") return payload.error.message;
    if (typeof payload.message === "string") return payload.message;
    return "";
  }

  function getProviderLabel(provider) {
    if (provider === "openrouter") return "OpenRouter";
    return "AI Gateway";
  }

  function mapHttpError(status, payload, provider) {
    const label = getProviderLabel(provider);
    if (status === 401 || status === 403) {
      return { code: "AUTH_FAILED", message: `Authentication failed. Check your ${label} API key.` };
    }
    if (status === 402) {
      return { code: "BUDGET_EXHAUSTED", message: `${label} credits are exhausted. Check billing or budget limits.` };
    }
    if (status === 408) {
      return { code: "TIMEOUT", message: `The ${label} request timed out. Try again.` };
    }
    if (status === 429) {
      return { code: "RATE_LIMITED", message: `${label} is rate limiting requests. Wait a moment and try again.` };
    }
    if (status >= 500) {
      return {
        code: (provider === "vercel" || !provider) ? "GATEWAY_UNAVAILABLE" : "PROVIDER_UNAVAILABLE",
        message: `${label} is temporarily unavailable. Try again shortly.`
      };
    }

    const detail = extractErrorMessage(payload).toLowerCase();
    if (status === 404 || detail.includes("model")) {
      return { code: "INVALID_MODEL", message: "The selected model is unavailable or invalid. Update it in Settings." };
    }
    return {
      code: (provider === "vercel" || !provider) ? "GATEWAY_REQUEST_FAILED" : "PROVIDER_REQUEST_FAILED",
      message: `${label} rejected the request. Check the model and try again.`
    };
  }

  function hasExhaustedCredits(payload) {
    const remaining = payload?.data?.limit_remaining;
    return typeof remaining === "number" && remaining <= 0;
  }

  function parseCompletion(payload, provider) {
    const content = payload?.choices?.[0]?.message?.content;
    let text = "";

    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content
        .filter((part) => part && (part.type === "text" || typeof part.text === "string"))
        .map((part) => part.text || "")
        .join("");
    }

    if (!text.trim()) {
      return {
        ok: false,
        error: {
          code: "EMPTY_RESPONSE",
          message: "The model returned no refined prompt. Try again or choose another model."
        }
      };
    }
    return { ok: true, text: text.trim() };
  }

  namespace.gateway = { extractErrorMessage, mapHttpError, hasExhaustedCredits, parseCompletion };

  if (typeof module !== "undefined") {
    module.exports = namespace.gateway;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
