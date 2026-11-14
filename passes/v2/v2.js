// /passes/v2: video hero, "Arma tu TIF" (itinerary + archetype + share card), holographic pass, sticky bar.
// Prices, countdown and a[data-go] links come from /passes/landing.js.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const es = () => (document.documentElement.getAttribute('data-lang') || 'es').startsWith('es');
  const push = (o) => { try { (window.dataLayer = window.dataLayer || []).push(o); } catch {} };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bi = (en, s) => `<span data-tif-en>${esc(en)}</span><span data-tif-es>${esc(s)}</span>`;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ hero video (muted background + sound modal)
  const yt = $('[data-yt]');
  const ID = yt?.dataset.yt;
  const embed = (extra) => `https://www.youtube-nocookie.com/embed/${ID}?${new URLSearchParams({ rel: '0', playsinline: '1', modestbranding: '1', iv_load_policy: '3', ...extra })}`;
  const saveData = navigator.connection?.saveData;
  if (yt && ID && !reduce && !saveData) {
    const f = document.createElement('iframe');
    f.src = embed({ autoplay: '1', mute: '1', loop: '1', playlist: ID, controls: '0', disablekb: '1', fs: '0' });
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.title = 'Tulum Innovation Fest'; f.tabIndex = -1; f.loading = 'eager';
    f.addEventListener('load', () => setTimeout(() => yt.classList.add('is-on'), 900));
    yt.appendChild(f);
  }
  const modal = $('[data-modal]'), mIn = $('[data-modal-in]');
  const closeModal = () => { modal.hidden = true; mIn.innerHTML = ''; document.body.style.overflow = ''; };
  $('[data-play]')?.addEventListener('click', () => {
    mIn.innerHTML = `<iframe src="${embed({ autoplay: '1', controls: '1' })}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Tulum Innovation Fest"></iframe>`;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    push({ event: 'v2_video_play' });
  });
  $('[data-close]')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // ------------------------------------------------------------------ Arma tu TIF
  const FALLBACK = [
    ['09', 'networking', 'Arrival & accreditation', 'Llegada y acreditación'], ['09', 'networking', 'Community experiences', 'Experiencias de comunidad'], ['09', 'fiesta', 'Opening activities', 'Actividades de apertura'],
    ['10', 'bienestar', 'Wellness breakfast', 'Wellness breakfast'], ['10', 'charla', 'Keynotes & panels', 'Keynotes y paneles'], ['10', 'taller', 'Workshops & founder sessions', 'Workshops y sesiones de founders'], ['10', 'fiesta', 'Tulum Lujo Descalzo Cocktail Gala', 'Tulum Lujo Descalzo Cocktail Gala', 'Executive'],
    ['11', 'taller', 'Growth workshops', 'Workshops de crecimiento'], ['11', 'panel', 'AI & finance conversations', 'Conversaciones de IA y finanzas'], ['11', 'whale-tank', 'Founder & investor sessions', 'Sesiones de founders e inversionistas'], ['11', 'networking', 'Community networking', 'Networking de comunidad'],
    ['12', 'bienestar', 'Recovery & beach experience', 'Recovery y experiencia de playa'], ['12', 'networking', 'Sponsor activations', 'Activaciones de patrocinadores'], ['12', 'whale-tank', 'Whale Tank Grand Final', 'Gran Final de Whale Tank'], ['12', 'fiesta', 'Awards & closing celebration', 'Premiación y celebración de cierre'], ['12', 'musica', 'Closing Festival Night · J.Pool (MX)', 'Closing Festival Night · J.Pool (MX)'],
  ].map(([day, type, en, s, role]) => ({ day, type, title: { en, es: s }, role: role || '' }));
  let EVENTS = FALLBACK;
  fetch('/api/schedule', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.events?.length) { EVENTS = d.events; if (picked.size) render(); } }).catch(() => {});

  const MAP = { capital: ['whale-tank', 'panel'], ai: ['charla', 'panel', 'taller'], build: ['taller', 'whale-tank'], network: ['networking'], wellness: ['bienestar'], nights: ['fiesta', 'musica'] };
  const ARCH = {
    capital: ['The Dealmaker', 'The Dealmaker', 'You come for the room where the money is. Whale Tank, investors and the Gala.', 'Vienes por la sala donde está el capital. Whale Tank, inversionistas y la Gala.'],
    ai: ['The Futurist', 'El Futurista', 'You want to see what is coming before everyone else. AI, finance and the Main Stage.', 'Quieres ver lo que viene antes que todos. IA, finanzas y el Main Stage.'],
    build: ['The Builder', 'El Builder', 'You leave with tactics, not just inspiration. Workshops and founder sessions.', 'Te vas con tácticas, no solo inspiración. Workshops y sesiones de founders.'],
    network: ['The Connector', 'El Conector', 'The best things happen between sessions. You came to meet the right people.', 'Lo mejor pasa entre sesiones. Vienes a conocer a las personas correctas.'],
    wellness: ['The Ritualist', 'El Ritualista', 'Sunrise yoga, cenotes and recovery. Business, but with your body in Tulum.', 'Sunrise yoga, cenotes y recovery. Negocios, pero con el cuerpo en Tulum.'],
    nights: ['The Night Owl', 'El Nocturno', 'Ideas by day, dance floor by night. You are staying for the closing set.', 'Ideas de día, pista de noche. Te quedas al set de cierre.'],
  };
  const DAYS = { '09': ['Wed 9', 'Mié 9'], '10': ['Thu 10', 'Jue 10'], '11': ['Fri 11', 'Vie 11'], '12': ['Sat 12', 'Sáb 12'] };
  const picked = new Set();
  let plan = null;

  function build() {
    const order = [...picked];
    const types = new Set(order.flatMap((k) => MAP[k]));
    const exec = picked.has('capital') || picked.has('network') || (picked.has('nights') && picked.size >= 2);
    const days = ['09', '10', '11', '12'].map((d) => {
      let ev = EVENTS.filter((e) => e.day === d && types.has(e.type));
      if (!exec) ev = ev.filter((e) => !/executive/i.test(e.role || ''));
      if (!ev.length) ev = EVENTS.filter((e) => e.day === d && !/executive/i.test(e.role || '')).slice(0, 1);
      return { d, ev: ev.slice(0, 3) };
    });
    // archetype: the pick with the most matching events (ties → first picked)
    let best = order[0], n = -1;
    order.forEach((k) => { const c = EVENTS.filter((e) => MAP[k].includes(e.type)).length + (k === order[0] ? .5 : 0); if (c > n) { n = c; best = k; } });
    return { days, exec, arch: ARCH[best], key: best };
  }

  const result = $('[data-result]'), hint = $('[data-hint]');
  function render() {
    if (!picked.size) { result.hidden = true; hint.hidden = false; plan = null; return; }
    plan = build(); hint.hidden = true; result.hidden = false;
    $('[data-arch]').innerHTML = bi(plan.arch[0], plan.arch[1]);
    $('[data-arch-d]').innerHTML = bi(plan.arch[2], plan.arch[3]);
    $('[data-days]').innerHTML = plan.days.map(({ d, ev }) => `<li><b>${bi(DAYS[d][0], DAYS[d][1])}</b><ul>${ev.map((e) => `<li>${bi(e.title?.en, e.title?.es)}${/executive/i.test(e.role || '') ? ' <em>Executive</em>' : ''}</li>`).join('')}</ul></li>`).join('');
    const pass = plan.exec ? 'executive-pass' : 'general-access';
    const why = plan.exec
      ? bi('Your fit is the <Executive Pass>: the VIP area and the Cocktail Gala are where the deals and the right people are.', 'Lo tuyo es el <Executive Pass>: el área VIP y la Cocktail Gala son donde se cierran los acuerdos y está la gente correcta.')
      : bi('Your fit is <General Access>: the full festival, all 4 days, for less than a dinner a day.', 'Lo tuyo es <General Access>: el festival completo, los 4 días, por menos de lo que cuesta una cena al día.');
    $('[data-reco]').innerHTML = `<p>${why.replace(/&lt;(.*?)&gt;/g, '<b>$1</b>')}</p><a class="ln-btn${plan.exec ? ' is-gold' : ''}" href="#pase" data-reco-go="${pass}">${bi('Put your name on it', 'Ponle tu nombre')} →</a>`;
  }
  $$('[data-chips] button').forEach((b) => {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const k = b.dataset.i; picked.has(k) ? picked.delete(k) : picked.add(k);
      b.setAttribute('aria-pressed', String(picked.has(k)));
      render();
      push({ event: 'v2_arma_pick', tif_interest: k, tif_interests: [...picked].join(',') });
    });
  });
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-reco-go]'); if (a) { setTier(a.dataset.recoGo); push({ event: 'v2_reco_click', tif_product_id: a.dataset.recoGo }); } });

  // share card (1080×1920 canvas)
  async function card() {
    if (!plan) return null;
    const L = es();
    await Promise.all([document.fonts.load('64px \"Bruno Ace\", Sora, sans-serif'), document.fonts.load('600 32px Sora, sans-serif'), document.fonts.load('300 32px Sora, sans-serif')]).catch(() => {});
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
    x.fillStyle = '#00080B'; x.fillRect(0, 0, 1080, 1920);
    const glow = (cx, cy, r, stops) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920); };
    glow(900, 260, 820, [[0, 'rgba(255,196,36,.55)'], [.35, 'rgba(255,106,43,.35)'], [1, 'rgba(255,106,43,0)']]);
    glow(120, 1700, 900, [[0, 'rgba(47,91,255,.55)'], [1, 'rgba(47,91,255,0)']]);
    x.strokeStyle = 'rgba(242,241,234,.05)'; x.lineWidth = 1;
    for (let i = 0; i <= 1080; i += 54) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1920); x.stroke(); }
    for (let j = 0; j <= 1920; j += 54) { x.beginPath(); x.moveTo(0, j); x.lineTo(1080, j); x.stroke(); }
    const logo = new Image(); logo.src = '/assets/tulum-innovation-fest-logo.png';
    await logo.decode().catch(() => {});
    if (logo.naturalWidth) { const w = 420, h = w * logo.naturalHeight / logo.naturalWidth; x.drawImage(logo, 90, 120, w, h); }
    const grad = (y0, y1) => { const g = x.createLinearGradient(90, y0, 990, y1); g.addColorStop(0, '#FFD65C'); g.addColorStop(.5, '#FF8A3D'); g.addColorStop(1, '#FF4D2E'); return g; };
    x.fillStyle = '#FFB37A'; x.font = '600 30px Sora, sans-serif'; x.fillText((L ? 'MI TIF 2026 · MI ARQUETIPO' : 'MY TIF 2026 · MY ARCHETYPE'), 90, 470);
    x.font = '96px \"Bruno Ace\", Sora, sans-serif'; x.fillStyle = grad(500, 600);
    const name = (L ? plan.arch[1] : plan.arch[0]).toUpperCase();
    const words = name.split(' '); let line = '', y = 590;
    words.forEach((w) => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > 900 && line) { x.fillText(line, 90, y); line = w; y += 108; } else line = t; }); x.fillText(line, 90, y);
    y += 70;
    // description
    x.fillStyle = 'rgba(242,241,234,.82)'; x.font = '300 36px Sora, sans-serif';
    const wrap = (txt, maxW, lh, x0) => { const ws = txt.split(' '); let l = ''; ws.forEach((w) => { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > maxW && l) { x.fillText(l, x0, y); l = w; y += lh; } else l = t; }); if (l) { x.fillText(l, x0, y); y += lh; } };
    wrap(L ? plan.arch[3] : plan.arch[2], 900, 50, 90);
    y += 40;
    plan.days.forEach(({ d, ev }) => {
      x.fillStyle = 'rgba(242,241,234,.06)'; const boxH = 80 + ev.length * 48; roundRect(x, 90, y, 900, boxH, 26); x.fill();
      x.fillStyle = '#FF8A3D'; x.font = '34px \"Bruno Ace\", Sora, sans-serif'; x.fillText((L ? DAYS[d][1] : DAYS[d][0]).toUpperCase(), 124, y + 52);
      x.fillStyle = '#F2F1EA'; x.font = '400 30px Sora, sans-serif';
      ev.forEach((e, i) => { let t = '✦ ' + (L ? e.title?.es : e.title?.en); while (x.measureText(t).width > 820 && t.length > 4) t = t.slice(0, -2); x.fillText(t, 124, y + 100 + i * 48); });
      y += boxH + 20;
    });
    // footer
    x.fillStyle = grad(1700, 1800); x.font = '64px \"Bruno Ace\", Sora, sans-serif'; x.fillText('DEC 9–12', 90, 1740);
    x.fillStyle = '#F2F1EA'; x.font = '300 34px Sora, sans-serif'; x.fillText('IKAL Arena · Tulum · 2026', 90, 1800);
    x.fillStyle = 'rgba(242,241,234,.65)'; x.font = '500 28px Sora, sans-serif'; x.fillText('tuluminnovationfest.com', 90, 1852);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }
  function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  const shareUrl = () => `${location.origin}/passes/v2?${new URLSearchParams({ utm_source: 'share', utm_medium: 'arma-tu-tif', utm_campaign: plan?.key || 'tif' })}`;
  function download(blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mi-tif-2026.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  $('[data-download]')?.addEventListener('click', async () => { const b = await card(); if (b) download(b); push({ event: 'v2_card_download', tif_archetype: plan?.key }); });
  $('[data-share]')?.addEventListener('click', async () => {
    const b = await card(); if (!b) return;
    const file = new File([b], 'mi-tif-2026.png', { type: 'image/png' });
    const text = es() ? `Mi arquetipo TIF: ${plan.arch[1]}. Nos vemos en Tulum, 9–12 dic.` : `My TIF archetype: ${plan.arch[0]}. See you in Tulum, Dec 9–12.`;
    push({ event: 'v2_card_share', tif_archetype: plan.key });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: `${text} ${shareUrl()}` });
      else if (navigator.share) await navigator.share({ text, url: shareUrl() });
      else { download(b); navigator.clipboard?.writeText(shareUrl()).catch(() => {}); }
    } catch {}
  });

  // ------------------------------------------------------------------ holographic pass
  const holo = $('[data-holo]'), stage = $('[data-stage]');
  if (holo && stage && !reduce) {
    let raf = 0;
    const set = (px, py) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      holo.style.setProperty('--ry', `${(px - .5) * 22}deg`); holo.style.setProperty('--rx', `${(.5 - py) * 18}deg`);
      holo.style.setProperty('--mx', `${px * 100}%`); holo.style.setProperty('--my', `${py * 100}%`);
    }); };
    stage.addEventListener('pointermove', (e) => { const r = holo.getBoundingClientRect(); set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))); });
    stage.addEventListener('pointerleave', () => set(.5, .5));
    // idle float on touch devices (gyroscope needs a permission prompt on iOS; a gentle loop is enough)
    if (matchMedia('(hover: none)').matches) {
      let t = 0, vis = false;
      new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(holo);
      const loop = () => { if (vis) { t += .016; set(.5 + Math.sin(t * 1.1) * .32, .5 + Math.cos(t * .8) * .22); } requestAnimationFrame(loop); };
      loop();
    }
  }
  const q = new URLSearchParams(location.search); const keep = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'code'].forEach((k) => { if (q.get(k)) keep[k] = q.get(k); });
  let code = keep.code || ''; if (!code) { try { code = sessionStorage.getItem('tif-promo') || ''; } catch {} }
  let tier = 'general-access', qty = 1; const price = {};
  const nameIn = $('[data-name]'), nameOut = $('[data-holo-name]'), cta = $('[data-cta]');
  function sync() {
    holo.dataset.tier = tier;
    $('[data-holo-tier]').textContent = tier === 'executive-pass' ? 'Executive Pass · VIP' : 'General Access';
    $('[data-holo-qty]').textContent = String(qty).padStart(2, '0');
    $$('.v2-tiers [data-tier]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.tier === tier)));
    cta.classList.toggle('is-gold', tier === 'executive-pass');
    cta.href = `/checkout?${new URLSearchParams({ pass: tier, detail: '0', qty: String(qty), ...keep, ...(code ? { code } : {}), ref: 'landing-passes-v2' })}`;
    const p = price[tier]; $('[data-total]').textContent = p ? `US$${(p * qty).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : (tier === 'executive-pass' ? 'US$1,500' : 'US$218');
  }
  function setTier(t) { tier = t; sync(); }
  $$('.v2-tiers [data-tier]').forEach((b) => b.addEventListener('click', () => { setTier(b.dataset.tier); push({ event: 'v2_tier', tif_product_id: tier }); }));
  $$('[data-q]').forEach((b) => b.addEventListener('click', () => { qty = Math.max(1, Math.min(10, qty + Number(b.dataset.q))); sync(); }));
  nameIn?.addEventListener('input', () => {
    const v = nameIn.value.trim();
    nameOut.classList.toggle('is-empty', !v);
    nameOut.innerHTML = v ? esc(v) : bi('Your name', 'Tu nombre');
  });
  nameOut.classList.add('is-empty');
  // carry the name into the checkout form (same-origin draft the checkout already restores)
  cta?.addEventListener('click', () => {
    const v = (nameIn?.value || '').trim().replace(/\s+/g, ' ');
    if (v) { try { const d = JSON.parse(sessionStorage.getItem('tif-buyer') || '{}'); const [first, ...rest] = v.split(' '); if (!d.firstName) d.firstName = first; if (!d.lastName1 && rest.length) d.lastName1 = rest.join(' '); sessionStorage.setItem('tif-buyer', JSON.stringify(d)); } catch {} }
    if (v) push({ event: 'v2_pass_named', tif_product_id: tier });
  });
  fetch('/api/checkout/options', { cache: 'no-store' }).then((r) => r.json()).then((o) => { (o.passes || []).forEach((p) => { if (Number(p.totalUsd) > 0) price[p.id] = Number(p.totalUsd); }); sync(); }).catch(() => {});
  sync();

  // ------------------------------------------------------------------ sticky bar (after hero, hidden over the pass + final CTA)
  const bar = $('[data-v2-sticky]'), hero = $('[data-v2-hero]');
  if (bar && hero) {
    const state = new Map();
    const io = new IntersectionObserver((ents) => { ents.forEach((e) => state.set(e.target, e.isIntersecting)); bar.classList.toggle('is-on', ![...state.values()].some(Boolean)); });
    [hero, $('#pase'), $('.ln-final')].filter(Boolean).forEach((el) => io.observe(el));
  }
})();
