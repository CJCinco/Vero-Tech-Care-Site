(() => {
  const catalog = document.getElementById('workshop-catalog');
  if (!catalog) return;
  const filters = catalog.querySelector('.catalog-filters');
  const buttons = [...filters.querySelectorAll('button')];
  const series = [...catalog.querySelectorAll('.catalog-series')];
  const count = document.getElementById('workshop-result-count');

  function selectTopic(topic) {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
    let visible = 0;
    series.forEach(group => {
      group.hidden = topic !== 'all' && group.id !== topic;
      if (!group.hidden) visible += group.querySelectorAll('.catalog-row').length;
    });
    count.textContent = visible + (topic === 'all' ? ' workshops' : topic === 'smartphone-confidence' ? ' smartphone workshops' : ' AI workshops');
    window.dispatchEvent(new Event('resize'));
  }

  function revealLinkedWorkshop() {
    const target = document.getElementById(location.hash.slice(1));
    const group = target?.closest('.catalog-series');
    if (!group) return;
    selectTopic(group.id);
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }

  buttons.forEach(button => button.addEventListener('click', () => selectTopic(button.dataset.topic)));
  filters.hidden = false;
  window.addEventListener('hashchange', revealLinkedWorkshop);
  revealLinkedWorkshop();
})();
