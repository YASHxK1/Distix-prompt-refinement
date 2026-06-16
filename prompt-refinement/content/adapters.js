(function initAdapters(root) {
  const namespace = root.PromptRefinement = root.PromptRefinement || {};

  function queryFirst(selectors, scope) {
    const target = scope || document;
    for (const selector of selectors) {
      const element = target.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  function getText(element) {
    if (!element) return "";
    if ("value" in element) return element.value || "";
    return element.innerText || element.textContent || "";
  }

  function dispatchEditEvents(element, inputType) {
    try {
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: inputType || "insertText",
        data: null
      }));
    } catch {
      element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function replaceTextarea(element, text) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value")
      || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")
      || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (descriptor?.set) descriptor.set.call(element, text);
    else element.value = text;
    dispatchEditEvents(element, "insertText");
  }

  function replaceContentEditable(element, text) {
    element.focus();
    let inserted = false;

    if (typeof document.execCommand === "function") {
      const selection = window.getSelection?.();
      if (selection && typeof document.createRange === "function") {
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        inserted = document.execCommand("insertText", false, text);
      }
    }

    if (!inserted) {
      element.replaceChildren();
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (index > 0) element.appendChild(document.createElement("br"));
        element.appendChild(document.createTextNode(line));
      });
    }
    dispatchEditEvents(element, "insertText");
  }

  function replaceText(element, text) {
    if (!element) throw new Error("Composer is unavailable.");
    if ("value" in element && !element.isContentEditable) replaceTextarea(element, text);
    else replaceContentEditable(element, text);
  }

  function createAdapter(config) {
    return {
      id: config.id,
      matches: () => config.hosts.includes(location.hostname),
      findComposer: () => queryFirst(config.composerSelectors),
      buttonPlacement: config.buttonPlacement || { leftOffset: 0, topOffset: 16 },
      getText,
      replaceText,
      findMount(composer) {
        const localMount = queryFirst(config.mountSelectors, composer.closest("form") || composer.parentElement);
        return localMount || composer.parentElement;
      }
    };
  }

  const adapters = [
    createAdapter({
      id: "chatgpt",
      hosts: ["chatgpt.com"],
      composerSelectors: [
        "#prompt-textarea",
        "textarea[data-id='root']",
        "div[contenteditable='true'][data-virtualkeyboard='true']"
      ],
      mountSelectors: [
        "[data-testid='composer-footer-actions']",
        "[class*='composer-footer']",
        "[class*='composer'] [class*='actions']"
      ],
      buttonPlacement: { leftOffset: 32, topOffset: 16 }
    }),
    createAdapter({
      id: "claude",
      hosts: ["claude.ai"],
      composerSelectors: [
        "div[contenteditable='true'][data-testid*='input']",
        "div.ProseMirror[contenteditable='true']",
        "fieldset div[contenteditable='true']"
      ],
      mountSelectors: [
        "[data-testid*='composer'] [class*='items-center']",
        "fieldset [class*='items-center']",
        "fieldset"
      ],
      buttonPlacement: { leftOffset: 10, topOffset: 20 }
    }),
    createAdapter({
      id: "deepseek",
      hosts: ["chat.deepseek.com"],
      composerSelectors: [
        "textarea#chat-input",
        "textarea[placeholder]",
        "div[contenteditable='true']"
      ],
      mountSelectors: [
        "textarea ~ div",
        "[class*='input'] [class*='button']",
        "[class*='composer']"
      ],
      buttonPlacement: { leftOffset: -15, topOffset: 2.5 }
    })
  ];

  function getActiveAdapter() {
    return adapters.find((adapter) => adapter.matches()) || null;
  }

  namespace.adapters = {
    adapters,
    getActiveAdapter,
    queryFirst,
    getText,
    replaceText,
    replaceTextarea,
    replaceContentEditable
  };

  if (typeof module !== "undefined") {
    module.exports = namespace.adapters;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
