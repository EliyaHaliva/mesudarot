// Accessibility menu: applies the visitor's display adjustments and remembers them in this browser.
// Loaded without defer in <head>, so saved adjustments apply before the first paint.
(function () {
  const root = document.documentElement;
  const storageKey = "mesudarotA11ySettings";
  const settingsVersion = 2;
  const minTextSize = -1;
  const maxTextSize = 3;
  // Must match the html[data-a11y-text-size] font sizes in styles.css.
  const textSizeLabels = { "-1": "90%", 0: "100%", 1: "115%", 2: "130%", 3: "150%" };
  const colorModes = [
    "contrast-dark",
    "contrast-light",
    "grayscale",
    "saturation-high",
    "saturation-low"
  ];
  const toggleClasses = {
    readableFont: "a11y-readable-font",
    lineHeight: "a11y-line-height",
    letterSpacing: "a11y-letter-spacing",
    highlightHeadings: "a11y-highlight-headings",
    highlightLinks: "a11y-highlight-links",
    stopAnimations: "a11y-stop-animations",
    bigCursor: "a11y-big-cursor",
    strongFocus: "a11y-strong-focus",
    highlightRegions: "a11y-highlight-regions"
  };
  const defaultSettings = {
    textSize: 0,
    colorMode: "",
    readableFont: false,
    lineHeight: false,
    letterSpacing: false,
    highlightHeadings: false,
    highlightLinks: false,
    stopAnimations: false,
    bigCursor: false,
    strongFocus: false,
    highlightRegions: false
  };
  // Keys saved by the previous version of the menu, mapped to the current settings.
  const legacySettings = {
    "large-text": { textSize: 1 },
    "small-text": { textSize: -1 },
    "high-contrast": { colorMode: "contrast-light" },
    "underline-links": { highlightLinks: true },
    "reduce-motion": { stopAnimations: true },
    "readable-font": { readableFont: true },
    "text-spacing": { lineHeight: true, letterSpacing: true },
    "focus-highlight": { strongFocus: true }
  };

  let settings = readSettings();

  function readStorage() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(value) {
    try {
      if (value === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, value);
      }
    } catch (error) {
      // Storage can be blocked (private mode, disabled cookies); the adjustments still apply.
    }
  }

  function isValidSetting(name, value) {
    if (name === "textSize") {
      return Number.isInteger(value) && value >= minTextSize && value <= maxTextSize;
    }

    if (name === "colorMode") {
      return value === "" || colorModes.includes(value);
    }

    return typeof value === "boolean";
  }

  function sanitizeSettings(candidate) {
    return Object.keys(defaultSettings).reduce((result, name) => {
      result[name] = isValidSetting(name, candidate[name]) ? candidate[name] : defaultSettings[name];
      return result;
    }, {});
  }

  function migrateLegacySettings(saved) {
    return Object.entries(legacySettings).reduce((result, [legacyName, mapped]) => {
      return saved[legacyName] === true ? { ...result, ...mapped } : result;
    }, {});
  }

  function readSettings() {
    const saved = readStorage();
    if (!saved) return { ...defaultSettings };

    try {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return { ...defaultSettings };

      return sanitizeSettings(parsed.version === settingsVersion ? parsed : migrateLegacySettings(parsed));
    } catch (error) {
      return { ...defaultSettings };
    }
  }

  function isDefault(candidate) {
    return Object.keys(defaultSettings).every((name) => candidate[name] === defaultSettings[name]);
  }

  function saveSettings() {
    writeStorage(isDefault(settings) ? null : JSON.stringify({ version: settingsVersion, ...settings }));
  }

  function applySettings() {
    if (settings.textSize === 0) {
      delete root.dataset.a11yTextSize;
    } else {
      root.dataset.a11yTextSize = String(settings.textSize);
    }

    Object.entries(toggleClasses).forEach(([name, className]) => {
      root.classList.toggle(className, settings[name]);
    });

    colorModes.forEach((mode) => {
      root.classList.toggle(`a11y-${mode}`, settings.colorMode === mode);
    });
    // Shared by both contrast modes; each mode only supplies its palette.
    root.classList.toggle("a11y-contrast", settings.colorMode.startsWith("contrast-"));

    window.dispatchEvent(new CustomEvent("mesudarot:a11y-change", {
      detail: { settings: { ...settings } }
    }));
  }

  function updateSettings(changes) {
    settings = sanitizeSettings({ ...settings, ...changes });
    applySettings();
    saveSettings();
  }

  applySettings();

  window.MesudarotA11y = {
    getSettings: () => ({ ...settings })
  };

  function setupMenu() {
    const launcher = document.querySelector("[data-a11y-open]");
    const panel = document.getElementById("a11y-panel");

    if (!launcher || !panel || typeof panel.showModal !== "function") return;

    const closeButton = panel.querySelector("[data-a11y-close]");
    const settingButtons = Array.from(panel.querySelectorAll("[data-a11y-setting]"));
    const colorButtons = Array.from(panel.querySelectorAll("[data-a11y-color]"));
    const stepButtons = Array.from(panel.querySelectorAll("[data-a11y-text-step]"));
    const textSizeOutput = panel.querySelector("[data-a11y-text-size-value]");
    const statusMessage = panel.querySelector("[data-a11y-status]");
    const finePointerQuery = window.matchMedia("(any-pointer: fine)");

    function translate(path, fallback) {
      return window.MesudarotI18n?.t(path, fallback) || fallback;
    }

    function syncControls() {
      settingButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(settings[button.dataset.a11ySetting]));
      });

      colorButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(settings.colorMode === button.dataset.a11yColor));
      });

      // aria-disabled keeps the button focusable at the limit, so focus is not lost.
      stepButtons.forEach((button) => {
        const step = Number(button.dataset.a11yTextStep);
        const atLimit = step < 0 ? settings.textSize <= minTextSize : settings.textSize >= maxTextSize;
        button.setAttribute("aria-disabled", String(atLimit));
      });

      if (textSizeOutput) {
        textSizeOutput.textContent = textSizeLabels[settings.textSize];
      }
    }

    function announce(message) {
      if (statusMessage) {
        statusMessage.textContent = message;
      }
    }

    // Large cursors only matter with a mouse or trackpad; touch-only devices hide the option.
    function syncPointerOptions() {
      panel.querySelectorAll("[data-a11y-requires-fine-pointer]").forEach((option) => {
        option.hidden = !finePointerQuery.matches;
      });
    }

    function openPanel() {
      announce("");
      syncControls();
      panel.showModal();
      launcher.setAttribute("aria-expanded", "true");
      closeButton?.focus();
    }

    launcher.addEventListener("click", openPanel);
    closeButton?.addEventListener("click", () => panel.close());

    // A click on the backdrop targets the dialog itself, since its content fills the box.
    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        panel.close();
      }
    });

    panel.addEventListener("close", () => {
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus();
    });

    settingButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.a11ySetting;
        announce("");
        updateSettings({ [name]: !settings[name] });
        syncControls();
      });
    });

    colorButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.a11yColor;
        announce("");
        updateSettings({ colorMode: settings.colorMode === mode ? "" : mode });
        syncControls();
      });
    });

    stepButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.getAttribute("aria-disabled") === "true") return;

        announce("");
        const nextSize = settings.textSize + Number(button.dataset.a11yTextStep);
        updateSettings({ textSize: Math.min(maxTextSize, Math.max(minTextSize, nextSize)) });
        syncControls();
      });
    });

    // Reset confirms with a brief check icon; the status region (visually hidden) tells screen readers.
    const resetButton = panel.querySelector("[data-a11y-reset]");
    const resetConfirmDuration = 1600;
    let resetConfirmTimer = 0;

    function endResetConfirmation() {
      window.clearTimeout(resetConfirmTimer);
      resetButton?.classList.remove("is-confirmed");
      announce("");
    }

    resetButton?.addEventListener("click", () => {
      endResetConfirmation();
      updateSettings(defaultSettings);
      syncControls();
      resetButton.classList.add("is-confirmed");
      announce(translate("runtime.a11y.reset", "כל ההתאמות אופסו."));
      resetConfirmTimer = window.setTimeout(endResetConfirmation, resetConfirmDuration);
    });

    panel.addEventListener("close", endResetConfirmation);

    // The translation layer rewrites text nodes on a language switch; restore the live values.
    window.addEventListener("mesudarot:language-change", () => {
      announce("");
      syncControls();
    });

    finePointerQuery.addEventListener?.("change", syncPointerOptions);
    syncPointerOptions();
    syncControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupMenu);
  } else {
    setupMenu();
  }
})();
