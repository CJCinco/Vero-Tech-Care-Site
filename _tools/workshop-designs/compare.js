(() => {
  const notes = {
    table: 'Your direction: all six workshops at a glance, with titles and topics in tidy rows.',
    catalog: 'Inspired by <a href="https://seniorplanet.org/classes" target="_blank" rel="noopener noreferrer">Senior Planet</a>: browse every workshop or narrow the list by topic.',
    sessions: 'Inspired by <a href="https://www.apple.com/today/paloalto/" target="_blank" rel="noopener noreferrer">Today at Apple</a>: scan session titles, then open the details here.'
  };
  const buttons = [...document.querySelectorAll('[data-style]')];
  function selectStyle(style, updateUrl = true) {
    if (!notes[style]) style = 'table';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.style === style)));
    document.querySelectorAll('.design-panel').forEach(panel => { panel.hidden = panel.id !== 'design-' + style; });
    document.getElementById('style-note').innerHTML = notes[style];
    document.querySelector('.skip-link').href = location.pathname + '?style=' + style + '#main';
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('style', style);
      history.replaceState(null, '', url);
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => selectStyle(button.dataset.style)));
  selectStyle(new URLSearchParams(location.search).get('style') || 'table', false);
  const filters = [...document.querySelectorAll('.filters button')];
  filters.forEach(button => button.addEventListener('click', () => {
    const topic = button.dataset.topic;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    let count = 0;
    document.querySelectorAll('.catalog-row').forEach(row => {
      row.hidden = topic !== 'all' && row.dataset.topic !== topic;
      if (!row.hidden) count++;
    });
    document.getElementById('result-count').textContent = count + (topic === 'all' ? ' workshops' : topic === 'smartphone-confidence' ? ' smartphone workshops' : ' AI workshops');
  }));
  document.querySelectorAll('.nav-menu-toggle').forEach(button => button.addEventListener('click', () => {
    const nav = button.closest('nav');
    const open = nav.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  }));
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape') document.querySelectorAll('.primary-site-nav.is-open').forEach(nav => {
      nav.classList.remove('is-open');
      const toggle = nav.querySelector('.nav-menu-toggle');
      toggle.setAttribute('aria-expanded','false');
      toggle.focus();
    });
  });
})();
