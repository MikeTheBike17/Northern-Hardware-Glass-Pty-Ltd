document.addEventListener("DOMContentLoaded", () => {
  console.log("Northern Hardware & Glass site loaded.");

  // Prevent double-init if script is accidentally included twice
  if (window.__NHG_APP_INIT__) return;
  window.__NHG_APP_INIT__ = true;

  /* ------------------------------
     AUTO-UPDATE FOOTER YEAR
  ------------------------------ */
  const footerYear = document.getElementById("year-footer");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  /* ------------------------------
     NAV MENU
  ------------------------------ */
  const MOBILE_BREAKPOINT = 900;
  const HERO_MOBILE_BREAKPOINT = 720;
  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
  const isHeroMobile = () => window.innerWidth <= HERO_MOBILE_BREAKPOINT;

  const navToggle = document.getElementById("navToggle");
  const siteHeader = document.querySelector(".site-header");
  const siteMenu = document.getElementById("siteMenu");
  const productsNavItem = document.querySelector("[data-products-nav-item]");
  const productsNavToggle = document.querySelector("[data-products-nav-toggle]");
  const productsNavSubmenu = document.getElementById("productsNavCategories");
  const productsNavCategoryLinks = productsNavSubmenu ? Array.from(productsNavSubmenu.querySelectorAll("a")) : [];
  const isServicesPage = document.body.classList.contains("services-page");
  const isLaminatedPage = document.body.classList.contains("laminated-page");
  const HEADER_MENU_TRANSITION_MS = 280;
  let headerMenuCloseTimer = null;

  function setProductsSubmenuOpen(isOpen) {
    if (!productsNavItem || !productsNavToggle) return;
    productsNavItem.classList.toggle("is-expanded", isOpen);
    productsNavToggle.setAttribute("aria-expanded", String(isOpen));
    if (productsNavSubmenu) {
      productsNavSubmenu.setAttribute("aria-hidden", String(!isOpen));
    }
    productsNavCategoryLinks.forEach((link) => {
      if (isOpen) {
        link.removeAttribute("tabindex");
      } else {
        link.setAttribute("tabindex", "-1");
      }
    });
  }

  function closeProductsSubmenu() {
    setProductsSubmenuOpen(false);
  }

  function shouldUseProductsDisclosure() {
    return Boolean(isHeroMobile() && siteHeader && siteHeader.classList.contains("menu-open"));
  }

  function shouldUseProductsHoverDisclosure() {
    return Boolean(!isHeroMobile() && productsNavItem && productsNavToggle);
  }

  function openProductsSubmenuForDesktop() {
    if (shouldUseProductsHoverDisclosure()) setProductsSubmenuOpen(true);
  }

  function closeProductsSubmenuForDesktop(event) {
    if (!shouldUseProductsHoverDisclosure()) return;
    const nextTarget = event ? event.relatedTarget : null;
    if (nextTarget instanceof Node && productsNavItem.contains(nextTarget)) return;
    closeProductsSubmenu();
  }

  closeProductsSubmenu();

  function closeHeaderMenu() {
    if (!siteHeader || !navToggle) return;
    if (headerMenuCloseTimer) {
      window.clearTimeout(headerMenuCloseTimer);
      headerMenuCloseTimer = null;
    }
    closeProductsSubmenu();
    document.body.classList.remove("nav-open");
    siteHeader.classList.remove("nav-open");
    siteHeader.classList.remove("menu-open");
    siteHeader.classList.add("menu-closing");
    headerMenuCloseTimer = window.setTimeout(() => {
      siteHeader.classList.remove("menu-closing");
      headerMenuCloseTimer = null;
    }, HEADER_MENU_TRANSITION_MS);
    navToggle.setAttribute("aria-expanded", "false");
  }

  function openHeaderMenu() {
    if (!siteHeader || !navToggle) return;
    if (headerMenuCloseTimer) {
      window.clearTimeout(headerMenuCloseTimer);
      headerMenuCloseTimer = null;
    }
    siteHeader.classList.remove("menu-closing");
    siteHeader.classList.add("menu-open");
    document.body.classList.add("nav-open");
    siteHeader.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
  }

  if (navToggle && siteHeader) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteHeader.classList.contains("menu-open");
      if (isOpen) closeHeaderMenu();
      else openHeaderMenu();
    });
  }

  document.querySelectorAll(".navbar a").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (productsNavItem && productsNavToggle && link === productsNavToggle && shouldUseProductsDisclosure()) {
        const isProductsSubmenuOpen = productsNavItem.classList.contains("is-expanded");
        if (!isProductsSubmenuOpen) {
          event.preventDefault();
          setProductsSubmenuOpen(true);
          return;
        }
      }

      closeHeaderMenu();
    });
  });

  if (productsNavItem) {
    productsNavItem.addEventListener("mouseenter", openProductsSubmenuForDesktop);
    productsNavItem.addEventListener("mouseleave", closeProductsSubmenuForDesktop);
    productsNavItem.addEventListener("focusin", openProductsSubmenuForDesktop);
    productsNavItem.addEventListener("focusout", closeProductsSubmenuForDesktop);
  }

  document.addEventListener("click", (e) => {
    if (!siteHeader || !siteMenu || !navToggle) return;
    if (!e.target.closest(".site-header")) {
      closeHeaderMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (!isHeroMobile()) closeProductsSubmenu();
    if (!isMobile()) closeHeaderMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeHeaderMenu();
    }
  });

  /* ------------------------------
     STATIC HERO IMAGE
  ------------------------------ */
  const heroLayer = document.querySelector(".hero .hero-bg");

  if (heroLayer) {
    heroLayer.style.backgroundImage =
      'linear-gradient(135deg, rgba(50, 50, 65, 0.3), rgba(7, 13, 22, 0.5)), url("js/Wallpapers/NHG-Wallpaper-5.webp")';
  }

  /* ------------------------------
     HERO SCROLL INTRO
  ------------------------------ */
  const homePage = document.body.classList.contains("home-page") ? document.body : null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (homePage && !prefersReducedMotion.matches) {
    let ticking = false;
    let heroIntroLocked = false;
    const INTRO_COMPLETE_THRESHOLD = 0.999;
    const heroSection = document.querySelector(".hero");

    const updateHeroProgress = () => {
      const introDistanceRaw = getComputedStyle(homePage).getPropertyValue("--hero-intro-distance").trim();
      const introDistance = Number.parseFloat(introDistanceRaw) * 16;
      const maxScroll = Number.isFinite(introDistance) ? introDistance : Math.max(520, window.innerHeight * 0.7);
      const heroSceneEnd = heroSection
        ? Math.max(maxScroll, heroSection.offsetTop + heroSection.offsetHeight - window.innerHeight)
        : maxScroll;
      let progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      if (heroIntroLocked) {
        const shouldClampDesktopHeroTop = !isMobile() && window.scrollY < maxScroll;
        const shouldClampMobileHeroTop = isHeroMobile() && window.scrollY < maxScroll;

        if (shouldClampDesktopHeroTop || shouldClampMobileHeroTop) {
          window.scrollTo(0, maxScroll);
        }
        progress = 1;
      } else if (progress >= INTRO_COMPLETE_THRESHOLD) {
        progress = 1;
        heroIntroLocked = true;
      }

      homePage.style.setProperty("--hero-progress", progress.toFixed(3));
      homePage.classList.toggle("hero-intro-active", !heroIntroLocked && progress < INTRO_COMPLETE_THRESHOLD);
      homePage.classList.toggle("hero-intro-complete", heroIntroLocked || progress >= INTRO_COMPLETE_THRESHOLD);
      homePage.classList.toggle("hero-top-scene", window.scrollY <= heroSceneEnd);
      ticking = false;
    };

    updateHeroProgress();

    const requestTick = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeroProgress);
    };

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
  } else if (homePage) {
    homePage.style.setProperty("--hero-progress", "1");
    homePage.classList.remove("hero-intro-active");
    homePage.classList.add("hero-intro-complete");
    homePage.classList.add("hero-top-scene");
  }

  /* ------------------------------
     MOBILE PRODUCT RANGE CTA POSITION
  ------------------------------ */
  (() => {
    const productRangeSection = document.querySelector(".product-range-section");
    const productRangeHeading = productRangeSection?.querySelector(".section-heading-split");
    const productRangeGrid = productRangeSection?.querySelector(".product-category-grid-home");
    const productRangeButton = productRangeHeading?.querySelector(".btn");

    if (!productRangeHeading || !productRangeGrid || !productRangeButton) return;

    const syncProductRangeButtonPosition = () => {
      if (isHeroMobile()) {
        if (productRangeGrid.nextElementSibling !== productRangeButton) {
          productRangeGrid.insertAdjacentElement("afterend", productRangeButton);
        }
        return;
      }

      if (productRangeHeading.lastElementChild !== productRangeButton) {
        productRangeHeading.appendChild(productRangeButton);
      }
    };

    syncProductRangeButtonPosition();
    window.addEventListener("resize", syncProductRangeButtonPosition);
  })();

  /* ------------------------------
     SCROLL REVEAL ANIMATIONS
  ------------------------------ */
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));

  if (revealItems.length) {
    revealItems.forEach((item, index) => {
      const revealType = item.dataset.reveal || "up";
      const delay = revealType === "card" ? (index % 4) * 70 : 0;
      item.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ------------------------------
     SERVICES PANEL SCROLL LIFT
  ------------------------------ */
  (() => {
    if (!isServicesPage || prefersReducedMotion.matches) return;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const getMaxLift = () => {
      if (window.innerWidth <= HERO_MOBILE_BREAKPOINT) return 28;
      if (window.innerWidth <= 1120) return 52;
      return 84;
    };

    const initSectionScrollLift = (sectionSelector, panelSelector, cssVarName) => {
      const section = document.querySelector(sectionSelector);
      const panel = section?.querySelector(panelSelector);

      if (!section || !panel) return;

      let liftFrame = null;
      let currentLift = 0;
      let targetLift = 0;

      const measureLift = () => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const start = viewportHeight * 0.88;
        const end = -rect.height * 0.22;
        const progress = clamp((start - rect.top) / (start - end), 0, 1);

        targetLift = -progress * getMaxLift();
      };

      const renderLift = () => {
        const delta = targetLift - currentLift;

        if (Math.abs(delta) < 0.12) {
          currentLift = targetLift;
          panel.style.setProperty(cssVarName, `${currentLift.toFixed(2)}px`);
          liftFrame = null;
          return;
        }

        currentLift += delta * 0.14;
        panel.style.setProperty(cssVarName, `${currentLift.toFixed(2)}px`);
        liftFrame = window.requestAnimationFrame(renderLift);
      };

      const syncLift = () => {
        measureLift();

        if (liftFrame === null) {
          liftFrame = window.requestAnimationFrame(renderLift);
        }
      };

      syncLift();
      window.addEventListener("scroll", syncLift, { passive: true });
      window.addEventListener("resize", syncLift);
    };

    initSectionScrollLift(".services-intro-section", ".services-intro-panel", "--services-intro-scroll-shift");
    initSectionScrollLift(".services-processing-section", ".services-edge-panel", "--services-processing-scroll-shift");
  })();

  /* ------------------------------
     EDGE PROFILE IMAGE EXPAND
  ------------------------------ */
  (() => {
    const edgeProfileImages = Array.from(document.querySelectorAll(".edge-profile-img"));

    if (!edgeProfileImages.length) return;

    const zoomBackdrop = document.createElement("div");
    zoomBackdrop.className = "edge-profile-zoom-backdrop";
    zoomBackdrop.hidden = true;

    const zoomFrame = document.createElement("div");
    zoomFrame.className = "edge-profile-zoom-frame";

    const zoomImage = document.createElement("img");
    zoomImage.className = "edge-profile-zoom-image";
    zoomImage.alt = "";

    zoomFrame.appendChild(zoomImage);
    zoomBackdrop.appendChild(zoomFrame);
    document.body.appendChild(zoomBackdrop);

    const closeZoom = () => {
      zoomBackdrop.classList.remove("is-open");
      window.setTimeout(() => {
        if (!zoomBackdrop.classList.contains("is-open")) {
          zoomBackdrop.hidden = true;
          zoomImage.removeAttribute("src");
          zoomImage.alt = "";
          zoomImage.style.width = "";
          zoomImage.style.height = "";
        }
      }, 220);
    };

    const openZoom = (image) => {
      const rect = image.getBoundingClientRect();

      zoomImage.src = image.currentSrc || image.src;
      zoomImage.alt = image.alt;
      zoomImage.style.width = `${rect.width * 2}px`;
      zoomImage.style.height = `${rect.height * 2}px`;
      zoomBackdrop.hidden = false;

      window.requestAnimationFrame(() => {
        zoomBackdrop.classList.add("is-open");
      });
    };

    edgeProfileImages.forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt}. Click to expand.`);

      image.addEventListener("click", () => openZoom(image));
      image.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openZoom(image);
      });
    });

    zoomBackdrop.addEventListener("click", (event) => {
      if (event.target === zoomBackdrop || event.target === zoomImage) {
        closeZoom();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && zoomBackdrop.classList.contains("is-open")) {
        closeZoom();
      }
    });
  })();

  /* ------------------------------
     LAMINATED SELECTION PANEL SCROLL LIFT
  ------------------------------ */
  (() => {
    if (!isLaminatedPage || prefersReducedMotion.matches) return;

    const section = document.querySelector(".laminated-catalog-section");
    const panel = section?.querySelector(".laminated-selection-panel");

    if (!section || !panel) return;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const getMaxLift = () => {
      if (window.innerWidth <= HERO_MOBILE_BREAKPOINT) return 24;
      if (window.innerWidth <= 1120) return 42;
      return 64;
    };

    let liftFrame = null;
    let currentLift = 0;
    let targetLift = 0;

    const measureLift = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const start = viewportHeight * 0.9;
      const end = -rect.height * 0.2;
      const progress = clamp((start - rect.top) / (start - end), 0, 1);

      targetLift = -progress * getMaxLift();
    };

    const renderLift = () => {
      const delta = targetLift - currentLift;

      if (Math.abs(delta) < 0.12) {
        currentLift = targetLift;
        panel.style.setProperty("--laminated-selection-scroll-shift", `${currentLift.toFixed(2)}px`);
        liftFrame = null;
        return;
      }

      currentLift += delta * 0.14;
      panel.style.setProperty("--laminated-selection-scroll-shift", `${currentLift.toFixed(2)}px`);
      liftFrame = window.requestAnimationFrame(renderLift);
    };

    const syncLift = () => {
      measureLift();

      if (liftFrame === null) {
        liftFrame = window.requestAnimationFrame(renderLift);
      }
    };

    syncLift();
    window.addEventListener("scroll", syncLift, { passive: true });
    window.addEventListener("resize", syncLift);
  })();

  /* ------------------------------
     HOMEPAGE SERVICES ACCORDION
  ------------------------------ */
  (() => {
    const serviceItems = Array.from(document.querySelectorAll(".service-accordion-item[data-service-panel]"));
    const serviceImages = Array.from(document.querySelectorAll(".service-stage-image[data-service-image]"));
    const SERVICE_IMAGE_TRANSITION_MS = 700;

    if (!serviceItems.length || !serviceImages.length) return;

    const imageMap = new Map(
      serviceImages.map((image) => [image.dataset.serviceImage, image])
    );
    let previousImageResetId = null;

    const setActiveService = (panelName) => {
      const nextImage = imageMap.get(panelName);
      const currentImage = serviceImages.find((image) => image.classList.contains("is-active"));

      serviceItems.forEach((item) => {
        const isActive = item.dataset.servicePanel === panelName;
        const toggle = item.querySelector(".service-accordion-toggle");
        const body = item.querySelector(".service-accordion-body");

        item.classList.toggle("is-active", isActive);

        if (toggle) {
          toggle.setAttribute("aria-expanded", String(isActive));
        }

        if (body) {
          body.hidden = !isActive;
        }
      });

      if (previousImageResetId) {
        window.clearTimeout(previousImageResetId);
        previousImageResetId = null;
      }

      serviceImages.forEach((image) => {
        image.classList.remove("is-previous");
      });

      if (!nextImage) return;

      if (currentImage && currentImage !== nextImage) {
        currentImage.classList.remove("is-active");
        currentImage.classList.add("is-previous");
      }

      serviceImages.forEach((image) => {
        image.classList.toggle("is-active", image === nextImage);
      });

      if (currentImage && currentImage !== nextImage) {
        previousImageResetId = window.setTimeout(() => {
          currentImage.classList.remove("is-previous");
          previousImageResetId = null;
        }, SERVICE_IMAGE_TRANSITION_MS);
      }
    };

    const initialActiveItem =
      serviceItems.find((item) => item.classList.contains("is-active")) || serviceItems[0];
    const initialPanelName = initialActiveItem?.dataset.servicePanel;

    if (initialPanelName && imageMap.has(initialPanelName)) {
      setActiveService(initialPanelName);
    }

    serviceItems.forEach((item) => {
      const toggle = item.querySelector(".service-accordion-toggle");
      if (!toggle) return;

      toggle.addEventListener("click", () => {
        const panelName = item.dataset.servicePanel;
        if (!panelName || !imageMap.has(panelName)) return;
        setActiveService(panelName);
      });
    });
  })();

  /* ------------------------------
     SERVICES WHY TABS
  ------------------------------ */
  (() => {
    const tabsShell = document.querySelector(".services-tabs-shell");
    const tabRow = tabsShell?.querySelector(".services-why-tab-row");
    const tabButtons = Array.from(tabsShell?.querySelectorAll(".services-why-tab[data-why-target]") || []);
    const panelShell = tabsShell?.querySelector(".services-why-panel-shell[role='tabpanel']");
    const panelContent = tabsShell?.querySelector("[data-why-panel-content]");
    const SWAP_DELAY_MS = 150;
    let swapTimer = null;

    if (!tabsShell || !tabRow || !tabButtons.length || !panelShell || !panelContent) return;

    const templateMap = new Map(
      tabButtons.map((button) => [
        button.dataset.whyTarget,
        tabsShell.querySelector(`#why-template-${button.dataset.whyTarget}`),
      ])
    );

    const syncWhyBridge = (button) => {
      if (!button) return;
      const left = button.offsetLeft - tabRow.scrollLeft;
      tabsShell.style.setProperty("--why-tab-bridge-left", `${Math.max(0, left)}px`);
      tabsShell.style.setProperty("--why-tab-bridge-width", `${button.offsetWidth}px`);
    };

    const setActiveTabState = (activeButton) => {
      tabButtons.forEach((button) => {
        const isActive = button === activeButton;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });

      if (activeButton) {
        panelShell.setAttribute("aria-labelledby", activeButton.id);
      }
    };

    const renderWhyContent = (key) => {
      const template = templateMap.get(key);
      if (!template) return false;

      panelContent.replaceChildren(template.content.cloneNode(true));
      return true;
    };

    const activateWhyTab = (button, { focus = false, immediate = false } = {}) => {
      if (!button) return;

      const key = button.dataset.whyTarget;
      if (!key || !templateMap.has(key)) return;

      if (swapTimer) {
        window.clearTimeout(swapTimer);
        swapTimer = null;
      }

      setActiveTabState(button);

      syncWhyBridge(button);

      if (focus) {
        button.focus();
      }

      if (immediate) {
        renderWhyContent(key);
        panelContent.classList.add("is-visible");
        return;
      }

      panelContent.classList.remove("is-visible");

      swapTimer = window.setTimeout(() => {
        renderWhyContent(key);
        window.requestAnimationFrame(() => {
          panelContent.classList.add("is-visible");
        });
        swapTimer = null;
      }, SWAP_DELAY_MS);
    };

    const getNextWhyTab = (currentButton, direction) => {
      const currentIndex = tabButtons.indexOf(currentButton);
      if (currentIndex < 0) return tabButtons[0];

      const nextIndex = (currentIndex + direction + tabButtons.length) % tabButtons.length;
      return tabButtons[nextIndex];
    };

    const initialActiveButton =
      tabButtons.find((button) => button.classList.contains("is-active")) || tabButtons[0];

    activateWhyTab(initialActiveButton, { immediate: true });

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateWhyTab(button));

      button.addEventListener("keydown", (event) => {
        let nextButton = null;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextButton = getNextWhyTab(button, 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextButton = getNextWhyTab(button, -1);
        } else if (event.key === "Home") {
          nextButton = tabButtons[0];
        } else if (event.key === "End") {
          nextButton = tabButtons[tabButtons.length - 1];
        }

        if (!nextButton) return;

        event.preventDefault();
        activateWhyTab(nextButton, { focus: true });
      });
    });

    window.addEventListener("resize", () => {
      const activeButton = tabButtons.find((button) => button.classList.contains("is-active"));
      syncWhyBridge(activeButton);
    });

    tabRow.addEventListener("scroll", () => {
      const activeButton = tabButtons.find((button) => button.classList.contains("is-active"));
      syncWhyBridge(activeButton);
    }, { passive: true });
  })();

  /* ------------------------------
     GALLERY WHEEL
  ------------------------------ */
  (() => {
    const galleryWheel = document.querySelector(".gallery-wheel");
    const galleryTrack = galleryWheel?.querySelector(".gallery-track");
    const prefersReducedGalleryMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const GALLERY_ROTATE_INTERVAL_MS = 4000;
    const GALLERY_SHIFT_DURATION_MS = 1200;

    if (!galleryWheel || !galleryTrack) return;

    let rotateId = null;
    let resetId = null;
    let isAnimating = false;

    const getGalleryItems = () => Array.from(galleryTrack.querySelectorAll(".gallery-item"));

    const updateCenteredGalleryItem = () => {
      const items = getGalleryItems();
      if (!items.length) return;

      const wheelRect = galleryWheel.getBoundingClientRect();
      const wheelCenterX = wheelRect.left + wheelRect.width / 2;
      let centeredIndex = 0;
      let shortestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(itemCenterX - wheelCenterX);

        if (distance < shortestDistance) {
          shortestDistance = distance;
          centeredIndex = index;
        }
      });

      const highlightedIndex = isHeroMobile()
        ? Math.min(centeredIndex + 1, items.length - 1)
        : centeredIndex;
      const centeredItem = items[highlightedIndex];

      items.forEach((item) => {
        item.classList.toggle("is-center", item === centeredItem);
      });
    };

    const getGalleryStep = () => {
      const firstItem = galleryTrack.querySelector(".gallery-item");
      if (!firstItem) return 0;

      const gap = Number.parseFloat(getComputedStyle(galleryTrack).gap || "0");
      return firstItem.getBoundingClientRect().width + gap;
    };

    const advanceGallery = () => {
      if (isAnimating) return;

      const items = getGalleryItems();
      const step = getGalleryStep();
      if (!step || !items.length) return;

      const incomingItem = items[items.length - 1];

      isAnimating = true;
      if (incomingItem) {
        incomingItem.classList.add("is-entering");
      }
      galleryTrack.style.transition = `transform ${GALLERY_SHIFT_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      galleryTrack.style.transform = `translateX(${-step}px)`;

      resetId = window.setTimeout(() => {
        const firstItem = galleryTrack.firstElementChild;
        if (firstItem) {
          galleryTrack.appendChild(firstItem);
        }

        if (incomingItem) {
          incomingItem.classList.remove("is-entering");
        }

        galleryTrack.style.transition = "none";
        galleryTrack.style.transform = "translateX(0)";
        galleryTrack.offsetHeight;
        updateCenteredGalleryItem();

        window.requestAnimationFrame(() => {
          galleryTrack.style.transition = "";
          isAnimating = false;
        });
      }, GALLERY_SHIFT_DURATION_MS + 40);
    };

    const clearGalleryInterval = () => {
      if (rotateId) {
        window.clearInterval(rotateId);
        rotateId = null;
      }
    };

    const stopGalleryRotation = () => {
      clearGalleryInterval();
      if (resetId) {
        window.clearTimeout(resetId);
        resetId = null;
      }
    };

    const startGalleryRotation = () => {
      clearGalleryInterval();
      if (prefersReducedGalleryMotion.matches) return;
      rotateId = window.setInterval(advanceGallery, GALLERY_ROTATE_INTERVAL_MS);
    };

    updateCenteredGalleryItem();
    startGalleryRotation();

    galleryWheel.addEventListener("mouseenter", clearGalleryInterval);
    galleryWheel.addEventListener("mouseleave", startGalleryRotation);
    galleryWheel.addEventListener("focusin", clearGalleryInterval);
    galleryWheel.addEventListener("focusout", startGalleryRotation);
    window.addEventListener("resize", updateCenteredGalleryItem);
  })();

  /* ------------------------------
     EXPANDING SEARCH BAR
  ------------------------------ */
  const searchToggle = document.getElementById("searchToggle");
  const searchInput = document.querySelector(".search-input");

  if (searchToggle && searchInput) {
    searchToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      searchInput.classList.toggle("active");
      if (searchInput.classList.contains("active")) searchInput.focus();
    });

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchToggle.contains(e.target)) {
        searchInput.classList.remove("active");
      }
    });
  }

  /* ------------------------------
         LIGHTBOX GALLERY 
  ------------------------------ */
  const galleryImgs = Array.from(document.querySelectorAll(".gallery-section .gallery-item img"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  if (galleryImgs.length && lightbox && lightboxImg) {
    const btnClose = lightbox.querySelector(".lightbox-close");
    const btnPrev = lightbox.querySelector(".lightbox-nav.prev");
    const btnNext = lightbox.querySelector(".lightbox-nav.next");
    const backdrop = lightbox.querySelector(".lightbox-backdrop[data-close='true']");

    const swipeSurface =
      lightbox.querySelector(".lightbox-figure") ||
      lightbox.querySelector(".lightbox-dialog") ||
      lightbox;

    const images = galleryImgs.map((img) => ({
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt") || "Gallery image",
    }));

    let currentIndex = 0;

    const show = (i) => {
      currentIndex = i;
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
    };

    const open = (i) => {
      show(i);

      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");

      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    const next = () => show((currentIndex + 1) % images.length);
    const prev = () => show((currentIndex - 1 + images.length) % images.length);

    // Open when clicking a thumbnail 
    galleryImgs.forEach((img, i) => {
      const btn = img.closest(".gallery-item");
      (btn || img).addEventListener("click", () => open(i));
    });

    // Button handlers
    if (btnClose) btnClose.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    if (btnNext)
      btnNext.addEventListener("click", (e) => {
        e.stopPropagation();
        next();
      });

    if (btnPrev)
      btnPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        prev();
      });

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    });

    // ------------------------------
    // Swipe support (mobile)
    // ------------------------------
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const SWIPE_MIN_X = 45;  // minimum horizontal distance
    const SWIPE_MAX_Y = 70;  // ignore if too vertical

    swipeSurface.addEventListener(
      "touchstart",
      (e) => {
        if (!lightbox.classList.contains("open")) return;
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      },
      { passive: true }
    );

    swipeSurface.addEventListener(
      "touchend",
      (e) => {
        if (!tracking || !lightbox.classList.contains("open")) return;
        tracking = false;

        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        // Ignore mostly-vertical gestures (so scrolling doesn't trigger)
        if (Math.abs(dy) > SWIPE_MAX_Y) return;

        // Swiping left and right
        if (dx <= -SWIPE_MIN_X) next(); 
        else if (dx >= SWIPE_MIN_X) prev();
      },
      { passive: true }
    );
  }



  /* --------------------------------------------
    PRODUCT CARDS (MOBILE): TAP TO TOGGLE
    - prevents “scroll opens” using movement threshold
    - no HTML changes required
  -------------------------------------------- */

  (() => {
    const cards = Array.from(document.querySelectorAll(".product-page-card.is-collapsible"));
    if (!cards.length) return;

    // Only run this behavior on touch/coarse pointers
    const isTouchDevice = () =>
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const closeAll = () => cards.forEach(c => c.classList.remove("open"));

    // Track touch movement to distinguish scroll vs tap
    const TAP_MOVE_PX = 16;       // increase if still sensitive (try 14–18)
    const TAP_TIME_MS = 450;

    cards.forEach((card) => {
      let startX = 0, startY = 0, startT = 0;
      let moved = false;

      // Touch start: record position/time
      card.addEventListener("touchstart", (e) => {
        if (!isTouchDevice()) return;

        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        startT = Date.now();
        moved = false;
      }, { passive: true });

      // Touch move: if finger moved enough, treat as scroll
      card.addEventListener("touchmove", (e) => {
        if (!isTouchDevice()) return;

        const t = e.touches[0];
        const dx = Math.abs(t.clientX - startX);
        const dy = Math.abs(t.clientY - startY);

        if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX) moved = true;
      }, { passive: true });

      // Touch end: toggle ONLY if it was a real tap (not scroll)
      card.addEventListener("touchend", (e) => {
        if (!isTouchDevice()) return;

        // If user tapped a link/button inside, let it behave normally
        if (e.target.closest("a, button, input, textarea, select, label")) return;

        const dt = Date.now() - startT;
        if (moved || dt > TAP_TIME_MS) return; // ignore scroll/long press

        // toggle accordion
        const wasOpen = card.classList.contains("open");
        closeAll();
        if (!wasOpen) card.classList.add("open");
      }, { passive: true });
    });

    // Tap outside closes (mobile)
    document.addEventListener("touchstart", (e) => {
      if (!isTouchDevice()) return;
      if (!e.target.closest(".product-page-card.is-collapsible")) closeAll();
    }, { passive: true });

    // ESC closes (desktop convenience)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    // Open by hash (keeps your existing behavior)
    function openCardByHash() {
      if (!window.location.hash) return;
      const targetId = window.location.hash.substring(1);
      const target = document.getElementById(targetId);
      if (!target || !target.classList.contains("product-page-card")) return;

      closeAll();
      target.classList.add("open");

      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }

    openCardByHash();
    window.addEventListener("hashchange", openCardByHash);
  })();




  /* ------------------------------
        E-MAIL DECRYPTION
  ------------------------------ */
  (function () {
    const EMAIL_MAP = {
      "X832xfftQzoHaRVLM0ktd7nT-fWjjJJbu0": "brad@nhg.za.net",
      "CECWOkme4jW2wADejCisU1JMauVsEIJyufE": "warren@nhg.co.za",
      "TN1AoO0P1sJdC5Oitn4rUYOmyRkGLSf0XNMP": "marinda@nhg.co.za",
      "CD4GeThCSxXOmKDdJRbhRtrLIYhZve3MnYc": "sales@nhg.za.net",
      "1etLEZANDecHXN-EFWsZX5Z0yHcGvUe9": "pbg@nhg.za.net",
      "LZyDaHUE52hXo4aE_GaxvEiU4CgyV2deaRok": "sunette@nhg.co.za",
      "B6JJUiB4dx-608rFq6likD5DEQ1u6hxEeupH4s8": "janefurse@nhg.co.za",
      "rixmHoBn0TlXSN7KL7HJvwRaTJifGfNg": "ltt@nhg.za.net",
      "H-VTO5WP15WPD_PNnbnFW-2pN_APQwqOS6Xh7g": "mankweng@nhg.co.za",
      "QjkA-YME3oiCRUCu_NypbdcB1lm0uvd_rhs": "sibasa@nhg.co.za",
      "uoYkB2AToYg4Fuk7SOGP_5swAdwvpUINZSM": "kwagga@nhg.co.za",
    };

    document.querySelectorAll("a.js-email").forEach((a) => {
      const token = (a.dataset.emailB64 || "").trim();   
      const email = EMAIL_MAP[token];
      if (!email) return;

      a.href = "mailto:" + email;

      const b = document.createElement("b");
      b.textContent = email;
      a.innerHTML = "";
      a.appendChild(b);
    });
  })();

  /* ------------------------------
      CONTACT FORM FEEDBACK
  ------------------------------ */
  (function () {
    const feedback = document.getElementById("form-feedback");
    if (!feedback) return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "1") {
      feedback.textContent = "Thank you! Your enquiry has been sent successfully.";
      feedback.classList.add("success", "show");
    }

    if (params.get("error") === "1") {
      feedback.textContent = "Something went wrong. Please try again.";
      feedback.classList.add("error", "show");
    }

    // Optional: remove query params from URL after showing
    if (params.get("success") || params.get("error")) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.hash
      );
    }
  })();



  /* ------------------------------
     HOME SMOOTH SCROLL FOR ANCHOR LINKS
  ------------------------------ */
  if (homePage) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        const target = href ? document.querySelector(href) : null;

        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }
});
