// El Faro: directory filter by theme, reveal on scroll, beam follows the pointer slightly.
(() => {
  const cards = [...document.querySelectorAll('.ef-init')];
  document.querySelectorAll('.ef-chip').forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    document.querySelectorAll('.ef-chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    cards.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.themes.split(' ').includes(f)); });
  }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll('.ef-theme, .ef-purpose-list li, .ef-person, .ef-way, .ef-layers > div').forEach((el, i) => { el.style.setProperty('--d', `${(i % 6) * 70}ms`); io.observe(el); });
})();
