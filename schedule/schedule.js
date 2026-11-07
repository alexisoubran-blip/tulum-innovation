// Interactive schedule: day tabs, type chips, venue + search, "now" highlight, add to calendar, print to PDF.
(() => {
  const $ = (id) => document.getElementById(id);
  const es = () => (document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'es').startsWith('es');
  const L = (o) => (o && typeof o === 'object' ? (es() ? o.es : o.en) || o.es || o.en : o || '');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TYPES = {
    charla: ['#FF6A2B', 'Talks', 'Charlas'], panel: ['#FFC424', 'Panels', 'Paneles'], 'whale-tank': ['#1FC6FF', 'Whale Tank', 'Whale Tank'],
    taller: ['#A07BFF', 'Workshops', 'Talleres'], musica: ['#FF3374', 'Music · DJs', 'Música · DJs'], bienestar: ['#4BFFB3', 'Wellness', 'Bienestar'],
    'el-faro': ['#F6D28B', 'El Faro', 'El Faro'], networking: ['#FF9A3D', 'Networking', 'Networking'], fiesta: ['#D35CFF', 'Parties', 'Fiestas'],
  };
  const DAYS = { '09': ['Wed', 'Mié'], 10: ['Thu', 'Jue'], 11: ['Fri', 'Vie'], 12: ['Sat', 'Sáb'] };
  const q = new URLSearchParams(location.search);
  const state = { events: [], day: q.get('day') || 'all', types: new Set((q.get('type') || '').split(',').filter((t) => TYPES[t])), venue: '', search: '' };

  // Tulum is UTC-5 all year (no DST).
  const tulumNow = () => { const d = new Date(Date.now() - 5 * 3600e3); return { day: d.getUTCFullYear() === 2026 && d.getUTCMonth() === 11 ? String(d.getUTCDate()).padStart(2, '0') : null, hm: d.toISOString().slice(11, 16) }; };
  const isNow = (e) => { const n = tulumNow(); if (n.day !== e.day || !e.start) return false; const end = e.end && e.end > e.start ? e.end : '23:59'; return n.hm >= e.start && n.hm < end; };

  function renderControls() {
    const t = (en, sp) => (es() ? sp : en);
    $('shDays').innerHTML = [['all', t('All', 'Todos'), t('4 days', '4 días')], ...['09', '10', '11', '12'].map((d) => [d, DAYS[d]]).map(([d, [en, sp]]) => [d, `${es() ? sp : en} ${Number(d)}`, t('December', 'Diciembre')])]
      .map(([d, b, s]) => `<button class="sh-day" role="tab" type="button" data-day="${d}" aria-selected="${state.day === d}"><b>${b}</b><span>${s}</span></button>`).join('');
    const present = new Set(state.events.map((e) => e.type));
    $('shTypes').innerHTML = Object.entries(TYPES).filter(([k]) => present.has(k))
      .map(([k, [c, en, sp]]) => `<button class="sh-chip" type="button" data-type="${k}" style="--c:${c}" aria-pressed="${state.types.has(k)}"><i></i>${es() ? sp : en}</button>`).join('');
    const venues = [...new Set(state.events.map((e) => e.venue).filter(Boolean))].sort();
    $('shVenue').innerHTML = `<option value="">${t('All venues', 'Todos los lugares')}</option>` + venues.map((v) => `<option${v === state.venue ? ' selected' : ''}>${esc(v)}</option>`).join('');
    $('shSearch').placeholder = t('Search talk, speaker, DJ…', 'Busca charla, speaker, DJ…');
  }

  function render() {
    const t = (en, sp) => (es() ? sp : en);
    const s = state.search.toLowerCase();
    const list = state.events.filter((e) => (state.day === 'all' || e.day === state.day) && (!state.types.size || state.types.has(e.type)) && (!state.venue || e.venue === state.venue)
      && (!s || [L(e.title), e.person, e.role, e.venue, L(e.desc)].join(' ').toLowerCase().includes(s)));
    if (!state.events.length) { $('shList').innerHTML = `<div class="sh-empty">${t('The full schedule will be published here very soon.', 'El horario completo se publica aquí muy pronto.')}</div>`; return; }
    if (!list.length) { $('shList').innerHTML = `<div class="sh-empty">${t('Nothing matches these filters.', 'Nada coincide con estos filtros.')}</div>`; return; }
    let html = ''; let cur = '';
    for (const e of list) {
      if (e.day !== cur) { cur = e.day; const [en, sp] = DAYS[e.day]; html += `<div class="sh-dayhead"><h2>${es() ? `${sp} ${Number(e.day)} dic` : `${en} Dec ${Number(e.day)}`}</h2><span>${list.filter((x) => x.day === cur).length} ${t('events', 'eventos')}</span></div>`; }
      const [c, en, sp] = TYPES[e.type] || TYPES.charla;
      html += `<article class="sh-ev${isNow(e) ? ' is-now' : ''}" id="${esc(e.id)}" style="--c:${c}">
        <div class="sh-time">${e.start ? `<b>${esc(e.start)}</b>${e.end ? `<small>${t('to', 'a')} ${esc(e.end)}</small>` : ''}` : `<small>${t('Time TBA', 'Hora por confirmar')}</small>`}</div>
        <div class="sh-body${e.photo ? '' : ' no-photo'}">${e.photo ? `<div class="sh-thumb"><img src="${esc(e.photo)}" alt="" loading="lazy" decoding="async"></div>` : ''}
          <div><span class="sh-tag">${es() ? sp : en}${isNow(e) ? ` <em>${t('Now', 'Ahora')}</em>` : ''}</span><h3>${esc(L(e.title))}</h3>
          <p class="sh-meta">${[e.person && `${esc(e.person)}${e.role ? ` · ${esc(e.role)}` : ''}`, e.venue && `📍 ${esc(e.venue)}`].filter(Boolean).join(' &nbsp;·&nbsp; ')}</p>
          ${L(e.desc) ? `<p class="sh-desc">${esc(L(e.desc))}</p>` : ''}</div></div>
        <div class="sh-actions"><button class="sh-ical" type="button" data-ics="${esc(e.id)}">+ ${t('Calendar', 'Calendario')}</button>${e.link ? `<a class="sh-more" href="${esc(e.link)}" target="_blank" rel="noopener">${t('More', 'Más')} ↗</a>` : ''}</div>
      </article>`;
    }
    $('shList').innerHTML = html;
  }

  function sync() {
    const p = new URLSearchParams();
    if (state.day !== 'all') p.set('day', state.day);
    if (state.types.size) p.set('type', [...state.types].join(','));
    try { history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname); } catch {}
    renderControls(); render();
  }

  function ics(e) {
    const dt = (hm) => `202612${e.day}T${(hm || '00:00').replace(':', '')}00`;
    const end = e.end && e.end > e.start ? e.end : e.start ? `${String(Math.min(23, Number(e.start.slice(0, 2)) + 1)).padStart(2, '0')}${e.start.slice(2)}` : '23:59';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tulum Innovation Fest//Schedule//ES', 'BEGIN:VEVENT', `UID:${e.id}-tif2026@tuluminnovationfest.com`,
      `DTSTART;TZID=America/Cancun:${dt(e.start)}`, `DTEND;TZID=America/Cancun:${dt(end)}`, `SUMMARY:${L(e.title).replace(/[,;]/g, ' ')} · TIF 2026`,
      `LOCATION:${(e.venue || 'Tulum').replace(/[,;]/g, ' ')}, Tulum`, `DESCRIPTION:${[e.person, L(e.desc)].filter(Boolean).join(' — ').replace(/[,;\n]/g, ' ')}`,
      'URL:https://www.tuluminnovationfest.com/schedule', 'END:VEVENT', 'END:VCALENDAR'];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    a.download = `tif-${e.day}-${(e.start || '').replace(':', '')}.ics`; a.click();
  }

  $('shDays').addEventListener('click', (ev) => { const b = ev.target.closest('[data-day]'); if (b) { state.day = b.dataset.day; sync(); } });
  $('shTypes').addEventListener('click', (ev) => { const b = ev.target.closest('[data-type]'); if (!b) return; const k = b.dataset.type; state.types.has(k) ? state.types.delete(k) : state.types.add(k); sync(); });
  $('shVenue').addEventListener('change', (ev) => { state.venue = ev.target.value; render(); });
  $('shSearch').addEventListener('input', (ev) => { state.search = ev.target.value.trim(); render(); });
  $('shList').addEventListener('click', (ev) => { const b = ev.target.closest('[data-ics]'); if (b) { const e = state.events.find((x) => x.id === b.dataset.ics); if (e) ics(e); } });
  $('shPrint').addEventListener('click', () => { const prev = state.day; state.day = 'all'; state.types.clear(); state.venue = ''; state.search = ''; renderControls(); render(); setTimeout(() => { window.print(); state.day = prev; sync(); }, 50); });
  new MutationObserver(() => { renderControls(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang', 'lang'] });

  fetch('/api/schedule').then((r) => r.json()).then((j) => {
    state.events = j.events || [];
    $('shSample').hidden = j.source !== 'sample';
    // During the festival, open on today.
    const n = tulumNow(); if (!q.get("day") && n.day && DAYS[n.day]) state.day = n.day;
    renderControls(); render();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' });
  }).catch(() => { $('shList').innerHTML = '<div class="sh-empty">—</div>'; });
})();
