// Conversion landings: live prices, countdown, quantity → checkout, sticky buy bar, GTM events.
(() => {
  const $$ = (s) => [...document.querySelectorAll(s)];
  const es = () => (document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'es').startsWith('es');
  const push = (o) => { try { (window.dataLayer = window.dataLayer || []).push(o); } catch {} };
  const usd = (n) => `US$${Number(n).toLocaleString('en-US', { maximumFractionDigits: Number(n) % 1 ? 2 : 0 })}`;
  const mxn = (n) => `$${Math.round(n).toLocaleString('es-MX')} MXN`;
  const q = new URLSearchParams(location.search);
  const keep = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'code'].forEach((k) => { if (q.get(k)) keep[k] = q.get(k); });
  let code = keep.code || '';
  if (!code) { try { code = sessionStorage.getItem('tif-promo') || ''; } catch {} }

  // Quantity steppers update their buy links.
  const link = (pass, qty) => `/checkout?${new URLSearchParams({ pass, detail: '0', qty: String(qty), ...keep, ...(code ? { code } : {}), ref: `landing-${location.pathname.replace(/\W/g, '')}` })}`;
  $$('[data-pass]').forEach((card) => {
    const pass = card.dataset.pass; let qty = 1;
    const out = card.querySelector('output'); const max = Number(card.dataset.max || 10);
    const sync = () => { if (out) out.value = qty; card.querySelectorAll('[data-buy]').forEach((a) => { a.href = link(pass, qty); }); };
    card.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { qty = Math.max(1, Math.min(max, qty + Number(b.dataset.step))); sync(); }));
    sync();
  });
  $$('a[data-go]').forEach((a) => { a.href = link(a.dataset.go, 1); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/checkout"]'); if (!a) return;
    const pass = new URL(a.href, location.href).searchParams.get('pass');
    push({ event: 'landing_cta_click', tif_product_id: pass, tif_landing: location.pathname });
  });

  // Live prices from the checkout (same numbers the buyer will pay).
  fetch('/api/checkout/options', { cache: 'no-store' }).then((r) => r.json()).then((o) => {
    (o.passes || []).forEach((p) => {
      if (Number(p.totalUsd) > 0) $$(`[data-usd="${p.id}"]`).forEach((el) => { el.textContent = usd(p.totalUsd); });
      if (Number(p.priceMxn) > 0) $$(`[data-mxn="${p.id}"]`).forEach((el) => { el.textContent = mxn(p.priceMxn); });
      if (Number(p.totalUsd) > 0) $$(`[data-perday="${p.id}"]`).forEach((el) => { el.textContent = usd(Math.ceil(p.totalUsd / 4)); });
      if (Number(p.priceMxn) > 0) $$(`[data-perday-mxn="${p.id}"]`).forEach((el) => { el.textContent = mxn(Math.round(p.priceMxn / 4)); });
    });
    const ga = (o.passes || []).find((p) => p.id === 'general-access');
    if (ga) $$('[data-usd-ga-strike]').forEach((el) => { el.textContent = usd(ga.totalUsd); });
  }).catch(() => {});

  // Countdown to December 9, 2026, 09:00 Tulum (UTC-5).
  const target = Date.UTC(2026, 11, 9, 14, 0, 0);
  const cd = $$('[data-cd]');
  const tick = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const v = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    cd.forEach((el) => { el.textContent = String(v[el.dataset.cd]).padStart(2, '0'); });
  };
  if (cd.length) { tick(); setInterval(tick, 1000); }

  // Sticky buy bar after the hero, hidden over the pass cards and the final CTA.
  const bar = document.querySelector('.ln-sticky');
  const hero = document.querySelector('.ln-hero');
  const hide = $$('.ln-passes, .ln-final');
  if (bar && hero) {
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.target === hero) hero._in = e.isIntersecting; else e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); });
      bar.classList.toggle('is-on', !hero._in && !seen.size);
    }, { threshold: 0 });
    io.observe(hero); hide.forEach((h) => io.observe(h));
  }

  // Nights list (parties + DJs) from the festival schedule sheet; the static list stays if it fails.
  const nl = document.querySelector('[data-nights]');
  if (nl) fetch('/api/schedule', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
    const ev = (d?.events || []).filter((e) => e.type === 'fiesta' || e.type === 'musica');
    if (!ev.length) return;
    const DAY = { '09': ['Wed 9', 'Mié 9'], '10': ['Thu 10', 'Jue 10'], '11': ['Fri 11', 'Vie 11'], '12': ['Sat 12', 'Sáb 12'] };
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bi = (en, es) => `<span data-tif-en>${esc(en)}</span><span data-tif-es>${esc(es)}</span>`;
    ev.sort((a, b) => (a.day + (a.start || '99')).localeCompare(b.day + (b.start || '99')));
    nl.innerHTML = ev.map((e) => {
      const d = DAY[e.day] || [e.day, e.day];
      const head = e.type === 'musica' && e.featured;
      const tag = /executive|vip/i.test(e.role || '') ? ' <em>Executive</em>' : '';
      const when = e.start ? ` · ${esc(e.start)}` : '';
      return `<li${head ? ' class="is-head"' : ''}><b>${bi(d[0], d[1])}${when}</b><span>${bi(e.title?.en || '', e.title?.es || '')}${tag}</span></li>`;
    }).join('');
  }).catch(() => {});

  push({ event: 'landing_view', tif_landing: location.pathname });
})();
