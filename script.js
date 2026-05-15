(function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  const leadForm = document.querySelector("#lead-form");
  const formNote = document.querySelector("#form-note");
  const videoLightbox = document.querySelector("#video-lightbox");
  const videoLightboxPlayer = videoLightbox ? videoLightbox.querySelector("video") : null;
  const cookieBanner = document.querySelector("#cookie-banner");
  const accessibilityToggle = document.querySelector(".accessibility-toggle");
  const accessibilityPanel = document.querySelector("#accessibility-panel");
  const countUpElements = Array.from(document.querySelectorAll(".count-up[data-count]"));
  const reviewCarousel = document.querySelector("[data-reviews-carousel]");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const whatsappUrl = "https://api.whatsapp.com/send?phone=972526086083";
  const cookieChoiceKey = "mesudarotCookieChoice";
  const a11ySettingsKey = "mesudarotA11ySettings";
  const a11yClasses = {
    "large-text": "a11y-large-text",
    "high-contrast": "a11y-high-contrast",
    "underline-links": "a11y-underline-links"
  };

  function setupScrollReveal() {
    const revealTargets = [];
    const sections = Array.from(document.querySelectorAll("main > section, .site-footer"));
    const staggerGroups = [
      ".quick-actions",
      ".reel-grid",
      ".service-grid",
      ".experience",
      ".benefits",
      ".social-proof",
      ".social-proof-points",
      ".review-grid",
      ".faq-accordion",
      ".contact"
    ];

    sections.forEach((section) => {
      if (section.classList.contains("hero")) return;

      section.classList.add("scroll-reveal");
      section.style.setProperty("--reveal-y", section.classList.contains("quick-actions") ? "16px" : "28px");
      revealTargets.push(section);
    });

    staggerGroups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((group) => {
        Array.from(group.children).forEach((child, index) => {
          if (child.hasAttribute("hidden")) return;

          child.classList.add("scroll-reveal-item");
          child.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 70}ms`);
          revealTargets.push(child);
        });
      });
    });

    if (!revealTargets.length) return;

    if (reduceMotionQuery.matches || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("motion-ready");

    function revealTarget(target, observer) {
      target.classList.add("is-visible");
      observer?.unobserve(target);
    }

    function isInRevealRange(target) {
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      return rect.top <= viewportHeight * 0.88 && rect.bottom >= viewportHeight * 0.08;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        revealTarget(entry.target, observer);
      });
    }, {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.14
    });

    revealTargets.forEach((target) => revealObserver.observe(target));

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        revealTargets.forEach((target) => {
          if (target.classList.contains("is-visible") || !isInRevealRange(target)) return;
          revealTarget(target, revealObserver);
        });
      });
    });
  }

  setupScrollReveal();

  function setupReviewsCarousel() {
    if (!reviewCarousel) return;

    const track = reviewCarousel.querySelector(".review-grid");
    const cards = Array.from(reviewCarousel.querySelectorAll(".review-card"));
    const prevButton = reviewCarousel.querySelector("[data-reviews-prev]");
    const nextButton = reviewCarousel.querySelector("[data-reviews-next]");

    if (!track || cards.length < 2 || !prevButton || !nextButton) return;

    let activeIndex = 0;
    let scrollFrame = 0;

    function getStep() {
      if (cards.length < 2) return track.clientWidth;

      return Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) || track.clientWidth;
    }

    function getMaxIndex() {
      const visibleCards = Math.max(1, Math.round(track.clientWidth / getStep()));

      return Math.max(0, cards.length - visibleCards);
    }

    function updateControls() {
      const maxIndex = getMaxIndex();

      activeIndex = Math.min(Math.max(activeIndex, 0), maxIndex);
      prevButton.disabled = activeIndex === 0;
      nextButton.disabled = activeIndex >= maxIndex;
    }

    function scrollToReview(index) {
      const maxIndex = getMaxIndex();

      activeIndex = Math.min(Math.max(index, 0), maxIndex);
      track.scrollTo({
        left: cards[activeIndex].offsetLeft - track.offsetLeft,
        behavior: reduceMotionQuery.matches ? "auto" : "smooth"
      });
      updateControls();
    }

    function syncActiveReview() {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        activeIndex = Math.round(track.scrollLeft / getStep());
        updateControls();
      });
    }

    prevButton.addEventListener("click", () => scrollToReview(activeIndex - 1));
    nextButton.addEventListener("click", () => scrollToReview(activeIndex + 1));
    track.addEventListener("scroll", syncActiveReview, { passive: true });
    window.addEventListener("resize", () => scrollToReview(activeIndex));

    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToReview(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToReview(activeIndex + 1);
      }
    });

    updateControls();
  }

  setupReviewsCarousel();

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

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      return false;
    }
    return true;
  }

  function activateTab(name, shouldFocus) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === name;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;

      if (isActive && shouldFocus) {
        tab.focus();
      }
    });

    panels.forEach((panel) => {
      const isActive = panel.id === `panel-${name}`;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      activateTab(tabs[nextIndex].dataset.tab, true);
    });
  });

  document.querySelectorAll("[data-jump-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      activateTab(link.dataset.jumpTab);
    });
  });

  function formatNumber(value) {
    return new Intl.NumberFormat("he-IL").format(Math.round(value));
  }

  function runCountUp(element) {
    if (element.dataset.counted === "true") return;

    const target = Number(element.dataset.count || 0);
    const reduceMotion = reduceMotionQuery.matches;
    element.dataset.counted = "true";

    if (!target || reduceMotion) {
      element.textContent = formatNumber(target);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatNumber(target * eased);

      if (progress < 1) {
        window.requestAnimationFrame(frame);
      }
    }

    element.textContent = "0";
    window.requestAnimationFrame(frame);
  }

  if (countUpElements.length) {
    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCountUp(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });

      countUpElements.forEach((element) => counterObserver.observe(element));
    } else {
      countUpElements.forEach(runCountUp);
    }
  }

  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(leadForm);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const service = String(data.get("service") || "").trim();
    const message = String(data.get("message") || "").trim();

    const text = [
      "שלום מסודרות, אשמח שתחזרו אליי לקביעת תור.",
      `שם: ${name}`,
      `טלפון: ${phone}`,
      `טיפול: ${service}`,
      message ? `הודעה: ${message}` : ""
    ].filter(Boolean).join("\n");

    formNote.textContent = "פותחת הודעת וואטסאפ מוכנה לשליחה.";
    window.open(`${whatsappUrl}&text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });

  function resetVideoLightbox() {
    if (!videoLightbox || !videoLightboxPlayer) return;
    videoLightboxPlayer.pause();
    videoLightboxPlayer.removeAttribute("src");
    videoLightboxPlayer.load();
  }

  function closeVideoLightbox() {
    if (!videoLightbox) return;
    resetVideoLightbox();

    if (videoLightbox.open) {
      videoLightbox.close();
    }
  }

  document.querySelectorAll("[data-video]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!videoLightbox || !videoLightboxPlayer) return;
      videoLightboxPlayer.src = button.dataset.video;
      if (typeof videoLightbox.showModal === "function") {
        videoLightbox.showModal();
      }
      videoLightboxPlayer.play().catch(() => {
        videoLightboxPlayer.controls = true;
      });
    });
  });

  document.querySelector(".video-lightbox-close")?.addEventListener("click", closeVideoLightbox);

  videoLightbox?.addEventListener("click", (event) => {
    if (event.target === videoLightbox) {
      closeVideoLightbox();
    }
  });

  videoLightbox?.addEventListener("close", resetVideoLightbox);
  videoLightbox?.addEventListener("cancel", resetVideoLightbox);

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.nodeName !== "DIALOG") return;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  document.querySelectorAll("[data-modal-target]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openDialog(trigger.dataset.modalTarget);
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest("dialog")?.close();
    });
  });

  document.querySelectorAll(".legal-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  function setCookieBannerVisibility(isVisible) {
    if (!cookieBanner) return;
    cookieBanner.hidden = !isVisible;
    document.body.classList.toggle("cookie-visible", isVisible);
  }

  function saveCookieChoice(choice) {
    writeStorage(cookieChoiceKey, choice);
    setCookieBannerVisibility(false);
  }

  if (cookieBanner && !readStorage(cookieChoiceKey)) {
    setCookieBannerVisibility(true);
  }

  document.querySelector("#cookie-accept")?.addEventListener("click", () => {
    saveCookieChoice("accepted");
  });

  document.querySelector("#cookie-essential")?.addEventListener("click", () => {
    saveCookieChoice("essential");
  });

  document.querySelectorAll("[data-cookie-settings]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!cookieBanner) return;
      removeStorage(cookieChoiceKey);
      setCookieBannerVisibility(true);
      cookieBanner.querySelector("button")?.focus();
    });
  });

  function getSavedA11ySettings() {
    const savedSettings = readStorage(a11ySettingsKey);
    if (!savedSettings) return {};

    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      return {};
    }
  }

  let currentA11ySettings = {
    "large-text": false,
    "high-contrast": false,
    "underline-links": false,
    ...getSavedA11ySettings()
  };

  function applyA11ySettings() {
    Object.entries(a11yClasses).forEach(([setting, className]) => {
      document.body.classList.toggle(className, Boolean(currentA11ySettings[setting]));
      document.querySelectorAll(`[data-a11y-toggle="${setting}"]`).forEach((button) => {
        button.setAttribute("aria-pressed", String(Boolean(currentA11ySettings[setting])));
      });
    });

    writeStorage(a11ySettingsKey, JSON.stringify(currentA11ySettings));
  }

  function closeA11yPanel() {
    if (!accessibilityPanel) return;
    accessibilityPanel.hidden = true;
    accessibilityToggle?.setAttribute("aria-expanded", "false");
  }

  applyA11ySettings();

  accessibilityToggle?.addEventListener("click", () => {
    if (!accessibilityPanel) return;
    const shouldOpen = accessibilityPanel.hidden;
    accessibilityPanel.hidden = !shouldOpen;
    accessibilityToggle.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
      accessibilityPanel.querySelector("button")?.focus();
    }
  });

  document.querySelector("[data-a11y-close]")?.addEventListener("click", closeA11yPanel);

  document.querySelectorAll("[data-a11y-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const setting = button.dataset.a11yToggle;
      currentA11ySettings[setting] = !currentA11ySettings[setting];
      applyA11ySettings();
    });
  });

  document.querySelector("#a11y-reset")?.addEventListener("click", () => {
    currentA11ySettings = {
      "large-text": false,
      "high-contrast": false,
      "underline-links": false
    };
    removeStorage(a11ySettingsKey);
    applyA11ySettings();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeA11yPanel();

      if (videoLightbox?.open) {
        closeVideoLightbox();
      }

    }
  });
})();
