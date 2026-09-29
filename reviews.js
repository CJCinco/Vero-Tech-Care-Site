(() => {
  document.querySelectorAll('.customer-review-card').forEach((card) => {
    const excerpt = card.querySelector('[data-review-excerpt]');
    const fullReview = card.querySelector('[data-review-full]');
    const toggle = card.querySelector('[data-review-toggle]');
    if (!excerpt || !fullReview || !toggle || !fullReview.textContent.trim()) return;

    const collapsedLabel = toggle.textContent;
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? 'Show less' : collapsedLabel;
      excerpt.hidden = expanded;
      fullReview.hidden = !expanded;
    });
  });
})();
