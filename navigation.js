(() => {
  const toggles = document.querySelectorAll(".nav-menu-toggle");

  toggles.forEach((toggle) => {
    const navigation = toggle.closest(".primary-site-nav");
    if (!navigation) return;

    const closeMenu = () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const willOpen = !navigation.classList.contains("is-open");
      navigation.classList.toggle("is-open", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 820) closeMenu();
    });
  });

  const pathName = window.location.pathname;
  const pathPart = pathName.split("/").filter(Boolean).pop() || "index";
  const pageKey = pathPart.replace(/\.html$/, "");
  const defaultDock = {
    label: "Book Tech Tune-Up",
    href: "/special",
    trigger: "main",
    emailSubject: "Vero Tech Care Question"
  };
  const dockByPage = {
    index: {
      label: "Choose Support",
      href: "#choose-path",
      trigger: "#choose-path"
    },
    testhome1: {
      label: "Choose Support",
      href: "#choose-path",
      trigger: "#choose-path"
    },
    testhome2: {
      label: "Choose Support",
      href: "#choose-path",
      trigger: "#choose-path"
    },
    testhome3: {
      label: "Choose Support",
      href: "#choose-path",
      trigger: "#choose-path"
    },
    "home-tech-help": {
      label: "Book Tech Tune-Up",
      href: "/special",
      trigger: "#services"
    },
    "business-websites": {
      label: "Book Consult",
      href: "/business-consult",
      trigger: "#business-support",
      emailSubject: "Business Tech Support Question"
    },
    "business-consult": {
      label: "Book Consult",
      href: "#booking-embed",
      trigger: "header .primary-page-hero",
      emailSubject: "Business Tech Support Question"
    },
    special: {
      label: "Book Tech Tune-Up",
      href: "#booking-embed",
      trigger: "header .primary-page-hero"
    },
    book: {
      label: "Book Tech Tune-Up",
      href: "#booking-embed",
      trigger: "header .primary-page-hero"
    },
    "book-digital-presence-checkup": {
      label: "Book Checkup",
      href: "#booking-embed",
      trigger: "header .primary-page-hero",
      emailSubject: "Digital Presence Checkup Question"
    },
    "tech-tips": {
      label: "Book Tech Tune-Up",
      href: "/special",
      trigger: "#guides"
    },
    workshops: {
      label: "Book Tech Tune-Up",
      href: "/special",
      trigger: "#next-workshop"
    },
    "smartphone-confidence": {
      label: "Book Tech Tune-Up",
      href: "/special",
      trigger: "header .primary-page-hero",
      emailSubject: "Smartphone Confidence Series Question"
    },
    "smartphone-confidence-basics": {
      label: "Explore Series",
      href: "/smartphone-confidence",
      trigger: "#notes",
      emailSubject: "Smartphone Confidence Series Question"
    }
  };
  const pageDock = {
    ...defaultDock,
    ...(dockByPage[pageKey] || {})
  };

  const mobileDock = document.createElement("nav");
  mobileDock.className = "mobile-dock";
  mobileDock.setAttribute("aria-label", "Quick actions");
  mobileDock.setAttribute("aria-hidden", "true");

  const actions = [
    [pageDock.label, pageDock.href],
    ["Text", "sms:+17725884324"],
    ["Call", "tel:+17725884324"],
    ["Email", `mailto:cj@verotechcare.com?subject=${encodeURIComponent(pageDock.emailSubject)}`]
  ];

  actions.forEach(([label, href]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    mobileDock.appendChild(link);
  });

  document.body.appendChild(mobileDock);

  const trigger = document.querySelector(pageDock.trigger) || document.querySelector("main");
  const scheduler = document.querySelector(".scheduler-embed-shell");
  let updateQueued = false;

  const schedulerIsVisible = () => {
    if (!scheduler) return false;
    const bounds = scheduler.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom > 0;
  };

  const updateMobileDock = () => {
    updateQueued = false;
    const triggerTop = trigger
      ? trigger.getBoundingClientRect().top + window.scrollY
      : window.innerHeight;
    const showAfter = Math.max(0, triggerTop - window.innerHeight * 0.25);
    const shouldShow =
      window.innerWidth < 820 &&
      window.scrollY > showAfter &&
      !schedulerIsVisible();

    mobileDock.classList.toggle("is-visible", shouldShow);
    mobileDock.setAttribute("aria-hidden", String(!shouldShow));
  };

  const queueMobileDockUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(updateMobileDock);
  };

  updateMobileDock();
  window.addEventListener("scroll", queueMobileDockUpdate, { passive: true });
  window.addEventListener("resize", queueMobileDockUpdate);
  window.addEventListener("load", queueMobileDockUpdate);
})();
