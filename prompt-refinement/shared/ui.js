(function initUi(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};

  function setStatus(element, message, tone) {
    element.textContent = message || "";
    element.dataset.tone = tone || "";
    element.hidden = !message;
  }

  function ensureSingleElement(container, id, createElement) {
    const existing = container.querySelector(`#${id}`);
    if (existing) return existing;
    const element = createElement();
    element.id = id;
    container.appendChild(element);
    return element;
  }

  async function copyText(text) {
    if (!text) throw new Error("Nothing to copy.");
    await navigator.clipboard.writeText(text);
  }

  namespace.ui = { setStatus, ensureSingleElement, copyText };

  if (typeof module !== "undefined") {
    module.exports = namespace.ui;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
