// /admin/vendedores — seller control: sales, commission, payouts. Same admin token as /admin/speakers.
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'tifAdminToken';
  const tok = { get() { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } }, set(v) { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch {} } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mxn = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  const ERR = { code_taken: 'Ese código ya existe.', code_length: 'El código debe tener de 3 a 16 letras o números.', invalid_name: 'Escribe un nombre.', invalid_commission: 'La comisión debe ser de 0 a 50%.', amount_above_pending: 'El monto es mayor a lo pendiente.', invalid_amount: 'Monto inválido.', invalid_email: 'Correo inválido.' };
  let data = { sellers: [], payouts: [] }, orders = [], sortK = 'tickets', sortDir = -1;

  async function api(body) {
    const r = await fetch('/api/blokko/admin', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok.get() }, body: JSON.stringify(body) });
    if (r.status === 401) { logout('Clave incorrecta o sesión vencida.'); throw new Error('401'); }
    return r.json();
  }
  function showLogin(err = '') { $('app').hidden = true; $('login').hidden = false; $('loginErr').textContent = err; $('token').focus(); }
  function logout(err = '') { tok.set(''); showLogin(err); }
  async function load() {
    const [j, s] = await Promise.all([api({ action: 'sellers' }).catch(() => null), api({ action: 'sales' }).catch(() => null)]);
    if (!j) return;
    if (!j.ok) { $('app').hidden = false; $('kpis').innerHTML = `<div class="kpi"><span>Error</span><b>${esc(j.error || '—')}</b></div>`; return; }
    data = j; orders = (s?.sales || []).filter((o) => o.status === 'paid' && o.promoCode);
    $('login').hidden = true; $('app').hidden = false;
    $('upd').textContent = `Actualizado ${new Date().toLocaleString('es-MX')} · solo cuentan órdenes pagadas`;
    render();
  }
  const scope = () => data.sellers.filter((r) => !$('grp').value || r.tier === $('grp').value);
  function render() {
    const q = $('q').value.trim().toLowerCase(), only = $('only').value;
    const base = scope();
    const list = base.filter((r) => (!q || [r.name, r.code, r.phone, r.email].join(' ').toLowerCase().includes(q)) && (only !== 'sold' || r.tickets > 0) && (only !== 'pending' || r.pendingMxn > 0))
      .sort((a, b) => { const x = a[sortK] ?? -1, y = b[sortK] ?? -1; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir; });
    const sum = (k) => base.reduce((n, r) => n + (Number(r[k]) || 0), 0);
    $('kpis').innerHTML = [['Vendedores', base.length], ['Con ventas', base.filter((r) => r.tickets > 0).length], ['Boletos', sum('tickets')], ['Ventas MXN', mxn(sum('revenueMxn'))], ['Comisiones', mxn(sum('earnedMxn'))], ['Por pagar', mxn(sum('pendingMxn'))]]
      .map(([k, v]) => `<div class="kpi"><span>${k}</span><b>${v}</b></div>`).join('');
    $('rows').innerHTML = list.map((r) => {
      const wa = r.phone ? `<a class="copy" href="https://wa.me/${esc(r.phone.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : '';
      return `<tr class="${r.active ? '' : 'off'}">
      <td><b>${esc(r.name)}</b>${r.source === 'self-serve' ? '<span class="src">/vende</span>' : ''}<br><small style="color:var(--faint)">${esc(r.email || r.organization || '')}</small></td>
      <td class="code">${esc(r.code)}</td><td>${wa}</td>
      <td class="num"><b>${r.tickets}</b></td><td class="num">${mxn(r.revenueMxn)}</td>
      <td class="num"><input class="field pct" type="number" min="0" max="50" step="0.5" value="${r.commissionPct ?? ''}" placeholder="—" data-pct="${esc(r.code)}"></td>
      <td class="num">${mxn(r.earnedMxn)}</td><td class="num">${mxn(r.paidMxn)}</td>
      <td class="num ${r.pendingMxn > 0 ? 'pend' : ''}">${mxn(r.pendingMxn)}</td>
      <td>${r.pendingMxn > 0 ? `<button class="btn mini" data-pay="${esc(r.code)}" data-amt="${r.pendingMxn}">Marcar pagado</button>` : ''}</td>
      <td><button class="copy" data-copy="${location.origin}/s/${esc(r.code)}">/s/${esc(r.code)} ⧉</button></td>
      <td><button class="sw" role="switch" aria-checked="${r.active}" data-code="${esc(r.code)}"></button></td></tr>`;
    }).join('') || '<tr><td colspan="12" style="color:var(--faint)">Aún no hay vendedores.</td></tr>';
    const codes = new Set(base.map((r) => r.code)); const nameOf = new Map(data.sellers.map((r) => [r.code, r.name]));
    $('orders').innerHTML = orders.filter((o) => codes.has(o.promoCode)).map((o) => `<tr><td>${new Date(o.paidAt || o.createdAt).toLocaleString('es-MX')}</td><td class="code">${esc(o.promoCode)}</td><td>${esc(nameOf.get(o.promoCode) || '')}</td><td>${esc(o.buyerName || '')}</td><td>${esc(o.passName || '')}</td><td class="num">${o.quantity}</td><td class="num">${mxn(o.amountMxn)}</td></tr>`).join('') || '<tr><td colspan="7" style="color:var(--faint)">Sin órdenes pagadas con código todavía.</td></tr>';
    $('payouts').innerHTML = data.payouts.filter((p) => codes.has(p.code)).map((p) => `<tr><td>${new Date(p.createdAt).toLocaleString('es-MX')}</td><td class="code">${esc(p.code)}</td><td class="num">${mxn(p.amountMxn)}</td><td>${esc(p.note || '')}</td></tr>`).join('') || '<tr><td colspan="4" style="color:var(--faint)">Sin pagos registrados.</td></tr>';
  }
  $('rows').addEventListener('click', async (e) => {
    const c = e.target.closest('[data-copy]');
    if (c) { navigator.clipboard?.writeText(c.dataset.copy).catch(() => {}); c.textContent = 'Copiada ✓'; setTimeout(render, 1200); return; }
    const p = e.target.closest('[data-pay]');
    if (p) {
      const amt = prompt(`¿Cuánto le pagaste a ${p.dataset.pay}? (MXN)`, p.dataset.amt); if (!amt) return;
      const note = prompt('Nota (ej. transferencia, referencia):', '') || '';
      const j = await api({ action: 'seller-payout', code: p.dataset.pay, amountMxn: Number(amt), note }).catch(() => null);
      if (!j?.ok) alert(ERR[j?.error] || j?.error || 'Error'); return load();
    }
    const s = e.target.closest('.sw'); if (!s) return;
    const active = s.getAttribute('aria-checked') !== 'true';
    if (!active && !confirm(`¿Apagar ${s.dataset.code}? Dejará de funcionar en el checkout.`)) return;
    const j = await api({ action: 'promo-toggle', code: s.dataset.code, active }).catch(() => null);
    if (j?.ok) { const r = data.sellers.find((x) => x.code === j.code); if (r) r.active = j.active; }
    render();
  });
  $('rows').addEventListener('change', async (e) => {
    const i = e.target.closest('[data-pct]'); if (!i) return;
    const j = await api({ action: 'seller-commission', code: i.dataset.pct, pct: i.value === '' ? null : Number(i.value) }).catch(() => null);
    if (!j?.ok) alert(ERR[j?.error] || 'Error'); load();
  });
  $('bulkBtn').addEventListener('click', async () => {
    const v = $('bulkPct').value; if (v === '') return;
    if (!confirm(`¿Poner ${v}% de comisión a todos los vendedores de la comunidad?`)) return;
    const j = await api({ action: 'seller-commission', tier: 'Comunidad', pct: Number(v) }).catch(() => null);
    $('bulkMsg').className = 'msg' + (j?.ok ? '' : ' bad'); $('bulkMsg').textContent = j?.ok ? `Listo: ${j.updated} vendedores con ${j.pct}%.` : (ERR[j?.error] || 'Error');
    load();
  });
  $('newForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    const j = await api({ action: 'seller-create', name: f.name.value, code: f.code.value, phone: f.phone.value, commissionPct: f.commissionPct.value }).catch(() => null);
    $('newMsg').className = 'msg' + (j?.ok ? '' : ' bad');
    $('newMsg').textContent = j?.ok ? `Listo: ${j.url}` : (ERR[j?.error] || j?.error || 'Error');
    if (j?.ok) { navigator.clipboard?.writeText(j.url).catch(() => {}); f.reset(); load(); }
  });
  document.querySelectorAll('th[data-k]').forEach((th) => th.addEventListener('click', () => { const k = th.dataset.k; sortDir = sortK === k ? -sortDir : (['name', 'code'].includes(k) ? 1 : -1); sortK = k; render(); }));
  ['q', 'grp', 'only'].forEach((id) => $(id).addEventListener('input', render));
  $('refresh').addEventListener('click', load);
  $('logout').addEventListener('click', () => logout());
  $('loginForm').addEventListener('submit', (e) => { e.preventDefault(); tok.set($('token').value.trim()); load(); });
  $('csv').addEventListener('click', () => {
    const cols = [['Vendedor', 'name'], ['Código', 'code'], ['Origen', 'source'], ['Email', 'email'], ['WhatsApp', 'phone'], ['Boletos', 'tickets'], ['Órdenes', 'orders'], ['Ventas MXN', 'revenueMxn'], ['Comisión %', 'commissionPct'], ['Comisión MXN', 'earnedMxn'], ['Pagado MXN', 'paidMxn'], ['Por pagar MXN', 'pendingMxn'], ['Activo', (r) => r.active ? 'Sí' : 'No'], ['Liga', (r) => `${location.origin}/s/${r.code}`]];
    const cell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [cols.map((c) => c[0]).join(','), ...scope().map((r) => cols.map(([, k]) => cell(typeof k === 'function' ? k(r) : r[k])).join(','))];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `vendedores-tif-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  });
  tok.get() ? load() : showLogin();
})();
