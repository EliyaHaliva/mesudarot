(function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const brandLink = document.querySelector(".brand");
  const navLinks = document.querySelector(".nav-links");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  const leadForm = document.querySelector("#lead-form");
  const formNote = document.querySelector("#form-note");
  const videoLightbox = document.querySelector("#video-lightbox");
  const videoLightboxPlayer = videoLightbox ? videoLightbox.querySelector("video") : null;
  const cookieBanner = document.querySelector("#cookie-banner");
  const mobileBar = document.querySelector(".mobile-bar");
  const countUpElements = Array.from(document.querySelectorAll(".count-up[data-count]"));
  const reviewCarousel = document.querySelector("[data-reviews-carousel]");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const whatsappUrl = "https://api.whatsapp.com/send?phone=972526086083";
  const cookieChoiceKey = "mesudarotCookieChoice";
  const i18n = window.MesudarotI18n;
  // The statement used to be a dialog on this page; old links now go to its own page.
  const legacyStatementHash = "#accessibility";

  if (window.location.hash === legacyStatementHash) {
    window.location.replace("accessibility.html");
  }

  function isReducedMotionEnabled() {
    return reduceMotionQuery.matches || Boolean(window.MesudarotA11y?.getSettings().stopAnimations);
  }

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

    if (isReducedMotionEnabled() || !("IntersectionObserver" in window)) {
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
      // Any visible part reveals: a ratio threshold never fires for sections taller than the
      // viewport, which left them invisible at high zoom levels.
      threshold: 0
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

  // "Stop animations" reveals everything still waiting for its entrance effect. Turning it off
  // restores the motion styles; every target is already revealed, so nothing hides again.
  window.addEventListener("mesudarot:a11y-change", (event) => {
    if (event.detail.settings.stopAnimations) {
      document.documentElement.classList.remove("motion-ready");
      document.querySelectorAll(".scroll-reveal, .scroll-reveal-item").forEach((target) => {
        target.classList.add("is-visible");
      });
    } else if (!reduceMotionQuery.matches && "IntersectionObserver" in window) {
      document.documentElement.classList.add("motion-ready");
    }
  });

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
        behavior: isReducedMotionEnabled() ? "auto" : "smooth"
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

  function setMenuOpen(isOpen) {
    if (!navLinks || !menuToggle) return;

    navLinks.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  }

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(!navLinks?.classList.contains("open"));
  });

  brandLink?.addEventListener("click", (event) => {
    event.preventDefault();
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: isReducedMotionEnabled() ? "auto" : "smooth"
    });

    if (window.location.hash) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  });

  navLinks?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!navLinks?.classList.contains("open")) return;
    if (event.target instanceof Element && event.target.closest(".main-nav")) return;

    setMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !navLinks?.classList.contains("open")) return;

    setMenuOpen(false);
    menuToggle?.focus();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1040) {
      setMenuOpen(false);
    }
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;
      const isRtl = document.documentElement.dir !== "ltr";

      if (event.key === "ArrowLeft") {
        nextIndex = isRtl ? (currentIndex + 1) % tabs.length : (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === "ArrowRight") {
        nextIndex = isRtl ? (currentIndex - 1 + tabs.length) % tabs.length : (currentIndex + 1) % tabs.length;
      } else if (event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === "ArrowUp") {
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
    return new Intl.NumberFormat(i18n?.getIntlLocale?.() || "he-IL").format(Math.round(value));
  }

  function runCountUp(element) {
    if (element.dataset.counted === "true") return;

    const target = Number(element.dataset.count || 0);
    const reduceMotion = isReducedMotionEnabled();
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

  window.addEventListener("mesudarot:language-change", () => {
    countUpElements.forEach((element) => {
      if (element.dataset.counted === "true") {
        element.textContent = formatNumber(Number(element.dataset.count || 0));
      }
    });
  });

  const requiredLeadFields = leadForm ? Array.from(leadForm.querySelectorAll("[required]")) : [];
  const phoneCharactersPattern = /^[0-9+\-\s()]+$/;

  function getFieldErrorKey(field) {
    const value = field.value.trim();

    if (!value) return `${field.name}Required`;

    if (field.name === "phone") {
      const digitCount = value.replace(/\D/g, "").length;
      const isValidPhone = phoneCharactersPattern.test(value) && digitCount >= 9 && digitCount <= 15;
      return isValidPhone ? "" : "phoneInvalid";
    }

    return "";
  }

  function showFieldError(field, errorKey) {
    const errorElement = document.getElementById(field.getAttribute("aria-describedby"));

    field.dataset.errorKey = errorKey;

    if (errorKey) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }

    if (errorElement) {
      errorElement.textContent = errorKey ? i18n?.t(`runtime.form.errors.${errorKey}`) : "";
      errorElement.hidden = !errorKey;
    }
  }

  function validateLeadForm() {
    return requiredLeadFields.filter((field) => {
      const errorKey = getFieldErrorKey(field);
      showFieldError(field, errorKey);
      return Boolean(errorKey);
    });
  }

  requiredLeadFields.forEach((field) => {
    const revalidate = () => {
      if (field.dataset.errorKey) {
        showFieldError(field, getFieldErrorKey(field));
      }
    };

    field.addEventListener("input", revalidate);
    field.addEventListener("change", revalidate);
  });

  window.addEventListener("mesudarot:language-change", () => {
    requiredLeadFields.forEach((field) => {
      if (field.dataset.errorKey) {
        showFieldError(field, field.dataset.errorKey);
      }
    });
  });

  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalidFields = validateLeadForm();

    if (invalidFields.length) {
      formNote.textContent = i18n?.t("runtime.form.invalid");
      invalidFields[0].focus();
      return;
    }

    const data = new FormData(leadForm);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const service = String(data.get("service") || "").trim();
    const message = String(data.get("message") || "").trim();
    const labels = {
      intro: i18n?.t("runtime.whatsapp.intro"),
      name: i18n?.t("runtime.whatsapp.name"),
      phone: i18n?.t("runtime.whatsapp.phone"),
      service: i18n?.t("runtime.whatsapp.service"),
      message: i18n?.t("runtime.whatsapp.message"),
      opening: i18n?.t("runtime.form.openingWhatsapp")
    };

    const text = [
      labels.intro,
      `${labels.name}: ${name}`,
      `${labels.phone}: ${phone}`,
      `${labels.service}: ${service}`,
      message ? `${labels.message}: ${message}` : ""
    ].filter(Boolean).join("\n");

    formNote.textContent = labels.opening;
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
      const videoTitle = button.querySelector("span")?.textContent.trim();
      const videoDescription = document.getElementById(button.getAttribute("aria-describedby"));
      const lightboxDescription = videoLightbox.querySelector("#video-lightbox-description");

      if (videoTitle) {
        videoLightbox.setAttribute("aria-label", videoTitle);
      }

      if (lightboxDescription) {
        lightboxDescription.textContent = videoDescription?.textContent.trim() || "";
      }

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

  // Lets CSS keep focused content and the accessibility toggle clear of fixed bottom bars.
  function updateFixedBottomInset() {
    const coveredHeight = [cookieBanner, mobileBar].reduce((maxHeight, element) => {
      if (!element || element.hidden || getComputedStyle(element).position !== "fixed") {
        return maxHeight;
      }

      const rect = element.getBoundingClientRect();
      return rect.height ? Math.max(maxHeight, window.innerHeight - rect.top) : maxHeight;
    }, 0);

    document.documentElement.style.setProperty("--fixed-bottom-inset", `${Math.ceil(coveredHeight)}px`);
  }

  if ("ResizeObserver" in window) {
    const fixedBarObserver = new ResizeObserver(updateFixedBottomInset);
    [cookieBanner, mobileBar].filter(Boolean).forEach((element) => fixedBarObserver.observe(element));
  }

  window.addEventListener("resize", updateFixedBottomInset);
  updateFixedBottomInset();

  function setCookieBannerVisibility(isVisible) {
    if (!cookieBanner) return;
    cookieBanner.hidden = !isVisible;
    document.body.classList.toggle("cookie-visible", isVisible);
    updateFixedBottomInset();
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && videoLightbox?.open) {
      closeVideoLightbox();
    }
  });
})();
