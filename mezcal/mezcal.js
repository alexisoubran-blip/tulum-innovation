// Innovation Mezcal: age gate, hero tilt, exploded label driven by scroll, reveals.
(() => {
  const KEY = 'tif-mezcal-age';
  const gate = document.getElementById('mz-gate');
  let ok = false;
  try { ok = localStorage.getItem(KEY) === 'yes'; } catch (_) {}
  if (!ok && gate) {
    gate.hidden = false; document.documentElement.classList.add('mz-locked');
    gate.querySelector('[data-gate="yes"]').addEventListener('click', () => {
      try { localStorage.setItem(KEY, 'yes'); } catch (_) {}
      gate.hidden = true; document.documentElement.classList.remove('mz-locked');
    });
    setTimeout(() => gate.querySelector('[data-gate="yes"]').focus(), 50);
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero tilt (pointer devices only)
  const stage = document.querySelector('[data-tilt]');
  const label = stage?.querySelector('.mz-label');
  if (stage && label && matchMedia('(hover: hover)').matches && !reduce) {
    const hero = stage.closest('section');
    hero.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
      label.style.setProperty('--ty', `${Math.max(-1, Math.min(1, x)) * 10}deg`);
      label.style.setProperty('--tx', `${Math.max(-1, Math.min(1, -y)) * 8}deg`);
    });
    hero.addEventListener('pointerleave', () => { label.style.setProperty('--ty', '0deg'); label.style.setProperty('--tx', '0deg'); });
  }

  // exploded label
  const sec = document.querySelector('.mz-explode');
  const ex = document.querySelector('[data-explode]');
  const steps = [...document.querySelectorAll('.mz-steps li')];
  if (sec && ex) {
    const layers = [...ex.querySelectorAll('.mz-l')];
    layers.forEach((l) => l.style.setProperty('--z', l.dataset.z || 0));
    const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    let last = -2, raf = 0;
    const update = () => {
      raf = 0;
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - innerHeight;
      const t = Math.max(0, Math.min(1, -r.top / total));
      // 0–.12 open · .12–.9 read six layers · .9–1 close
      const open = t < .12 ? ease(t / .12) : t > .9 ? ease(1 - (t - .9) / .1) : 1;
      ex.style.setProperty('--p', reduce ? 0 : open.toFixed(3));
      const k = t < .12 || t > .9 ? -1 : Math.min(5, Math.floor((t - .12) / (.78 / 6)));
      if (k !== last) {
        last = k;
        ex.classList.toggle('is-reading', k >= 0);
        layers.forEach((l) => l.classList.toggle('is-on', l.dataset.k === String(k)));
        const shown = k < 0 ? (t > .9 ? 5 : 0) : k;
        steps.forEach((s, i) => { s.classList.toggle('is-on', i === shown); s.classList.toggle('is-near', i === shown + 1); });
      }
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // reveals
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll('.mz-photo, .mz-bottle-grid > div, .mz-taste-inner, .mz-spec div').forEach((el, i) => {
    if (!el.classList.contains('mz-photo')) { el.classList.add('mz-reveal'); el.style.transitionDelay = `${(i % 6) * 60}ms`; }
    io.observe(el);
  });
})();
