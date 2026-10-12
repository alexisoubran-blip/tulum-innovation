// Whale Tank 2026 application deadline countdown.
// Every [data-deadline] block counts down to its ISO timestamp and switches
// to a closed state once the deadline passes.
(() => {
  const blocks = [...document.querySelectorAll('[data-deadline]')];
  if (!blocks.length) return;
  const pad = (n) => String(n).padStart(2, '0');

  const close = (block) => {
    if (block.classList.contains('is-closed')) return;
    block.classList.add('is-closed');
    const label = block.querySelector('.wt-countdown-label');
    if (label) {
      label.dataset.en = label.dataset.closedEn;
      label.dataset.es = label.dataset.closedEs;
      label.textContent = document.documentElement.dataset.lang === 'es' ? label.dataset.es : label.dataset.en;
    }
  };

  const tick = () => {
    const now = Date.now();
    blocks.forEach((block) => {
      const left = Math.max(0, new Date(block.dataset.deadline).getTime() - now);
      const s = Math.floor(left / 1000);
      const values = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
      Object.entries(values).forEach(([key, value]) => {
        const el = block.querySelector(`[data-cd="${key}"]`);
        if (el) el.textContent = pad(value);
      });
      if (left === 0) close(block);
    });
  };

  tick();
  const timer = setInterval(() => {
    tick();
    if (blocks.every((b) => b.classList.contains('is-closed'))) clearInterval(timer);
  }, 1000);
})();
