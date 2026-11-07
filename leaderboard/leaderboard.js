// Speaker Challenge leaderboard: paid tickets only (server side), refreshed every minute.
(() => {
  const $ = (id) => document.getElementById(id);
  const es = () => (document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'es').startsWith('es');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const av = (name, photo) => `<span class="sc-av" data-i="${esc(initials(name))}">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.textContent=this.parentNode.dataset.i">` : esc(initials(name))}</span>`;
  const bar = (pct) => `<div class="sc-bar${pct >= 100 ? ' is-done' : ''}"><i style="--w:${Math.min(100, pct)}%"></i></div>`;
  let data = null;

  function render() {
    if (!data) return;
    const t = (en, sp) => (es() ? sp : en);
    $('scTotal').textContent = data.totalTickets;
    const time = new Date(data.updatedAt).toLocaleTimeString(es() ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    $('scUpdated').textContent = t(`Paid tickets · updated ${time}`, `Boletos pagados · actualizado ${time}`);
    $('scBoard').innerHTML = data.people.length ? data.people.map((p, i) => `
      <li class="sc-row${i < 3 && p.tickets > 0 ? ' is-top' : ''}">
        <span class="sc-rank">${i + 1}</span>${av(p.name, p.photo)}
        <div class="sc-who"><b>${esc(p.name)}</b>${p.organization ? `<small>${esc(p.organization)}</small>` : ''}${p.goal ? bar(p.pct) : ''}</div>
        <div class="sc-score"><b>${p.tickets}</b><small>${p.goal ? t(`of ${p.goal}`, `de ${p.goal}`) : t('tickets', 'boletos')}</small></div>
      </li>`).join('') : `<li class="sc-empty">${t('The challenge is on. The first sale takes the #1 spot.', 'El reto ya arrancó. La primera venta se queda con el #1.')}</li>`;
    $('scPanels').innerHTML = data.panels.map((p) => `
      <article class="sc-panel"><h3>${esc(p.name)}</h3>
        <div class="sc-faces">${p.members.map((m) => av(m.name, m.photo)).join('')}</div>
        <div class="sc-num"><b>${p.tickets}</b><span>${t(`of ${p.goal} tickets`, `de ${p.goal} boletos`)}</span></div>${bar(p.pct)}
      </article>`).join('');
  }

  async function load() {
    try {
      const r = await fetch('/api/challenge/leaderboard', { cache: 'no-store' });
      const j = await r.json();
      if (j.ok) { data = j; render(); }
    } catch {}
  }
  load();
  setInterval(load, 60000);
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang', 'lang'] });
})();
