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
        invalid_name: 'Please enter your full name.', invalid_email: 'Please enter a valid email.', invalid_quantity: 'That quantity is not available for this product.', invalid_amount: 'Enter the amount you want to contribute.',
        terms_required: 'Please accept the purchase terms.', pass_unavailable: 'That product is not available right now.', rate_not_set: 'Payments are not available right now. Please try again later.',
        order_expired: 'This order expired. Start again.', method_not_allowed: 'That payment method is not available.', method_unavailable: 'That payment method is coming soon. Please choose another one.',
        too_many_attempts: 'Too many attempts for this order. Start again.', payment_provider_error: 'That method did not respond. Choose another method or try again.',
        order_not_found: 'We could not find this order. Start again.', store_not_configured: 'Payments are not available right now.',
        network: 'Connection problem. Check your internet and try again.', default: 'Something went wrong. Please try again.', choose_pass: 'Choose a product.',
        price_pending: 'The price of this product is about to be confirmed. It will be available soon.',
        invalid_first_name: 'Enter your first name.', invalid_last_name: 'Enter your last name.', email_mismatch: 'The emails do not match.',
        invalid_email_domain: 'That email domain does not exist. Check it.', invalid_rfc: 'Check the RFC (12 or 13 characters).', invalid_legal_name: 'Enter the legal name.',
        invalid_tax_zip: 'Enter the 5-digit tax postal code.', invalid_tax_regime: 'Choose your tax regime.', invalid_cfdi_use: 'Choose the CFDI use.', fix_fields: 'Check the highlighted fields.',
        did_you_mean: 'Did you mean', use_it: 'Use it',
        invalid_business_name: 'Please enter the business name.', invalid_business_address: 'Please enter the business location.', invalid_phone: 'Check your mobile number: enter it without the country code (10 digits in Mexico and the US).',
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
        invalid_name: 'Escribe tu nombre completo.', invalid_email: 'Escribe un correo válido.', invalid_quantity: 'Esa cantidad no está disponible para este producto.', invalid_amount: 'Escribe el monto que quieres aportar.',
        terms_required: 'Acepta los términos de compra.', pass_unavailable: 'Ese producto no está disponible por ahora.', rate_not_set: 'Los pagos no están disponibles por ahora. Intenta más tarde.',
        order_expired: 'Esta orden venció. Empieza de nuevo.', method_not_allowed: 'Ese método de pago no está disponible.', method_unavailable: 'Ese método llega muy pronto. Elige otro, por favor.',
        too_many_attempts: 'Demasiados intentos para esta orden. Empieza de nuevo.', payment_provider_error: 'Ese método no respondió. Elige otro método o intenta de nuevo.',
        order_not_found: 'No encontramos esta orden. Empieza de nuevo.', store_not_configured: 'Los pagos no están disponibles por ahora.',
        network: 'Problema de conexión. Revisa tu internet e intenta de nuevo.', default: 'Algo salió mal. Intenta de nuevo.', choose_pass: 'Elige un producto.',
        price_pending: 'El precio de este producto está por confirmarse. Muy pronto estará disponible.',
        invalid_first_name: 'Escribe tu nombre.', invalid_last_name: 'Escribe tu apellido paterno.', email_mismatch: 'Los correos no coinciden.',
        invalid_email_domain: 'Ese dominio de correo no existe. Revísalo.', invalid_rfc: 'Revisa el RFC (12 o 13 caracteres).', invalid_legal_name: 'Escribe la razón social.',
        invalid_tax_zip: 'Escribe el código postal fiscal de 5 dígitos.', invalid_tax_regime: 'Elige tu régimen fiscal.', invalid_cfdi_use: 'Elige el uso de CFDI.', fix_fields: 'Revisa los campos marcados.',
        did_you_mean: '¿Quisiste decir', use_it: 'Usar',
        invalid_business_name: 'Escribe el nombre comercial.', invalid_business_address: 'Escribe la ubicación del comercio.', invalid_phone: 'Revisa tu celular: escribe el número sin la lada (en México son 10 dígitos).',
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

  const state = { lang: 'es', options: null, category: null, passId: null, qty: 1, amount: null, token: params.get('t'), order: null, qr: null, transfer: null, methodId: null, poll: null, tick: null, detailId: null };
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
    if (state.options) { renderCats(); renderPasses(); renderMethods(); fillSelects(); }
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
      else if (p.content?.customAmount) price.append(el('strong', null, state.lang === 'es' ? 'Monto libre' : 'Your amount'));
      else if (p.pricedIn === 'MXN') { if (p.priceUsd) price.append(el('strong', null, usd(p.priceUsd))); price.append(el('span', null, `${state.lang === 'es' ? 'se cobra' : 'charged'} ${mxn(p.priceMxn)}`)); }
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
      : p.content?.customAmount ? (state.lang === 'es' ? 'Monto libre' : 'Your amount')
      : p.pricedIn === 'MXN' ? `${p.priceUsd ? `${usd(p.priceUsd)} · ` : ''}${mxn(p.priceMxn)}${p.maxQuantity > 1 ? ` ${t().perUnit}` : ''}`
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
    $('firstName').scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => $('firstName').focus({ preventScroll: true }), 400);
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
    document.querySelectorAll('.co-company').forEach((n) => { n.hidden = business; }); // the business name replaces "company"
  }

  // ---------------------------------------------------------------- buyer form: validation, email typos, saved draft
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const COMMON_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.mx', 'icloud.com', 'live.com', 'live.com.mx', 'hotmail.es', 'outlook.es', 'protonmail.com', 'me.com', 'msn.com', 'prodigy.net.mx'];
  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function emailSuggestion(email) {
    const [user, domain] = email.toLowerCase().split('@');
    if (!user || !domain || COMMON_DOMAINS.includes(domain)) return null;
    let best = null;
    for (const c of COMMON_DOMAINS) { const dist = distance(domain, c); if (dist > 0 && dist <= 2 && (!best || dist < best.dist)) best = { c, dist }; }
    return best ? `${user}@${best.c}` : null;
  }
  const PHONE_DIGITS = () => state.options?.countries?.find((c) => c.iso === $('phoneCountry').value);
  const exactDigits = { MX: 10, US: 10, CA: 10, ES: 9, CO: 10, CL: 9, PE: 9, VE: 10, EC: 9, GT: 8, CR: 8, PA: 8, DO: 10, SV: 8, HN: 8, BO: 8, PY: 9, FR: 9, PT: 9, NL: 9, CH: 9, IL: 9, AE: 9, IN: 10, CN: 11, JP: 10, SG: 8, AU: 9 };
  const RULES = {
    firstName: () => ($('firstName').value.trim().length >= 2 ? '' : 'invalid_first_name'),
    lastName1: () => ($('lastName1').value.trim().length >= 2 ? '' : 'invalid_last_name'),
    email: () => (EMAIL_RE.test($('email').value.trim()) ? '' : 'invalid_email'),
    emailConfirm: () => ($('emailConfirm').value.trim().toLowerCase() === $('email').value.trim().toLowerCase() && $('emailConfirm').value.trim() ? '' : 'email_mismatch'),
    phone: () => {
      const digits = $('phone').value.replace(/\D/g, '');
      const exact = exactDigits[$('phoneCountry').value];
      return (exact ? digits.length === exact : digits.length >= 6 && digits.length <= 14) ? '' : 'invalid_phone';
    },
    businessName: () => (!needs('businessName') || $('businessName').value.trim().length >= 2 ? '' : 'invalid_business_name'),
    businessAddress: () => (!needs('businessAddress') || $('businessAddress').value.trim().length >= 5 ? '' : 'invalid_business_address'),
    rfc: () => (!$('wantInvoice').checked || /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test($('rfc').value.toUpperCase().replace(/[\s-]/g, '')) ? '' : 'invalid_rfc'),
    taxZip: () => (!$('wantInvoice').checked || /^\d{5}$/.test($('taxZip').value.trim()) ? '' : 'invalid_tax_zip'),
    legalName: () => (!$('wantInvoice').checked || $('legalName').value.trim().length >= 3 ? '' : 'invalid_legal_name'),
    taxRegime: () => (!$('wantInvoice').checked || $('taxRegime').value ? '' : 'invalid_tax_regime'),
  };
  const FIELD_OF = { invalid_first_name: 'firstName', invalid_last_name: 'lastName1', invalid_email: 'email', invalid_email_domain: 'email', email_mismatch: 'emailConfirm', invalid_phone: 'phone', invalid_business_name: 'businessName', invalid_business_address: 'businessAddress', invalid_rfc: 'rfc', invalid_tax_zip: 'taxZip', invalid_legal_name: 'legalName', invalid_tax_regime: 'taxRegime' };
  const touched = new Set();
  function setFieldError(id, code) {
    const input = $(id); const err = $(`${id}-err`);
    if (!input) return;
    const wrap = input.closest('.co-field');
    if (code) { input.setAttribute('aria-invalid', 'true'); if (err) err.textContent = t().errors[code] || t().errors.default; wrap?.classList.remove('is-ok'); }
    else { input.removeAttribute('aria-invalid'); if (err && !err.querySelector('button')) err.textContent = ''; if (input.value.trim()) wrap?.classList.add('is-ok'); else wrap?.classList.remove('is-ok'); }
  }
  function checkField(id) { const code = RULES[id] ? RULES[id]() : ''; setFieldError(id, code); return code; }
  function showEmailHint() {
    const sug = emailSuggestion($('email').value.trim());
    const err = $('email-err');
    if (!sug || RULES.email()) return;
    err.textContent = `${t().errors.did_you_mean} ${sug}?`;
    const b = el('button', null, t().errors.use_it); b.type = 'button';
    b.addEventListener('click', () => { $('email').value = sug; err.textContent = ''; checkField('email'); if (touched.has('emailConfirm')) checkField('emailConfirm'); saveDraft(); });
    err.append(b);
  }
  Object.keys(RULES).forEach((id) => {
    const input = $(id);
    if (!input) return;
    input.addEventListener('blur', () => { touched.add(id); checkField(id); if (id === 'email') { showEmailHint(); if (touched.has('emailConfirm')) checkField('emailConfirm'); } });
    input.addEventListener('input', () => { if (touched.has(id)) checkField(id); if (id === 'email' && touched.has('emailConfirm')) checkField('emailConfirm'); });
  });
  $('phoneCountry').addEventListener('change', () => { if (touched.has('phone')) checkField('phone'); saveDraft(); });
  $('rfc').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, ''); });
  $('taxZip').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5); });
  $('wantInvoice').addEventListener('change', () => { $('invoiceFields').hidden = !$('wantInvoice').checked; saveDraft(); });

  function fillSelects() {
    const flag = (iso) => String.fromCodePoint(...[...iso].map((c) => 127397 + c.charCodeAt(0)));
    const sel = $('phoneCountry');
    const current = sel.value || loadDraft().phoneCountry || ((navigator.language || '').split('-')[1] || '').toUpperCase();
    sel.textContent = '';
    (state.options.countries || []).forEach((c) => {
      const o = el('option', null, `${flag(c.iso)} ${c.dial} · ${L(c.name)}`);
      o.value = c.iso; sel.appendChild(o);
    });
    sel.value = (state.options.countries || []).some((c) => c.iso === current) ? current : 'MX';
    const fill = (id, list, placeholder) => {
      const s2 = $(id); const keep = s2.value; s2.textContent = '';
      if (placeholder) { const o = el('option', null, placeholder); o.value = ''; s2.appendChild(o); }
      (list || []).forEach((r) => { const o = el('option', null, `${r.code} · ${r.name}`); o.value = r.code; s2.appendChild(o); });
      if (keep) s2.value = keep;
    };
    fill('taxRegime', state.options.invoice?.regimes, state.lang === 'es' ? 'Elige…' : 'Choose…');
    fill('cfdiUse', state.options.invoice?.uses);
  }

  const DRAFT_FIELDS = ['firstName', 'lastName1', 'lastName2', 'email', 'emailConfirm', 'phoneCountry', 'phone', 'company', 'jobTitle', 'businessName', 'businessAddress', 'rfc', 'taxZip', 'legalName', 'taxRegime', 'cfdiUse'];
  function loadDraft() { try { return JSON.parse(sessionStorage.getItem('tif-buyer') || '{}'); } catch { return {}; } }
  function saveDraft() {
    const d = Object.fromEntries(DRAFT_FIELDS.map((id) => [id, $(id)?.value || '']));
    d.wantInvoice = $('wantInvoice').checked;
    try { sessionStorage.setItem('tif-buyer', JSON.stringify(d)); } catch {}
  }
  function restoreDraft() {
    const d = loadDraft();
    DRAFT_FIELDS.forEach((id) => { if (d[id] && $(id) && !$(id).value) $(id).value = d[id]; });
    if (d.wantInvoice) { $('wantInvoice').checked = true; $('invoiceFields').hidden = false; }
  }
  DRAFT_FIELDS.forEach((id) => $(id)?.addEventListener('change', saveDraft));

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
    const custom = !order && p?.content?.customAmount;
    const unitUsd = custom ? state.amount : p?.priceUsd;
    const priced = p && !p.pricePending && unitUsd > 0;
    const subtotal = order ? order.subtotalUsd : priced ? unitUsd * qty : null;
    const tax = order ? order.taxUsd : priced ? Math.round(unitUsd * qty * p.taxRate * 100) / 100 : 0;
    $('sumUsdRow').hidden = inMxn;
    $('sumUsd').textContent = subtotal != null ? usd(subtotal) : '—';
    $('sumTaxRow').hidden = inMxn || !(tax > 0);
    $('sumTax').textContent = usd(tax || 0);
    const total = order ? order.amountMxn : priced && inMxn ? p.priceMxn * qty : priced && rate ? Math.ceil(Math.round((unitUsd * qty + tax) * 100) * rate / 100) : null;
    $('sumMxn').textContent = total != null ? mxn(total) : '—';
    $('sumRate').textContent = inMxn ? t().fixedMxn : rate ? t().rate(Number(rate).toFixed(2)) : '';
  }

  function setQty(n) {
    const max = product(state.passId)?.maxQuantity || 10;
    state.qty = Math.min(max, Math.max(1, Number.isFinite(n) ? Math.round(n) : 1));
    $('qty').value = String(state.qty);
    $('qty').max = String(max);
    document.querySelector('.co-qty').hidden = !state.passId || max <= 1; // only once a product with several units is chosen
    $('amountBox').hidden = !product(state.passId)?.content?.customAmount;
    renderSummary();
  }
  $('qtyDown').addEventListener('click', () => setQty(state.qty - 1));
  $('qtyUp').addEventListener('click', () => setQty(state.qty + 1));
  $('qty').addEventListener('change', (e) => setQty(Number(e.target.value)));
  const amountError = () => { const c = product(state.passId)?.content?.customAmount; if (!c) return ''; const v = Number($('amount').value); return Number.isFinite(v) && v >= c.min && v <= c.max ? '' : 'invalid_amount'; };
  $('amount').addEventListener('input', () => { const v = Number($('amount').value); state.amount = v > 0 ? Math.round(v * 100) / 100 : null; $('amount-err').textContent = ''; renderSummary(); });

  // ---------------------------------------------------------------- order
  $('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    if (!state.passId) { $('passes').scrollIntoView({ behavior: 'smooth', block: 'center' }); return showError('choose_pass'); }
    let first = null;
    Object.keys(RULES).forEach((id) => { touched.add(id); const code = checkField(id); if (code && !first) first = id; });
    if (first) { showError('fix_fields'); $(first).focus({ preventScroll: true }); $(first).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (amountError()) { $('amount-err').textContent = t().errors?.invalid_amount || ''; showError('invalid_amount'); $('amount').focus(); return; }
    if (!$('terms').checked) return showError('terms_required');
    saveDraft();

    const btn = $('toPayment');
    btn.disabled = true;
    const res = await api('/api/checkout/order', {
      method: 'POST',
      body: JSON.stringify({
        passId: state.passId, quantity: state.qty, amountUsd: product(state.passId)?.content?.customAmount ? state.amount : undefined,
        firstName: $('firstName').value, lastName1: $('lastName1').value, lastName2: $('lastName2').value,
        email: $('email').value, emailConfirm: $('emailConfirm').value, phoneCountry: $('phoneCountry').value, phone: $('phone').value,
        company: needs('businessName') ? '' : $('company').value, jobTitle: needs('businessName') ? '' : $('jobTitle').value,
        businessName: $('businessName').value, businessAddress: $('businessAddress').value,
        invoice: $('wantInvoice').checked ? { requested: true, rfc: $('rfc').value, zip: $('taxZip').value, legalName: $('legalName').value, regime: $('taxRegime').value, use: $('cfdiUse').value } : null,
        website: $('website').value, acceptTerms: $('terms').checked, locale: state.lang, attribution,
      }),
    });
    btn.disabled = false;
    if (!res.ok) {
      const field = FIELD_OF[res.error];
      if (field) { setFieldError(field, res.error); $(field).focus(); }
      return showError(res.error);
    }
    state.token = res.token;
    state.order = res.order;
    nav.push('methods'); // browser back from the payment step returns to the details
    push('begin_checkout', { currency: 'USD', value: res.order.amountUsd, items: [{ item_id: res.order.passId, item_name: res.order.passName, quantity: res.order.quantity }] });
    showPayment();
  });

  // ---------------------------------------------------------------- navigation (browser back works between steps)
  // History: details (no state) → methods → a method (QR, transfer or card). "Back" closes the open
  // method first, then returns to the details with everything still filled in.
  const nav = {
    url: () => (state.token ? `/checkout?t=${encodeURIComponent(state.token)}` : location.pathname + location.search),
    push(view) { try { history.pushState({ co: view }, '', this.url()); } catch {} },
    replace(view) { try { history.replaceState(view ? { co: view } : null, '', this.url()); } catch {} },
  };
  function methodOpen() { return !$('qrBox').hidden || !$('transferBox').hidden || !$('cardBox').hidden; }
  function openMethodView() { if (history.state?.co !== 'method') nav.push('method'); }
  function closeMethodView() { if (history.state?.co === 'method') history.back(); else showMethodList(); }
  function backToDetails() {
    stopPolling(); clearInterval(state.tick);
    state.qr = null; state.transfer = null; state.order = null; state.token = null;
    showMethodList();
    setStep(1); renderSummary();
    $('editOrder').hidden = false;
    try { history.replaceState(null, '', state.passId ? `/checkout?pass=${encodeURIComponent(state.passId)}&detail=0` : '/checkout'); } catch {}
    $('orderForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  window.addEventListener('popstate', (e) => {
    const view = e.state?.co;
    if (!$('cardCheckBox').hidden || !$('donePanel').hidden) return; // nothing to go back to while a payment is being confirmed or after it
    if (view === 'method') return; // forward navigation: keep what is on screen
    if (view === 'methods') { if (methodOpen()) showMethodList(); return; }
    if (state.token && !$('payPanel').hidden) backToDetails();
  });
  $('payBack').addEventListener('click', () => {
    if (methodOpen()) return closeMethodView();
    if (history.state?.co === 'methods') return history.back();
    backToDetails();
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
        if (m.id === 'CARD') {
          const brands = el('span', 'co-brands co-brands-method');
          [['visa', 'Visa'], ['mastercard', 'Mastercard']].forEach(([f, alt]) => { const img = el('img'); img.src = `/assets/payments/${f}.svg`; img.alt = alt; img.width = 40; img.height = 25; brands.appendChild(img); });
          btn.appendChild(brands);
        } else if (m.id === 'SPEI') {
          const img = el('img'); img.src = '/assets/payments/spei.svg'; img.alt = 'SPEI'; btn.appendChild(img);
        } else if (m.logoUrl) { const img = el('img'); img.src = m.logoUrl; img.alt = ''; img.loading = 'lazy'; btn.appendChild(img); }
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
    openMethodView();
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
  $('changeMethod').addEventListener('click', closeMethodView);
  $('copyCode').addEventListener('click', () => state.qr?.qrContent && copy(state.qr.qrContent, $('copyCode')));

  // ---------------------------------------------------------------- card (TacPay · BlissCore)
  function renderCardButton() {
    const amount = state.order?.amountMxn;
    $('cardPayText').textContent = amount ? t().payCard(mxn(amount)) : t().payCard('');
  }
  function showCard() {
    openMethodView();
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
  $('cardBack').addEventListener('click', closeMethodView);

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
    openMethodView();
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
    row(b.beneficiary, tr.beneficiary, tr.beneficiary);
    row(b.bank, tr.bank);
    const intl = tr.international;
    $('intlBox').hidden = !intl;
    if (intl) {
      const dl2 = $('intlData');
      dl2.textContent = '';
      const r2 = (label, value) => {
        const d = el('div'); d.append(el('dt', null, label));
        const dd = el('dd'); dd.append(el('span', 'co-bank-value', value));
        const c = el('button', 'co-copy', state.lang === 'es' ? 'Copiar' : 'Copy'); c.type = 'button'; c.addEventListener('click', () => copy(value, c)); dd.append(c);
        d.append(dd); dl2.append(d);
      };
      r2('SWIFT', intl.swift);
      r2(state.lang === 'es' ? 'Número de cuenta' : 'Account number', intl.account);
      if (intl.branch) r2(state.lang === 'es' ? 'Sucursal' : 'Branch', intl.branch);
      if (intl.aba) r2(state.lang === 'es' ? 'ABA (desde EE. UU.)' : 'ABA (from the US)', intl.aba);
      r2(state.lang === 'es' ? 'Mensaje / referencia' : 'Message / reference', tr.reference);
    }
    const deadline = new Date(state.transfer.expiresAt || state.order?.expiresAt);
    $('transferDeadline').textContent = Number.isNaN(deadline.getTime()) ? '' : t().deadline(deadline.toLocaleString(state.lang === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }));
  }
  $('transferBack').addEventListener('click', closeMethodView);

  $('editOrder').addEventListener('click', backToDetails);

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
    fillSelects();
    restoreDraft();
    const cardLive = (options.methods || []).some((m) => m.id === 'CARD' && m.available);
    $('tfHelp').hidden = true; // Ticket Fairy is no longer an alternative
    $('trustVisa').hidden = !cardLive;
    $('trustMc').hidden = !cardLive;
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
      nav.replace('methods');
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
