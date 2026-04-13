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
     NAV DROPDOWNS (MOBILE: TAP ONCE OPENS, TAP AGAIN GOES)
     Desktop remains hover-based via CSS.
  ------------------------------ */
  const MOBILE_BREAKPOINT = 900;
  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  const submenuItems = Array.from(document.querySelectorAll("li.has-submenu"));

  function closeAllSubmenus() {
    submenuItems.forEach((li) => {
      li.classList.remove("open");
      const a = li.querySelector("a.nav-main-link");
      if (a) a.setAttribute("aria-expanded", "false");
      li.dataset.tapOpen = "0";
    });
  }

  // Mobile: first tap opens submenu, second tap follows link
  submenuItems.forEach((li) => {
    const link = li.querySelector("a.nav-main-link");
    if (!link) return;

    li.dataset.tapOpen = "0";

    link.addEventListener("click", (e) => {
      if (!isMobile()) return; 

      const isOpen = li.classList.contains("open");
      const wasTappedOpen = li.dataset.tapOpen === "1";

      // If closed: open it and stop navigation
      if (!isOpen) {
        e.preventDefault();

        closeAllSubmenus();
        li.classList.add("open");
        link.setAttribute("aria-expanded", "true");
        li.dataset.tapOpen = "1";
        return;
      }

      // If open but this tap wasn't the "second tap" yet: keep open and allow next tap to navigate
      if (isOpen && !wasTappedOpen) {
        e.preventDefault();
        li.dataset.tapOpen = "1";
        return;
      }

      // Second tap while open -> allow navigation to page
    });
  });

  // Mobile: tap outside closes
  document.addEventListener("click", (e) => {
    if (!isMobile()) return;
    if (!e.target.closest(".nav-links")) closeAllSubmenus();
  });

  // Close when resizing up to desktop
  window.addEventListener("resize", () => {
    if (!isMobile()) closeAllSubmenus();
  });

  /* ------------------------------
     ROTATING HERO IMAGE
  ------------------------------ */
  const heroLayers = document.querySelectorAll(".hero .hero-bg");

  if (heroLayers.length === 2) {
    const heroImages = [
      "js/Wallpapers/NHG-Wallpaper-1.jpg",
      "js/Wallpapers/NHG-Wallpaper-2.jpg",
      "js/Wallpapers/NHG-Wallpaper-3.jpg",
      "js/Wallpapers/NHG-Wallpaper-4.jpg",
      "js/Wallpapers/NHG-Wallpaper-5.webp",
    ];

    const overlay =
      'linear-gradient(135deg, rgba(50, 50, 65, 0.3), rgba(7, 13, 22, 0.5))';

    const DURATION = 1100;
    const INTERVAL = 7000;

    let index = 0;
    let showing = 0;
    let lock = false;

    const setBg = (el, img) => {
      el.style.backgroundImage = `${overlay}, url("${img}")`;
    };

    heroLayers[0].classList.add("center");
    heroLayers[1].classList.add("right");
    setBg(heroLayers[0], heroImages[0]);

    const tick = () => {
      if (lock) return;
      lock = true;

      const outgoing = heroLayers[showing];
      const incoming = heroLayers[1 - showing];
      const nextIndex = (index + 1) % heroImages.length;

      incoming.classList.add("no-trans");
      incoming.classList.remove("left", "center");
      incoming.classList.add("right");
      setBg(incoming, heroImages[nextIndex]);
      incoming.offsetHeight;

      incoming.classList.remove("no-trans");
      requestAnimationFrame(() => {
        incoming.classList.remove("right");
        incoming.classList.add("center");

        outgoing.classList.remove("center");
        outgoing.classList.add("left");
      });

      window.setTimeout(() => {
        outgoing.classList.add("no-trans");
        outgoing.classList.remove("left");
        outgoing.classList.add("right");
        outgoing.offsetHeight;
        outgoing.classList.remove("no-trans");

        showing = 1 - showing;
        index = nextIndex;
        lock = false;
      }, DURATION);
    };

    window.setInterval(tick, INTERVAL);
  }

  /* ------------------------------
     SCROLL REVEAL ANIMATIONS
  ------------------------------ */
  const headings = document.querySelectorAll(".product-hero-home h2");

  if (headings.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    headings.forEach((h) => observer.observe(h));
  }

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
  const galleryImgs = Array.from(document.querySelectorAll(".gallery-grid img"));
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
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  })();



  /* ------------------------------
     SMOOTH SCROLL FOR ANCHOR LINKS
  ------------------------------ */
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
});
