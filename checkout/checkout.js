// TIF checkout: product (with full detail) + buyer → order (server-priced) → method (card, SPEI,
// pesos apps, crypto) → QR or transfer → polling → tickets / confirmation.
(() => {
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const FALLBACK_COLORS = ['#E97A43', '#6B4BFF'];

  const T = {
    en: {
      errors: {
        invalid_name: 'Please enter your full name.', invalid_email: 'Please enter a valid email.', invalid_quantity: 'That quantity is not available for this product.',
        terms_required: 'Please accept the purchase terms.', pass_unavailable: 'That product is not available right now.', rate_not_set: 'Payments are not available right now. Please try again later.',
        order_expired: 'This order expired. Start again.', method_not_allowed: 'That payment method is not available.', method_unavailable: 'That payment method is coming soon. Please choose another one.',
        too_many_attempts: 'Too many attempts for this order. Start again.', payment_provider_error: 'That method did not respond. Choose another method or try again.',
        order_not_found: 'We could not find this order. Start again.', store_not_configured: 'Payments are not available right now.',
        network: 'Connection problem. Check your internet and try again.', default: 'Something went wrong. Please try again.', choose_pass: 'Choose a product.',
        price_pending: 'The price of this product is about to be confirmed. It will be available soon.',
        invalid_business_name: 'Please enter the business name.', invalid_business_address: 'Please enter the business location.', invalid_phone: 'Please enter a phone number (10 digits).',
        card_invalid: 'Check the card number.', card_invalid_expiry: 'Check the expiry date (MM/YY).', card_invalid_cvv: 'Check the CVV (3 digits on the back).', card_invalid_holder: 'Enter the name as it appears on the card.',
        card_brand_not_supported: 'Only Visa and Mastercard are accepted.', invalid_billing: 'Complete the billing address (street, city and state).', invalid_postal_code: 'Enter a 5-digit postal code.',
        card_declined: 'Your bank declined the payment. Try another card or another method.', card_insufficient_funds: 'Insufficient funds. Try another card or another method.',
        card_expired: 'This card is expired. Use a valid card.', card_try_again: 'The processor had a temporary error; nothing was charged. Try again in a moment.',
        card_unconfirmed: 'Your bank did not answer in time. Do not pay again: we will confirm it and email you.', card_check_pending: 'We are confirming a card payment for this order. Do not pay again; we will email you.',
        too_many_card_attempts: 'Too many card attempts for this order. Choose another method.', card_temporarily_unavailable: 'Card payments are paused for a moment. Try another method or come back later.',
      },
      rate: (r) => `Charged in MXN at ${r} MXN per USD.`,
      expires: (mmss) => `QR valid for <strong>${mmss}</strong>`,
      expired: 'This QR expired. Generate a new one to keep paying.',
      via: (m) => `Pay with ${m}`, copied: 'Copied', soon: 'Coming soon', plusVat: '+ VAT 16%', perUnit: 'per unit',
      pending: 'Price to be confirmed', soonBuy: 'Available soon', payCard: (a) => `Pay ${a}`, approx: (u) => `≈ ${u}`, fixedMxn: 'Price in Mexican pesos.',
      doneTickets: 'You’re in!', doneConfirm: 'Payment confirmed', viewTickets: 'View my tickets', viewPurchase: 'View my purchase',
      doneTicketsText: (e) => `We sent your tickets to ${e}. You can also open them now.`,
      doneConfirmText: (e) => `We sent the confirmation to ${e}. Our team will contact you within 48 hours to coordinate everything.`,
      bank: { beneficiary: 'Beneficiary', bank: 'Bank', clabe: 'CLABE', amount: 'Exact amount', reference: 'Reference (payment concept)' },
      deadline: (d) => `Transfer before ${d}; after that the order expires.`,
      noMethods: 'No payment method is available right now.',
    },
    es: {
      errors: {
        invalid_name: 'Escribe tu nombre completo.', invalid_email: 'Escribe un correo válido.', invalid_quantity: 'Esa cantidad no está disponible para este producto.',
        terms_required: 'Acepta los términos de compra.', pass_unavailable: 'Ese producto no está disponible por ahora.', rate_not_set: 'Los pagos no están disponibles por ahora. Intenta más tarde.',
        order_expired: 'Esta orden venció. Empieza de nuevo.', method_not_allowed: 'Ese método de pago no está disponible.', method_unavailable: 'Ese método llega muy pronto. Elige otro, por favor.',
        too_many_attempts: 'Demasiados intentos para esta orden. Empieza de nuevo.', payment_provider_error: 'Ese método no respondió. Elige otro método o intenta de nuevo.',
        order_not_found: 'No encontramos esta orden. Empieza de nuevo.', store_not_configured: 'Los pagos no están disponibles por ahora.',
        network: 'Problema de conexión. Revisa tu internet e intenta de nuevo.', default: 'Algo salió mal. Intenta de nuevo.', choose_pass: 'Elige un producto.',
        price_pending: 'El precio de este producto está por confirmarse. Muy pronto estará disponible.',
        invalid_business_name: 'Escribe el nombre comercial.', invalid_business_address: 'Escribe la ubicación del comercio.', invalid_phone: 'Escribe un teléfono (10 dígitos).',
        card_invalid: 'Revisa el número de la tarjeta.', card_invalid_expiry: 'Revisa el vencimiento (MM/AA).', card_invalid_cvv: 'Revisa el CVV (3 dígitos al reverso).', card_invalid_holder: 'Escribe el nombre como aparece en la tarjeta.',
        card_brand_not_supported: 'Solo se aceptan Visa y Mastercard.', invalid_billing: 'Completa el domicilio de la tarjeta (calle, ciudad y estado).', invalid_postal_code: 'Escribe un código postal de 5 dígitos.',
        card_declined: 'Tu banco rechazó el pago. Prueba con otra tarjeta u otro método.', card_insufficient_funds: 'Fondos insuficientes. Prueba con otra tarjeta u otro método.',
        card_expired: 'La tarjeta está vencida. Usa una tarjeta vigente.', card_try_again: 'El procesador tuvo un error temporal; no se hizo ningún cargo. Intenta de nuevo en un momento.',
        card_unconfirmed: 'Tu banco no respondió a tiempo. No vuelvas a pagar: lo confirmamos y te escribimos.', card_check_pending: 'Estamos confirmando un pago con tarjeta de esta orden. No vuelvas a pagar; te escribimos.',
        too_many_card_attempts: 'Demasiados intentos con tarjeta para esta orden. Elige otro método.', card_temporarily_unavailable: 'Los pagos con tarjeta están en pausa un momento. Usa otro método o vuelve más tarde.',
      },
      rate: (r) => `Cargo en MXN a ${r} MXN por USD.`,
      expires: (mmss) => `QR válido por <strong>${mmss}</strong>`,
      expired: 'Este QR venció. Genera uno nuevo para seguir pagando.',
      via: (m) => `Paga con ${m}`, copied: 'Copiado', soon: 'Muy pronto', plusVat: '+ IVA 16%', perUnit: 'por unidad',
      pending: 'Precio por confirmar', soonBuy: 'Disponible muy pronto', payCard: (a) => `Pagar ${a}`, approx: (u) => `≈ ${u}`, fixedMxn: 'Precio en pesos mexicanos.',
      doneTickets: '¡Listo, ya tienes tus boletos!', doneConfirm: 'Pago confirmado', viewTickets: 'Ver mis boletos', viewPurchase: 'Ver mi compra',
      doneTicketsText: (e) => `Enviamos tus boletos a ${e}. También puedes abrirlos ahora.`,
      doneConfirmText: (e) => `Enviamos la confirmación a ${e}. Nuestro equipo te contactará en las próximas 48 horas para coordinar todo.`,
      bank: { beneficiary: 'Beneficiario', bank: 'Banco', clabe: 'CLABE', amount: 'Monto exacto', reference: 'Referencia (concepto de pago)' },
      deadline: (d) => `Transfiere antes del ${d}; después la orden vence.`,
      noMethods: 'No hay métodos de pago disponibles por ahora.',
    },
  };

  const state = { lang: 'es', options: null, category: null, passId: null, qty: 1, token: params.get('t'), order: null, qr: null, transfer: null, methodId: null, poll: null, tick: null, detailId: null };
  const t = () => T[state.lang];
  const L = (obj) => (obj && typeof obj === 'object' ? (obj[state.lang] ?? obj.es ?? obj.en ?? '') : (obj ?? ''));
  const usd = (n) => `US$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const mxn = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const push = (event, data = {}) => { try { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); } catch {} };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  // ---------------------------------------------------------------- language
  function setLang(lang, save) {
    state.lang = lang === 'en' ? 'en' : 'es';
    root.lang = state.lang;
    root.dataset.lang = state.lang;
    if (save) { try { localStorage.setItem('tif-language', state.lang); } catch {} }
    if (state.options) { renderCats(); renderPasses(); renderMethods(); }
    renderSummary();
    if (state.detailId) renderDetail(state.detailId);
    if (state.qr) renderQrInfo();
    if (state.transfer) renderTransfer();
    renderCardButton();
    if (state.order?.status === 'paid') renderDone(state.order);
  }
  (() => {
    let lang = params.get('lang');
    if (!lang) { try { lang = localStorage.getItem('tif-language'); } catch {} }
    if (!lang) lang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
    // Only the attributes here: the render functions are defined further down.
    state.lang = lang === 'en' ? 'en' : 'es';
    root.lang = state.lang;
    root.dataset.lang = state.lang;
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
    const box = $('alert');
    box.textContent = t().errors[code] || t().errors.default;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const clearError = () => { $('alert').hidden = true; };

  function setStep(n) {
    document.body.classList.toggle('co-paying', n >= 3); // on phones the payment goes first, the summary after
    document.querySelectorAll('#progress li').forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle('is-active', s === n);
      li.classList.toggle('is-done', s < n);
    });
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

  async function copy(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      const old = btn.innerHTML; btn.textContent = t().copied; setTimeout(() => { btn.innerHTML = old; }, 1600);
    } catch {}
  }

  // ---------------------------------------------------------------- catalog
  const product = (id) => state.options?.passes.find((p) => p.id === id) || null;
  const colorsOf = (p) => p?.content?.colors || FALLBACK_COLORS;

  function renderCats() {
    const box = $('cats');
    box.textContent = '';
    const order = ['festival', 'business', 'hotel', 'whale-tank', 'sponsorship', 'residency', 'other', 'test'];
    const present = order.filter((c) => state.options.passes.some((p) => p.category === c));
    box.hidden = present.length < 2;
    present.forEach((c) => {
      const b = el('button', 'co-cat', L(state.options.categories?.[c]) || c);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(c === state.category));
      b.addEventListener('click', () => { state.category = c; renderCats(); renderPasses(); });
      box.appendChild(b);
    });
  }

  function renderPasses() {
    const box = $('passes');
    box.textContent = '';
    state.options.passes.filter((p) => p.category === state.category).forEach((p) => {
      const [c1, c2] = colorsOf(p);
      const btn = el('button', 'co-pass');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(p.id === state.passId));
      btn.style.setProperty('--pass', c1);
      btn.style.setProperty('--pass-2', c2);
      const art = el('div', 'co-pass-art');
      if (p.content?.art) { const img = el('img'); img.src = p.content.art; img.alt = ''; img.loading = 'lazy'; art.appendChild(img); }
      const body = el('div');
      body.append(el('p', 'co-pass-name', p.name));
      if (p.content?.tagline) body.append(el('p', 'co-pass-tag', L(p.content.tagline)));
      const price = el('p', 'co-pass-price');
      if (p.pricePending) price.append(el('em', 'co-pending', t().pending));
      else if (p.pricedIn === 'MXN') price.append(el('strong', null, mxn(p.priceMxn)));
      else {
        price.append(el('strong', null, usd(p.priceUsd)));
        if (p.taxRate > 0) price.append(el('em', null, ` ${t().plusVat}`));
        price.append(el('span', null, p.priceMxn ? mxn(p.priceMxn) : ''));
      }
      body.append(price);
      body.append(el('span', 'co-pass-more', state.lang === 'es' ? 'Ver detalles' : 'View details'));
      btn.append(art, body, Object.assign(el('span', 'co-pass-check'), { ariaHidden: 'true' }));
      btn.addEventListener('click', () => openDetail(p.id));
      box.appendChild(btn);
    });
  }

  // ---------------------------------------------------------------- product detail
  function fillList(ul, wrap, items) {
    ul.textContent = '';
    (items || []).forEach((i) => ul.appendChild(el('li', null, L(i))));
    wrap.hidden = !(items && items.length);
  }

  function renderDetail(id) {
    const p = product(id);
    if (!p) return;
    const [c1, c2] = colorsOf(p);
    const dlg = $('detail');
    dlg.style.setProperty('--pass', c1);
    dlg.style.setProperty('--pass-2', c2);
    const art = $('detailArt');
    art.textContent = '';
    if (p.content?.art) { const img = el('img'); img.src = p.content.art.replace('-sm.webp', '.webp'); img.alt = ''; art.appendChild(img); }
    $('detailCat').textContent = L(state.options.categories?.[p.category]) || '';
    $('detailName').textContent = p.name;
    $('detailTag').textContent = L(p.content?.tagline);
    $('detailPrice').textContent = p.pricePending ? t().pending
      : p.pricedIn === 'MXN' ? `${mxn(p.priceMxn)}${p.maxQuantity > 1 ? ` ${t().perUnit}` : ''}`
      : `${usd(p.priceUsd)}${p.taxRate > 0 ? ` ${t().plusVat} = ${usd(p.totalUsd)}` : ''}${p.priceMxn ? ` · ${mxn(p.priceMxn)}` : ''}${p.maxQuantity > 1 ? ` ${t().perUnit}` : ''}`;
    const buy = $('detailBuy');
    buy.disabled = Boolean(p.pricePending);
    buy.querySelector('[data-es]').textContent = p.pricePending ? 'Disponible muy pronto' : 'Comprar';
    buy.querySelector('[data-en]').textContent = p.pricePending ? 'Available soon' : 'Buy';
    $('detailDesc').textContent = L(p.content?.description);
    fillList($('detailInc'), $('detailIncWrap'), p.content?.includes);
    fillList($('detailExc'), $('detailExcWrap'), p.content?.excludes);
    fillList($('detailCond'), $('detailCondWrap'), p.content?.conditions);
  }

  function openDetail(id) {
    state.detailId = id;
    renderDetail(id);
    const dlg = $('detail');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    $('detailBuy').focus();
  }
  function closeDetail() { const dlg = $('detail'); if (dlg.open) dlg.close?.(); dlg.removeAttribute('open'); state.detailId = null; }
  $('detailClose').addEventListener('click', closeDetail);
  $('detail').addEventListener('click', (e) => { if (e.target === $('detail')) closeDetail(); });
  $('detail').addEventListener('close', () => { state.detailId = null; });
  $('detailBuy').addEventListener('click', () => {
    const id = state.detailId;
    closeDetail();
    selectProduct(id);
    $('name').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => $('name').focus({ preventScroll: true }), 400);
  });

  function selectProduct(id) {
    const p = product(id);
    if (!p || p.pricePending) return;
    state.passId = id;
    state.category = p.category;
    setQty(Math.min(state.qty, p.maxQuantity));
    renderCats(); renderPasses(); renderSummary(); renderBuyerFields(); clearError();
    push('select_item', { items: [{ item_id: p.id, item_name: p.name, price: p.totalUsd }] });
  }

  // Extra fields some products need (Business Pass: business name, location, required phone).
  const needs = (field) => (product(state.passId)?.content?.fields || []).includes(field);
  function renderBuyerFields() {
    const business = needs('businessName');
    document.querySelectorAll('.co-business').forEach((n) => { n.hidden = !business; });
    $('phoneLabel').innerHTML = needs('phone')
      ? '<span data-en>Phone</span><span data-es>Teléfono</span>'
      : '<span data-en>Phone (optional)</span><span data-es>Teléfono (opcional)</span>';
  }

  // ---------------------------------------------------------------- summary
  function renderSummary() {
    const order = state.order;
    const p = product(order?.passId || state.passId);
    const [c1, c2] = colorsOf(p);
    const card = $('summary');
    card.style.setProperty('--pass', c1);
    card.style.setProperty('--pass-2', c2);
    const art = $('sumArt');
    art.textContent = '';
    if (p?.content?.art) { const img = el('img'); img.src = p.content.art.replace('-sm.webp', '.webp'); img.alt = ''; art.appendChild(img); }
    const qty = order?.quantity || state.qty;
    const rate = order?.rate || state.options?.rate;
    $('sumPass').textContent = order?.passName || p?.name || '—';
    $('sumQty').textContent = String(qty);
    const inMxn = (order?.pricedIn || p?.pricedIn) === 'MXN';
    const priced = p && !p.pricePending;
    const subtotal = order ? order.subtotalUsd : priced ? p.priceUsd * qty : null;
    const tax = order ? order.taxUsd : priced ? Math.round(p.priceUsd * qty * p.taxRate * 100) / 100 : 0;
    $('sumUsdRow').hidden = inMxn;
    $('sumUsd').textContent = subtotal != null ? usd(subtotal) : '—';
    $('sumTaxRow').hidden = inMxn || !(tax > 0);
    $('sumTax').textContent = usd(tax || 0);
    const total = order ? order.amountMxn : priced && inMxn ? p.priceMxn * qty : priced && rate ? Math.ceil(Math.round((p.priceUsd * qty + tax) * 100) * rate / 100) : null;
    $('sumMxn').textContent = total != null ? mxn(total) : '—';
    $('sumRate').textContent = inMxn ? t().fixedMxn : rate ? t().rate(Number(rate).toFixed(2)) : '';
  }

  function setQty(n) {
    const max = product(state.passId)?.maxQuantity || 10;
    state.qty = Math.min(max, Math.max(1, Number.isFinite(n) ? Math.round(n) : 1));
    $('qty').value = String(state.qty);
    $('qty').max = String(max);
    document.querySelector('.co-qty').hidden = max <= 1;
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
    if (!state.passId) { $('passes').scrollIntoView({ behavior: 'smooth', block: 'center' }); return showError('choose_pass'); }
    if ($('name').value.trim().length < 2) { fields.name.setAttribute('aria-invalid', 'true'); fields.name.focus(); return showError('invalid_name'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('email').value.trim())) { fields.email.setAttribute('aria-invalid', 'true'); fields.email.focus(); return showError('invalid_email'); }
    if (needs('businessName') && $('businessName').value.trim().length < 2) { $('businessName').setAttribute('aria-invalid', 'true'); $('businessName').focus(); return showError('invalid_business_name'); }
    if (needs('businessAddress') && $('businessAddress').value.trim().length < 5) { $('businessAddress').setAttribute('aria-invalid', 'true'); $('businessAddress').focus(); return showError('invalid_business_address'); }
    if (needs('phone') && $('phone').value.replace(/\D/g, '').length < 10) { $('phone').setAttribute('aria-invalid', 'true'); $('phone').focus(); return showError('invalid_phone'); }
    if (!$('terms').checked) return showError('terms_required');

    const btn = $('toPayment');
    btn.disabled = true;
    const res = await api('/api/checkout/order', {
      method: 'POST',
      body: JSON.stringify({
        passId: state.passId, quantity: state.qty, name: $('name').value, email: $('email').value, phone: $('phone').value, country: $('country').value,
        businessName: $('businessName').value, businessAddress: $('businessAddress').value,
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

  // ---------------------------------------------------------------- payment methods
  function showPayment() {
    setStep(3);
    renderSummary();
    showMethodList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startPolling();
  }

  function showMethodList() {
    clearInterval(state.tick);
    state.qr = null;
    state.transfer = null;
    $('qrBox').hidden = true;
    $('transferBox').hidden = true;
    $('cardBox').hidden = true;
    $('cardCheckBox').hidden = true;
    $('methods').hidden = false;
    renderMethods();
  }

  function renderMethods() {
    const box = $('methods');
    if (!box || !state.options) return;
    box.textContent = '';
    const methods = state.options.methods || [];
    if (!methods.some((m) => m.available)) box.appendChild(el('p', 'co-sub', t().noMethods));
    (state.options.methodGroups || []).forEach((g) => {
      const list = methods.filter((m) => m.group === g.id);
      if (!list.length) return;
      const group = el('section', 'co-group');
      group.append(el('h3', 'co-group-title', L(g.name)));
      const grid = el('div', 'co-methods-grid');
      list.forEach((m) => {
        const btn = el('button', `co-method${m.available ? '' : ' is-soon'}`);
        btn.type = 'button';
        btn.disabled = !m.available;
        btn.setAttribute('aria-pressed', String(m.id === state.methodId));
        if (m.logoUrl) { const img = el('img'); img.src = m.logoUrl; img.alt = ''; img.loading = 'lazy'; btn.appendChild(img); }
        const label = el('div', 'co-method-text');
        const top = el('strong', null, L(m.name));
        if (!m.available) top.append(el('span', 'co-soon', t().soon));
        label.append(top, el('span', 'co-method-hint', L(m.hint)), el('span', 'co-method-how', L(m.how)));
        btn.appendChild(label);
        btn.addEventListener('click', () => choose(m.id));
        grid.appendChild(btn);
      });
      group.appendChild(grid);
      box.appendChild(group);
    });
  }

  let busy = false;
  async function choose(methodId) {
    if (busy) return;
    if (methodId === 'CARD') { state.methodId = 'CARD'; return showCard(); }
    busy = true;
    clearError();
    state.methodId = methodId;
    document.querySelectorAll('.co-method').forEach((b) => { b.classList.add('is-busy'); });
    const res = await api('/api/checkout/pay', { method: 'POST', body: JSON.stringify({ token: state.token, methodId }) });
    document.querySelectorAll('.co-method').forEach((b) => { b.classList.remove('is-busy'); });
    busy = false;
    if (!res.ok) {
      if (res.error === 'order_expired' || res.error === 'order_not_found') return showExpired();
      if (res.error === 'card_check_pending') return showCardCheck();
      renderMethods();
      return showError(res.error);
    }
    if (res.status === 'paid') return checkStatus();
    push('add_payment_info', { currency: 'USD', value: state.order?.amountUsd, payment_type: methodId });
    if (res.kind === 'transfer') { state.transfer = res; return showTransfer(); }
    state.qr = res;
    showQr();
  }

  // ---------------------------------------------------------------- QR
  function showQr() {
    $('methods').hidden = true;
    $('transferBox').hidden = true;
    $('qrBox').hidden = false;
    $('qrImg').src = state.qr.qrUrl || '';
    $('qrBox').querySelector('.co-qr-art').classList.remove('is-expired');
    $('qrExpired').hidden = true;
    $('newQr').hidden = true;
    $('copyCode').hidden = !state.qr.qrContent;
    renderQrInfo();
    clearInterval(state.tick);
    state.tick = setInterval(renderQrInfo, 1000);
    $('qrBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderQrInfo() {
    if (!state.qr) return;
    const method = state.options?.methods.find((m) => m.id === state.qr.methodId);
    $('qrAmount').textContent = mxn(state.qr.amountMxn);
    $('qrMethod').textContent = t().via(L(method?.name) || state.qr.methodId);
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

  $('newQr').addEventListener('click', () => choose(state.methodId));
  $('changeMethod').addEventListener('click', showMethodList);
  $('copyCode').addEventListener('click', () => state.qr?.qrContent && copy(state.qr.qrContent, $('copyCode')));

  // ---------------------------------------------------------------- card (TacPay · BlissCore)
  function renderCardButton() {
    const amount = state.order?.amountMxn;
    $('cardPayText').textContent = amount ? t().payCard(mxn(amount)) : t().payCard('');
  }
  function showCard() {
    $('methods').hidden = true;
    $('qrBox').hidden = true;
    $('transferBox').hidden = true;
    $('cardCheckBox').hidden = true;
    $('cardBox').hidden = false;
    renderCardButton();
    if (!$('ccName').value && state.order?.buyerName) $('ccName').value = state.order.buyerName.toUpperCase();
    $('cardBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => $('ccNumber').focus({ preventScroll: true }), 300);
  }
  function showCardCheck() {
    stopPolling(); clearInterval(state.tick);
    $('methods').hidden = true; $('qrBox').hidden = true; $('transferBox').hidden = true; $('cardBox').hidden = true;
    $('cardCheckBox').hidden = false;
    $('editOrder').hidden = true;
  }
  $('ccNumber').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  $('ccExp').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
  $('ccCvv').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); });
  $('billZip').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5); });
  $('cardBack').addEventListener('click', showMethodList);

  const cardChecks = [
    ['ccNumber', (v) => v.replace(/\D/g, '').length === 16, 'card_invalid'],
    ['ccExp', (v) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v.trim()), 'card_invalid_expiry'],
    ['ccCvv', (v) => /^\d{3}$/.test(v.trim()), 'card_invalid_cvv'],
    ['ccName', (v) => v.trim().length >= 3, 'card_invalid_holder'],
    ['billStreet', (v) => v.trim().length >= 3, 'invalid_billing'],
    ['billCity', (v) => v.trim().length >= 2, 'invalid_billing'],
    ['billState', (v) => v.trim().length >= 2, 'invalid_billing'],
    ['billZip', (v) => /^\d{5}$/.test(v.trim()), 'invalid_postal_code'],
  ];
  $('cardBox').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    clearError();
    for (const [id, ok, code] of cardChecks) {
      const f = $(id);
      f.removeAttribute('aria-invalid');
      if (!ok(f.value)) { f.setAttribute('aria-invalid', 'true'); f.focus(); return showError(code); }
    }
    const [mm, yy] = $('ccExp').value.split('/');
    busy = true;
    $('cardPay').disabled = true;
    $('cardBusy').hidden = false;
    $('cardBack').hidden = true;
    push('add_payment_info', { currency: 'USD', value: state.order?.amountUsd, payment_type: 'CARD' });
    const res = await api('/api/checkout/pay', {
      method: 'POST',
      body: JSON.stringify({
        token: state.token,
        methodId: 'CARD',
        card: { number: $('ccNumber').value, expMonth: mm, expYear: yy, cvv: $('ccCvv').value, holderName: $('ccName').value },
        billing: { street: $('billStreet').value, city: $('billCity').value, state: $('billState').value, postalCode: $('billZip').value },
      }),
    });
    busy = false;
    $('cardPay').disabled = false;
    $('cardBusy').hidden = true;
    $('cardBack').hidden = false;
    $('ccCvv').value = ''; // never keep the CVV around after a try
    if (res.ok && res.status === 'paid') { $('ccNumber').value = ''; return checkStatus(); }
    if (res.error === 'order_expired' || res.error === 'order_not_found') return showExpired();
    if (res.error === 'card_unconfirmed' || res.error === 'card_check_pending') { $('ccNumber').value = ''; return showCardCheck(); }
    return showError(res.error);
  });

  // ---------------------------------------------------------------- SPEI transfer
  function showTransfer() {
    $('methods').hidden = true;
    $('qrBox').hidden = true;
    $('transferBox').hidden = false;
    renderTransfer();
    $('transferBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderTransfer() {
    const tr = state.transfer?.transfer;
    if (!tr) return;
    const dl = $('bankData');
    dl.textContent = '';
    const row = (label, value, copyable) => {
      const d = el('div');
      d.append(el('dt', null, label));
      const dd = el('dd');
      dd.append(el('span', 'co-bank-value', value));
      if (copyable) {
        const b = el('button', 'co-copy', state.lang === 'es' ? 'Copiar' : 'Copy');
        b.type = 'button';
        b.addEventListener('click', () => copy(copyable, b));
        dd.append(b);
      }
      d.append(dd);
      dl.append(d);
    };
    const b = t().bank;
    row(b.amount, mxn(tr.amountMxn), Number(tr.amountMxn).toFixed(2));
    row(b.reference, tr.reference, tr.reference);
    row(b.clabe, tr.clabe.replace(/(\d{3})(\d{3})(\d{11})(\d)/, '$1 $2 $3 $4'), tr.clabe);
    row(b.beneficiary, tr.beneficiary);
    row(b.bank, tr.bank);
    const deadline = new Date(state.transfer.expiresAt || state.order?.expiresAt);
    $('transferDeadline').textContent = Number.isNaN(deadline.getTime()) ? '' : t().deadline(deadline.toLocaleString(state.lang === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }));
  }
  $('transferBack').addEventListener('click', showMethodList);

  $('editOrder').addEventListener('click', () => {
    stopPolling(); clearInterval(state.tick);
    state.qr = null; state.transfer = null; state.order = null; state.token = null;
    history.replaceState(null, '', '/checkout');
    showMethodList();
    setStep(1); renderSummary();
    $('editOrder').hidden = false;
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

  function renderDone(order) {
    const tickets = order.issuesTickets !== false;
    $('doneTitle').textContent = tickets ? t().doneTickets : t().doneConfirm;
    $('doneText').textContent = tickets ? t().doneTicketsText(order.buyerEmail || '') : t().doneConfirmText(order.buyerEmail || '');
    $('ticketsLinkText').textContent = tickets ? t().viewTickets : t().viewPurchase;
    $('ticketsLink').href = `/boleto?t=${encodeURIComponent(state.token)}`;
  }

  function showDone(order) {
    stopPolling(); clearInterval(state.tick);
    setStep(4);
    renderSummary();
    renderDone(order);
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
    const wanted = params.get('pass');
    const options = await api(`/api/checkout/options${wanted ? `?pass=${encodeURIComponent(wanted)}` : ''}`);
    if (!options.ok) { $('passes').textContent = ''; return showError(options.error); }
    state.options = options;
    $('tfHelp').hidden = (options.methods || []).some((m) => m.id === 'CARD' && m.available);
    const preselected = options.passes.find((p) => p.id === wanted);
    state.category = preselected?.category || options.passes[0]?.category || 'festival';
    renderCats(); renderPasses();
    if (preselected) selectProduct(preselected.id);
    setQty(Number(params.get('qty')) || 1);

    if (state.token) {
      const res = await api(`/api/checkout/status?t=${encodeURIComponent(state.token)}`);
      if (!res.ok) return showExpired();
      state.order = res;
      state.passId = res.passId;
      if (res.status === 'paid') return showDone(res);
      if (res.status !== 'pending') return showExpired();
      showPayment();
      if (res.cardUnconfirmed) {
        showCardCheck();
      } else if (res.transfer) {
        state.transfer = { transfer: res.transfer, expiresAt: res.expiresAt };
        showTransfer();
      } else if (res.attempt && res.attempt.status === 'pending' && Date.parse(res.attempt.expiresAt) > Date.now()) {
        state.methodId = res.attempt.methodId;
        state.qr = { methodId: res.attempt.methodId, qrUrl: res.attempt.qrUrl, qrContent: res.attempt.qrContent, expiresAt: res.attempt.expiresAt, amountMxn: res.amountMxn };
        showQr();
      }
    } else {
      setStep(1);
      if (preselected && (params.get('detail') !== '0' || preselected.pricePending)) openDetail(preselected.id);
    }
  })();
})();
