(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-press-lang]');
  const year = document.querySelector('[data-press-year]');
  const kind = document.querySelector('[data-press-kind]');
  const cards = Array.from(document.querySelectorAll('[data-press-card]'));
  const status = document.querySelector('[data-press-status]');
  const empty = document.querySelector('[data-press-empty]');
  const lang = () => root.dataset.lang === 'es' ? 'es' : 'en';
  function update() {
    let count = 0;
    for (const card of cards) {
      const show = (year.value === 'all' || card.dataset.year === year.value) &&
        (kind.value === 'all' || card.dataset.kind === kind.value);
      card.hidden = !show;
      if (show) count++;
    }
    status.textContent = lang() === 'es' ? `${count} de ${cards.length} publicaciones` : `${count} of ${cards.length} publications`;
    empty.hidden = count !== 0;
    for (const option of document.querySelectorAll('option[data-en-label]')) {
      option.textContent = option.dataset[lang() === 'es' ? 'esLabel' : 'enLabel'];
    }
    toggle.setAttribute('aria-label', lang() === 'es' ? 'Switch to English' : 'Cambiar a espa\u00f1ol');
    toggle.textContent = lang() === 'es' ? 'ES / EN' : 'EN / ES';
  }
  toggle.addEventListener('click', () => {
    const next = lang() === 'en' ? 'es' : 'en';
    root.lang = next;
    root.dataset.lang = next;
    try { localStorage.setItem('tif-language', next); } catch (_) { /* Storage can be unavailable in private browsers. */ }
    update();
  });
  year.addEventListener('change', update);
  kind.addEventListener('change', update);
  document.querySelector('[data-press-filters]').hidden = false;
  update();
})();
