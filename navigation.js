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
})();
