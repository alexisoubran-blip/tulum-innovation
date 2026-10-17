// TIF checkout: pass + details → order (server-priced) → Blokko QR → polling → tickets.
(() => {
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);

  const PASS_META = {
    'general-access': { art: '/assets/tickets/general-access-sm.webp', c1: '#FF6A2B', c2: '#6B4BFF' },
    'executive-pass': { art: '/assets/tickets/executive-pass-sm.webp', c1: '#FFC424', c2: '#3C4BFF' },
    'community-access': { art: '/assets/tickets/community-access-sm.webp', c1: '#4BFF5A', c2: '#5B3BFF',
      note: { en: 'Community Access is for Tulum residents: a valid local ID or proof of residency is required at entry; otherwise the difference to General Access applies.', es: 'Community Access es para residentes de Tulum: se requiere identificación local o comprobante de residencia en el acceso; de lo contrario aplica la diferencia con General Access.' } },
    'hotel-upgrade': { c1: '#25B8FF', c2: '#FF3374',
      note: { en: 'Hotel Upgrade is an add-on to a festival pass: 4 nights at a partner hotel, subject to availability.', es: 'Hotel Upgrade es un complemento de tu pase al festival: 4 noches en un hotel aliado, sujeto a disponibilidad.' } },
    'hotel-second-guest': { c1: '#FF3374', c2: '#25B8FF',
      note: { en: 'Second guest sharing a Hotel Upgrade room.', es: 'Segundo huésped que comparte habitación de Hotel Upgrade.' } },
  };

  const T = {
    en: {
      errors: {
        invalid_name: 'Please enter your full name.', invalid_email: 'Please enter a valid email.', invalid_quantity: 'Choose between 1 and 10 tickets.',
        terms_required: 'Please accept the purchase terms.', pass_unavailable: 'That pass is not available right now.', rate_not_set: 'Payments are not available right now. Please try again later.',
        order_expired: 'This order expired. Start again.', method_not_allowed: 'That payment method is not available.', too_many_attempts: 'Too many attempts for this order. Start again.',
        payment_provider_error: 'The payment provider did not respond. Try another method or try again.', order_not_found: 'We could not find this order. Start again.',
        store_not_configured: 'Payments are not available right now.', network: 'Connection problem. Check your internet and try again.', default: 'Something went wrong. Please try again.',
        choose_pass: 'Choose a pass.', no_methods: 'Crypto payments are not available right now. You can buy with card on Ticket Fairy.',
      },
      rate: (r) => `Charged in MXN at ${r} MXN per USD. Prices include fees.`,
      expires: (mmss) => `QR valid for <strong>${mmss}</strong>`,
      expired: 'This QR expired. Generate a new one to keep paying.',
      via: (m) => `Pay with ${m}`,
      copied: 'Payment code copied', done: (email) => `We sent your tickets to ${email}. You can also open them now.`,
    },
    es: {
      errors: {
        invalid_name: 'Escribe tu nombre completo.', invalid_email: 'Escribe un correo válido.', invalid_quantity: 'Elige entre 1 y 10 boletos.',
        terms_required: 'Acepta los términos de compra.', pass_unavailable: 'Ese pase no está disponible por ahora.', rate_not_set: 'Los pagos no están disponibles por ahora. Intenta más tarde.',
        order_expired: 'Esta orden venció. Empieza de nuevo.', method_not_allowed: 'Ese método de pago no está disponible.', too_many_attempts: 'Demasiados intentos para esta orden. Empieza de nuevo.',
        payment_provider_error: 'El proveedor de pagos no respondió. Prueba otro método o intenta de nuevo.', order_not_found: 'No encontramos esta orden. Empieza de nuevo.',
        store_not_configured: 'Los pagos no están disponibles por ahora.', network: 'Problema de conexión. Revisa tu internet e intenta de nuevo.', default: 'Algo salió mal. Intenta de nuevo.',
        choose_pass: 'Elige un pase.', no_methods: 'Los pagos con cripto no están disponibles por ahora. Puedes comprar con tarjeta en Ticket Fairy.',
      },
      rate: (r) => `Cargo en MXN a ${r} MXN por USD. Precios con cargos incluidos.`,
      expires: (mmss) => `QR válido por <strong>${mmss}</strong>`,
      expired: 'Este QR venció. Genera uno nuevo para seguir pagando.',
      via: (m) => `Paga con ${m}`,
      copied: 'Código copiado', done: (email) => `Enviamos tus boletos a ${email}. También puedes abrirlos ahora.`,
    },
  };

  const state = { lang: 'es', options: null, passId: null, qty: 1, token: params.get('t'), order: null, qr: null, methodId: null, poll: null, tick: null };
  const t = () => T[state.lang];
  const usd = (n) => `US$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const mxn = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const push = (event, data = {}) => { try { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); } catch {} };

  // ---------------------------------------------------------------- language
  function setLang(lang, save) {
    state.lang = lang === 'en' ? 'en' : 'es';
    root.lang = state.lang;
    root.dataset.lang = state.lang;
    if (save) { try { localStorage.setItem('tif-language', state.lang); } catch {} }
    renderSummary();
    if (state.passId) renderPassNote();
    if (state.qr) renderQrInfo();
  }
  (() => {
    let lang = params.get('lang');
    if (!lang) { try { lang = localStorage.getItem('tif-language'); } catch {} }
    if (!lang) lang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
    setLang(lang, false);
  })();
  $('langToggle').addEventListener('click', () => setLang(state.lang === 'es' ? 'en' : 'es', true));

  // ---------------------------------------------------------------- attribution (first touch in this session)
  const attribution = (() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ref'];
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('tif-attribution') || '{}'); } catch {}
    const current = Object.fromEntries(keys.map((k) => [k, params.get(k)]).filter(([, v]) => v));
    const merged = Object.keys(current).length ? current : saved;
    try { sessionStorage.setItem('tif-attribution', JSON.stringify(merged)); } catch {}
    return merged;
  })();

  // ---------------------------------------------------------------- ui helpers
  function showError(code) {
    const el = $('alert');
    el.textContent = t().errors[code] || t().errors.default;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const clearError = () => { $('alert').hidden = true; };

  function setStep(n) {
    document.querySelectorAll('#progress li').forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle('is-active', s === n);
      li.classList.toggle('is-done', s < n);
    });
    document.body.classList.toggle('co-paying', n >= 3); // on phones the QR goes first, the summary after
    $('orderForm').hidden = n > 2;
    $('payPanel').hidden = n !== 3;
    $('donePanel').hidden = n !== 4;
    $('expiredPanel').hidden = true;
  }

  async function api(path, options = {}) {
    let res;
    try {
      res = await fetch(path, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) }, cache: 'no-store' });
    } catch {
      return { ok: false, error: 'network' };
    }
    try { return await res.json(); } catch { return { ok: false, error: 'default' }; }
  }

  // ---------------------------------------------------------------- passes and summary
  function selectedPass() { return state.options?.passes.find((p) => p.id === state.passId) || null; }

  function renderPasses() {
    const box = $('passes');
    box.textContent = '';
    state.options.passes.forEach((p) => {
      const meta = PASS_META[p.id] || { c1: '#E97A43', c2: '#6B4BFF' };
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'co-pass';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(p.id === state.passId));
      btn.style.setProperty('--pass', meta.c1);
      btn.style.setProperty('--pass-2', meta.c2);
      const art = document.createElement('div');
      art.className = 'co-pass-art';
      if (meta.art) { const img = document.createElement('img'); img.src = meta.art; img.alt = ''; img.loading = 'lazy'; art.appendChild(img); }
      const body = document.createElement('div');
      const name = document.createElement('p'); name.className = 'co-pass-name'; name.textContent = p.name;
      const price = document.createElement('p'); price.className = 'co-pass-price';
      const strong = document.createElement('strong'); strong.textContent = usd(p.priceUsd);
      const sub = document.createElement('span'); sub.textContent = p.priceMxn ? mxn(p.priceMxn) : '';
      price.append(strong, sub);
      body.append(name, price);
      const check = document.createElement('span'); check.className = 'co-pass-check'; check.setAttribute('aria-hidden', 'true');
      btn.append(art, body, check);
      btn.addEventListener('click', () => { state.passId = p.id; renderPasses(); renderPassNote(); renderSummary(); clearError(); });
      box.appendChild(btn);
    });
  }

  function renderPassNote() {
    const note = PASS_META[state.passId]?.note;
    $('passNote').hidden = !note;
    if (note) $('passNote').textContent = note[state.lang];
  }

  function renderSummary() {
    const order = state.order;
    const pass = selectedPass();
    const id = order?.passId || pass?.id;
    const meta = PASS_META[id] || { c1: '#E97A43', c2: '#6B4BFF' };
    const card = $('summary');
    card.style.setProperty('--pass', meta.c1);
    card.style.setProperty('--pass-2', meta.c2);
    const art = $('sumArt');
    art.textContent = '';
    if (meta.art) { const img = document.createElement('img'); img.src = meta.art.replace('-sm.webp', '.webp'); img.alt = ''; art.appendChild(img); }
    const qty = order?.quantity || state.qty;
    const rate = order?.rate || state.options?.rate;
    $('sumPass').textContent = order?.passName || pass?.name || '—';
    $('sumQty').textContent = String(qty);
    const totalUsd = order ? order.amountUsd : pass ? pass.priceUsd * qty : null;
    $('sumUsd').textContent = totalUsd != null ? usd(totalUsd) : '—';
    const totalMxn = order ? order.amountMxn : pass && rate ? Math.ceil(Math.round(pass.priceUsd * qty * 100) * rate / 100) : null;
    $('sumMxn').textContent = totalMxn != null ? mxn(totalMxn) : '—';
    $('sumRate').textContent = rate ? t().rate(Number(rate).toFixed(2)) : '';
  }

  function setQty(n) {
    state.qty = Math.min(10, Math.max(1, Number.isFinite(n) ? Math.round(n) : 1));
    $('qty').value = String(state.qty);
    renderSummary();
  }
  $('qtyDown').addEventListener('click', () => setQty(state.qty - 1));
  $('qtyUp').addEventListener('click', () => setQty(state.qty + 1));
  $('qty').addEventListener('change', (e) => setQty(Number(e.target.value)));

  // ---------------------------------------------------------------- order
  $('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const fields = { name: $('name'), email: $('email') };
    Object.values(fields).forEach((f) => f.removeAttribute('aria-invalid'));
    if (!state.passId) return showError('choose_pass');
    if ($('name').value.trim().length < 2) { fields.name.setAttribute('aria-invalid', 'true'); fields.name.focus(); return showError('invalid_name'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('email').value.trim())) { fields.email.setAttribute('aria-invalid', 'true'); fields.email.focus(); return showError('invalid_email'); }
    if (!$('terms').checked) return showError('terms_required');

    const btn = $('toPayment');
    btn.disabled = true;
    const res = await api('/api/checkout/order', {
      method: 'POST',
      body: JSON.stringify({
        passId: state.passId, quantity: state.qty, name: $('name').value, email: $('email').value, phone: $('phone').value, country: $('country').value,
        website: $('website').value, acceptTerms: $('terms').checked, locale: state.lang, attribution,
      }),
    });
    btn.disabled = false;
    if (!res.ok) return showError(res.error);
    state.token = res.token;
    state.order = res.order;
    history.replaceState(null, '', `/checkout?t=${encodeURIComponent(res.token)}`);
    push('begin_checkout', { currency: 'USD', value: res.order.amountUsd, items: [{ item_id: res.order.passId, item_name: res.order.passName, quantity: res.order.quantity }] });
    showPayment();
  });

  // ---------------------------------------------------------------- payment
  function showPayment() {
    setStep(3);
    renderSummary();
    renderMethods();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startPolling();
  }

  function renderMethods() {
    const box = $('methods');
    box.textContent = '';
    const methods = state.options?.methods || [];
    if (!methods.length) { showError('no_methods'); return; }
    methods.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'co-method';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-pressed', String(m.id === state.methodId));
      if (m.logoUrl) { const img = document.createElement('img'); img.src = m.logoUrl; img.alt = ''; img.loading = 'lazy'; btn.appendChild(img); }
      const label = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent = m.name;
      const cat = document.createElement('span'); cat.textContent = { stablecoins: 'USDC · USDT', exchanges: 'Exchange', rtps: state.lang === 'es' ? 'Transferencia' : 'Bank transfer' }[m.category] || '';
      label.append(strong, cat);
      btn.appendChild(label);
      btn.addEventListener('click', () => requestQr(m.id));
      box.appendChild(btn);
    });
  }

  async function requestQr(methodId) {
    clearError();
    state.methodId = methodId;
    document.querySelectorAll('.co-method').forEach((b, i) => { b.disabled = true; b.setAttribute('aria-pressed', String(state.options.methods[i]?.id === methodId)); });
    const res = await api('/api/checkout/pay', { method: 'POST', body: JSON.stringify({ token: state.token, methodId }) });
    document.querySelectorAll('.co-method').forEach((b) => { b.disabled = false; });
    if (!res.ok) {
      if (res.error === 'order_expired' || res.error === 'order_not_found') return showExpired();
      return showError(res.error);
    }
    if (res.status === 'paid') return checkStatus();
    state.qr = res;
    push('add_payment_info', { currency: 'USD', value: state.order?.amountUsd, payment_type: methodId });
    showQr();
  }

  function showQr() {
    $('methods').hidden = true;
    $('qrBox').hidden = false;
    $('qrImg').src = state.qr.qrUrl || '';
    $('qrBox').querySelector('.co-qr-art').classList.remove('is-expired');
    $('qrExpired').hidden = true;
    $('newQr').hidden = true;
    renderQrInfo();
    clearInterval(state.tick);
    state.tick = setInterval(renderQrInfo, 1000);
    $('qrBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderQrInfo() {
    if (!state.qr) return;
    const method = state.options?.methods.find((m) => m.id === state.qr.methodId);
    $('qrAmount').textContent = mxn(state.qr.amountMxn);
    $('qrMethod').textContent = t().via(method?.name || state.qr.methodId);
    const left = Math.max(0, Date.parse(state.qr.expiresAt) - Date.now());
    if (left > 0) {
      const s = Math.ceil(left / 1000);
      $('qrTimer').innerHTML = t().expires(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    } else {
      $('qrTimer').textContent = t().expired;
      $('qrBox').querySelector('.co-qr-art').classList.add('is-expired');
      $('qrExpired').hidden = false;
      $('newQr').hidden = false;
      clearInterval(state.tick);
    }
  }

  $('newQr').addEventListener('click', () => requestQr(state.methodId));
  $('changeMethod').addEventListener('click', () => { clearInterval(state.tick); state.qr = null; $('qrBox').hidden = true; $('methods').hidden = false; renderMethods(); });
  $('copyCode').addEventListener('click', async () => {
    if (!state.qr?.qrContent) return;
    try { await navigator.clipboard.writeText(state.qr.qrContent); const b = $('copyCode'); const old = b.innerHTML; b.textContent = t().copied; setTimeout(() => { b.innerHTML = old; }, 1800); } catch {}
  });
  $('editOrder').addEventListener('click', () => {
    stopPolling(); clearInterval(state.tick);
    state.qr = null; state.order = null; state.token = null;
    history.replaceState(null, '', '/checkout');
    $('qrBox').hidden = true; $('methods').hidden = false;
    setStep(1); renderSummary();
  });

  // ---------------------------------------------------------------- status polling
  function startPolling() { stopPolling(); state.poll = setInterval(checkStatus, 4000); }
  function stopPolling() { clearInterval(state.poll); state.poll = null; }

  async function checkStatus() {
    if (!state.token) return;
    const res = await api(`/api/checkout/status?t=${encodeURIComponent(state.token)}`);
    if (!res.ok) { if (res.error === 'order_not_found') { stopPolling(); showExpired(); } return; }
    state.order = { ...(state.order || {}), ...res };
    if (res.status === 'paid') return showDone(res);
    if (res.status === 'expired') { stopPolling(); return showExpired(); }
  }

  function showDone(order) {
    stopPolling(); clearInterval(state.tick);
    setStep(4);
    renderSummary();
    $('doneText').textContent = t().done(order.buyerEmail || '');
    $('ticketsLink').href = `/boleto?t=${encodeURIComponent(state.token)}`;
    if (!state.purchased) {
      state.purchased = true;
      push('purchase', { currency: 'USD', value: order.amountUsd, items: [{ item_id: order.passId, item_name: order.passName, quantity: order.quantity }] });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showExpired() {
    stopPolling(); clearInterval(state.tick);
    $('orderForm').hidden = true; $('payPanel').hidden = true; $('donePanel').hidden = true;
    $('expiredPanel').hidden = false;
    history.replaceState(null, '', '/checkout');
  }

  // ---------------------------------------------------------------- boot
  (async () => {
    const options = await api('/api/checkout/options');
    if (!options.ok) { $('passes').textContent = ''; return showError(options.error); }
    state.options = options;
    const wanted = params.get('pass');
    state.passId = options.passes.some((p) => p.id === wanted) ? wanted : (options.passes[0]?.id || null);
    renderPasses(); renderPassNote(); setQty(Number(params.get('qty')) || 1);

    if (state.token) {
      const res = await api(`/api/checkout/status?t=${encodeURIComponent(state.token)}`);
      if (!res.ok) return showExpired();
      state.order = res;
      if (res.status === 'paid') return showDone(res);
      if (res.status !== 'pending') return showExpired();
      showPayment();
      if (res.attempt && res.attempt.status === 'pending' && Date.parse(res.attempt.expiresAt) > Date.now()) {
        state.methodId = res.attempt.methodId;
        state.qr = { methodId: res.attempt.methodId, qrUrl: res.attempt.qrUrl, qrContent: res.attempt.qrContent, expiresAt: res.attempt.expiresAt, amountMxn: res.amountMxn };
        showQr();
      }
    } else {
      setStep(1);
    }
  })();
})();
