(function () {
  const storageKey = "mesudarotLanguage";
  const defaultLanguage = "he";
  const languages = {
    he: { dir: "rtl", htmlLang: "he", intlLocale: "he-IL", ogLocale: "he_IL" },
    en: { dir: "ltr", htmlLang: "en", intlLocale: "en-US", ogLocale: "en_US" },
    fr: { dir: "ltr", htmlLang: "fr", intlLocale: "fr-FR", ogLocale: "fr_FR" },
    ru: { dir: "ltr", htmlLang: "ru", intlLocale: "ru-RU", ogLocale: "ru_RU" }
  };
  const translatableAttributes = ["aria-label", "alt", "placeholder", "title", "content"];
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const schemaScript = document.querySelector('script[type="application/ld+json"]');
  const baseSchema = parseSchema(schemaScript);

  let fallbackLocale = null;
  let currentLocale = null;
  let currentLanguage = defaultLanguage;
  let resolveReady;

  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      return false;
    }

    return true;
  }

  function parseSchema(script) {
    if (!script?.textContent) return null;

    try {
      return JSON.parse(script.textContent);
    } catch (error) {
      return null;
    }
  }

  function getInitialLanguage() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("lang");
    const saved = readStorage(storageKey);

    if (requested && languages[requested]) return requested;
    if (saved && languages[saved]) return saved;

    return defaultLanguage;
  }

  async function fetchLocale(language) {
    const response = await fetch(`locales/${language}.json`, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Unable to load locale: ${language}`);
    }

    return response.json();
  }

  async function getFallbackLocale() {
    if (!fallbackLocale) {
      fallbackLocale = await fetchLocale(defaultLanguage);
    }

    return fallbackLocale;
  }

  function getPath(source, path) {
    return path.split(".").reduce((value, key) => {
      if (value && Object.prototype.hasOwnProperty.call(value, key)) {
        return value[key];
      }

      return undefined;
    }, source);
  }

  function t(path, fallback = "") {
    const localized = currentLocale ? getPath(currentLocale, path) : undefined;
    const fallbackValue = fallbackLocale ? getPath(fallbackLocale, path) : undefined;

    return localized ?? fallbackValue ?? fallback;
  }

  function translateSource(source) {
    if (!source) return source;

    return currentLocale?.strings?.[source] ?? fallbackLocale?.strings?.[source] ?? source;
  }

  function replaceTextNode(node, value) {
    const original = node.nodeValue || "";
    const start = original.match(/^\s*/)?.[0] || "";
    const end = original.match(/\s*$/)?.[0] || "";

    node.nodeValue = `${start}${value}${end}`;
  }

  function shouldTranslateText(node) {
    const parent = node.parentElement;

    if (!parent || !normalize(node.nodeValue)) return false;
    if (parent.closest("script, style, svg")) return false;

    return true;
  }

  function applyTextTranslations() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldTranslateText(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (!textSources.has(node)) {
        textSources.set(node, normalize(node.nodeValue));
      }

      replaceTextNode(node, translateSource(textSources.get(node)));
    });
  }

  function getAttributeStore(element) {
    if (!attributeSources.has(element)) {
      attributeSources.set(element, {});
    }

    return attributeSources.get(element);
  }

  function applyAttributeTranslations() {
    document.querySelectorAll("*").forEach((element) => {
      const store = getAttributeStore(element);

      translatableAttributes.forEach((name) => {
        if (!element.hasAttribute(name)) return;

        if (!store[name]) {
          store[name] = normalize(element.getAttribute(name));
        }

        const translated = translateSource(store[name]);

        if (translated) {
          element.setAttribute(name, translated);
        }
      });
    });
  }

  function setMeta(selector, value) {
    if (!value) return;

    const element = document.querySelector(selector);

    if (element) {
      element.setAttribute("content", value);
    }
  }

  function applySeo(locale, language) {
    const seo = locale.seo || {};
    const languageInfo = languages[language];

    if (seo.title) {
      document.title = seo.title;
    }

    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[property="og:locale"]', languageInfo.ogLocale);
    setMeta('meta[property="og:site_name"]', seo.siteName);
    setMeta('meta[property="og:title"]', seo.ogTitle || seo.title);
    setMeta('meta[property="og:description"]', seo.ogDescription || seo.description);
    setMeta('meta[property="og:image:alt"]', seo.ogImageAlt);
    setMeta('meta[name="twitter:title"]', seo.twitterTitle || seo.title);
    setMeta('meta[name="twitter:description"]', seo.twitterDescription || seo.description);
  }

  function applySchema(locale, language) {
    if (!schemaScript || !baseSchema || !locale.schema) return;

    const schema = JSON.parse(JSON.stringify(baseSchema));
    const graph = Array.isArray(schema["@graph"]) ? schema["@graph"] : [];
    const business = graph.find((item) => item["@type"] === "BeautySalon");
    const website = graph.find((item) => item["@type"] === "WebSite");
    const faq = graph.find((item) => item["@type"] === "FAQPage");
    const schemaText = locale.schema;
    const languageInfo = languages[language];

    if (business) {
      business.name = schemaText.businessName || business.name;
      business.alternateName = schemaText.alternateName || business.alternateName;
      business.description = schemaText.businessDescription || business.description;

      if (business.address) {
        business.address.streetAddress = schemaText.streetAddress || business.address.streetAddress;
        business.address.addressLocality = schemaText.city || business.address.addressLocality;
      }

      if (business.areaServed) {
        business.areaServed.name = schemaText.city || business.areaServed.name;
      }

      if (Array.isArray(schemaText.offers) && Array.isArray(business.makesOffer)) {
        business.makesOffer.forEach((offer, index) => {
          if (schemaText.offers[index] && offer.itemOffered) {
            offer.itemOffered.name = schemaText.offers[index];
          }
        });
      }
    }

    if (website) {
      website.name = schemaText.businessName || website.name;
      website.inLanguage = languageInfo.intlLocale;
    }

    if (faq) {
      faq.inLanguage = languageInfo.intlLocale;

      if (Array.isArray(schemaText.faq)) {
        faq.mainEntity = schemaText.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }));
      }
    }

    schemaScript.textContent = JSON.stringify(schema, null, 2);
  }

  function syncLanguageControls(language) {
    document.querySelectorAll("[data-language-option]").forEach((button) => {
      const isActive = button.dataset.languageOption === language;

      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("active", isActive);
    });
  }

  function applyLocale(locale, language) {
    const languageInfo = languages[language];

    document.documentElement.lang = languageInfo.htmlLang;
    document.documentElement.dir = languageInfo.dir;
    document.body.dataset.language = language;
    document.body.dataset.direction = languageInfo.dir;

    applyTextTranslations();
    applyAttributeTranslations();
    applySeo(locale, language);
    applySchema(locale, language);
    syncLanguageControls(language);
  }

  async function setLanguage(language, shouldPersist = true) {
    const safeLanguage = languages[language] ? language : defaultLanguage;

    await getFallbackLocale();

    try {
      currentLocale = safeLanguage === defaultLanguage ? fallbackLocale : await fetchLocale(safeLanguage);
      currentLanguage = safeLanguage;
    } catch (error) {
      currentLocale = fallbackLocale;
      currentLanguage = defaultLanguage;
    }

    applyLocale(currentLocale, currentLanguage);

    if (shouldPersist) {
      writeStorage(storageKey, currentLanguage);
    }

    resolveReady?.(api);
    window.dispatchEvent(new CustomEvent("mesudarot:language-change", {
      detail: { language: currentLanguage, locale: currentLocale }
    }));
  }

  const api = {
    ready,
    setLanguage,
    t,
    translateSource,
    getLanguage: () => currentLanguage,
    getDirection: () => languages[currentLanguage].dir,
    getIntlLocale: () => languages[currentLanguage].intlLocale,
    getLocale: () => currentLocale
  };

  window.MesudarotI18n = api;

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-language-option]");

    if (!button) return;

    setLanguage(button.dataset.languageOption);
  });

  setLanguage(getInitialLanguage()).catch(() => {
    document.documentElement.lang = languages[defaultLanguage].htmlLang;
    document.documentElement.dir = languages[defaultLanguage].dir;
    resolveReady?.(api);
  });
})();
