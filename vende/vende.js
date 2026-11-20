// /vende: create a community code. Only the code goes into the shared URL; buyer data never does.
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('vdForm');
  const es = () => (document.documentElement.getAttribute('data-lang') || 'es') === 'es';
  const push = (o) => { try { (window.dataLayer = window.dataLayer || []).push(o); } catch {} };
  const MSG = {
    invalid_name: ['Write your name (3–60 characters).', 'Escribe tu nombre (3 a 60 caracteres).'],
    invalid_email: ['Check your email.', 'Revisa tu correo.'],
    invalid_email_domain: ['That email domain can’t receive mail.', 'Ese dominio de correo no recibe mensajes.'],
    invalid_phone: ['Add a WhatsApp number with area code.', 'Agrega un WhatsApp con lada.'],
    code_length: ['Your code needs 4 to 16 letters or numbers.', 'Tu código necesita de 4 a 16 letras o números.'],
    code_reserved: ['That code is reserved. Try another one.', 'Ese código está reservado. Prueba otro.'],
    code_taken: ['That code is taken. Try another one (add your name or a number).', 'Ese código ya existe. Prueba otro (agrega tu nombre o un número).'],
    email_has_code: ['This email already has a code. Use “Already have a code?” below to see it.', 'Este correo ya tiene un código. Búscalo abajo en “¿Ya tienes código?”.'],
    terms: ['Please accept the conditions.', 'Acepta las condiciones para continuar.'],
    invalid_holder: ['Write the account holder’s name.', 'Escribe el nombre del titular de la cuenta.'],
    invalid_clabe: ['That CLABE isn’t valid. It has 18 digits; check it in your bank app.', 'Esa CLABE no es válida. Son 18 dígitos; revísala en la app de tu banco.'],
    invalid_abroad: ['Tell us how to pay you (8 to 300 characters).', 'Dinos cómo pagarte (8 a 300 caracteres).'],
    payout_exists: ['Your payment details are already saved. To change them, message the team.', 'Tus datos de pago ya están guardados. Para cambiarlos, escríbele al equipo.'],
    generic: ['Something went wrong. Try again in a moment.', 'Algo salió mal. Intenta de nuevo en un momento.'],
  };
  const say = (k) => { const m = MSG[k] || MSG.generic; $('vdErr').textContent = es() ? m[1] : m[0]; $('vdErr').hidden = false; };
  // One message and one 30-second script per pillar, so every seller shares the same campaign.
  const COPY = {
    all: {
      es: ['¡Vente a Tulum Innovation Fest! 4 días de charlas, inversionistas, Whale Tank y fiesta en la selva. 9–12 dic en IKAL Arena, Tulum.', 'Voy a estar en Tulum Innovation Fest, del 9 al 12 de diciembre en IKAL Arena. No es solo una conferencia ni solo un festival: son charlas de día, inversionistas, Whale Tank y una noche de cierre con el sax de Pink Floyd en vivo. Con mi código {CODE} tienes 10% de descuento. El link está aquí abajo.'],
      en: ['Join me at Tulum Innovation Fest! 4 days of talks, investors, Whale Tank and a party in the jungle. Dec 9–12 at IKAL Arena, Tulum.', "I'll be at Tulum Innovation Fest, December 9–12 at IKAL Arena. It's not just a conference and not just a festival: talks by day, investors, Whale Tank and a closing night with Pink Floyd's sax live. My code {CODE} gets you 10% off. Link below."],
    },
    party: {
      es: ['🎷 El sax de Pink Floyd en vivo en plena selva: Scott Page + J.Pool + Selva cierran Tulum Innovation Fest el sábado 12 de diciembre en IKAL Arena.', 'El sábado 12 de diciembre, Scott Page, el saxofonista de Pink Floyd, toca en vivo en la selva de Tulum, con J.Pool y Selva. Es la noche de cierre de Tulum Innovation Fest en IKAL Arena, y viene incluida en el pase. Con mi código {CODE} tienes 10% de descuento. Nos vemos en la pista.'],
      en: ["🎷 Pink Floyd's sax live in the jungle: Scott Page + J.Pool + Selva close Tulum Innovation Fest on Saturday, December 12 at IKAL Arena.", "On Saturday, December 12, Scott Page, Pink Floyd's saxophonist, plays live in the Tulum jungle with J.Pool and Selva. It's the closing night of Tulum Innovation Fest at IKAL Arena, and it's included in the pass. My code {CODE} gets you 10% off. See you on the dance floor."],
    },
    talks: {
      es: ['Más de 80 speakers, inversionistas y mentores en Tulum: IA, finanzas, ciudades del futuro y el futuro de Tulum. 9–12 dic en IKAL Arena.', 'Del 9 al 12 de diciembre hay charlas que valen la pena en Tulum: IA, finanzas, ciudades del futuro y cómo hacer de Tulum un mejor lugar. Más de 80 speakers, inversionistas y mentores en IKAL Arena. Con mi código {CODE} tienes 10% de descuento. Escoge tus charlas y vente.'],
      en: ['80+ speakers, investors and mentors in Tulum: AI, finance, future cities and the future of Tulum. Dec 9–12 at IKAL Arena.', "From December 9 to 12 there are talks worth hearing in Tulum: AI, finance, future cities and how to make Tulum a better place. 80+ speakers, investors and mentors at IKAL Arena. My code {CODE} gets you 10% off. Pick your talks and come."],
    },
    networking: {
      es: ['Inversionistas, fondos y founders en el mismo lugar: Whale Tank, rondas de US$150K a US$3M y networking en la selva. 9–12 dic, IKAL Arena, Tulum.', 'Si buscas capital, socios o clientes, el 9 al 12 de diciembre tienes que estar en Tulum. En Whale Tank, cinco startups presentan rondas de US$150K a US$3M frente a fondos, ángeles y family offices, y los inversionistas están en la sala. Con mi código {CODE} tienes 10% de descuento.'],
      en: ['Investors, funds and founders in one place: Whale Tank, rounds from US$150K to US$3M and networking in the jungle. Dec 9–12, IKAL Arena, Tulum.', "If you're looking for capital, partners or clients, be in Tulum December 9–12. At Whale Tank, five startups pitch rounds from US$150K to US$3M to funds, angels and family offices, and the investors are in the room. My code {CODE} gets you 10% off."],
    },
    regen: {
      es: ['¿Quieres hacer algo por Tulum? Charlas y comunidad sobre regeneración y el futuro de la ciudad. 9–12 dic en IKAL Arena.', 'Tulum está cambiando y nos toca decidir hacia dónde. Del 9 al 12 de diciembre, en IKAL Arena, hablamos de regeneración, comunidad y economía local con la gente que lo está haciendo. Con mi código {CODE} tienes 10% de descuento. Si vives en Tulum, pregunta por Community Access.'],
      en: ['Want to do something for Tulum? Talks and community on regeneration and the future of the city. Dec 9–12 at IKAL Arena.', "Tulum is changing and it's up to us where it goes. From December 9 to 12 at IKAL Arena we talk regeneration, community and the local economy with the people doing it. My code {CODE} gets you 10% off. If you live in Tulum, ask about Community Access."],
    },
  };
  // CLABE check digit (weights 3,7,1) and bank name, so typos are caught before sending.
  const BANKS = { '002': 'Banamex', '012': 'BBVA', '014': 'Santander', '021': 'HSBC', '030': 'BanBajío', '036': 'Inbursa', '044': 'Scotiabank', '058': 'Banregio', '072': 'Banorte', '127': 'Banco Azteca', '137': 'BanCoppel', '646': 'STP' };
  const clabeOk = (d) => { if (!/^\d{18}$/.test(d)) return false; let s = 0; for (let i = 0; i < 17; i++) s += (Number(d[i]) * [3, 7, 1][i % 3]) % 10; return (10 - (s % 10)) % 10 === Number(d[17]); };
  const wirePay = (f) => {
    const ab = f.querySelector('.vd-abroad'), mx = f.querySelector('.vd-mx'), hint = f.querySelector('.vd-bank');
    f.isAbroad.addEventListener('change', () => { ab.hidden = !f.isAbroad.checked; mx.hidden = f.isAbroad.checked; });
    f.clabe.addEventListener('input', () => {
      const d = f.clabe.value.replace(/\D/g, '');
      hint.classList.remove('bad');
      if (d.length < 18) { hint.textContent = d.length ? `${d.length}/18` : ''; return; }
      if (clabeOk(d)) hint.textContent = `✓ ${BANKS[d.slice(0, 3)] || (es() ? 'CLABE válida' : 'Valid CLABE')}`;
      else { hint.textContent = es() ? 'Revisa la CLABE' : 'Check the CLABE'; hint.classList.add('bad'); }
    });
  };
  const payBody = (f) => (f.isAbroad.checked ? { holder: f.holder.value, abroad: f.abroad.value } : { holder: f.holder.value, clabe: f.clabe.value.replace(/\D/g, '') });
  const payCheck = (f) => {
    if (f.holder.value.trim().length < 3) return 'invalid_holder';
    if (f.isAbroad.checked) return f.abroad.value.trim().length < 8 ? 'invalid_abroad' : null;
    return clabeOk(f.clabe.value.replace(/\D/g, '')) ? null : 'invalid_clabe';
  };
  wirePay(form);
  // Flyers per pillar link here with ?pillar=party|talks|networking|regen to preselect it.
  try { const pre = new URLSearchParams(location.search).get('pillar'); const r = pre && form.querySelector(`input[name=pillar][value="${pre.replace(/[^a-z]/g, '')}"]`); if (r) r.checked = true; } catch {}
  const clean = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  form.code.addEventListener('input', () => { form.code.value = clean(form.code.value); });
  form.name.addEventListener('blur', () => {
    if (form.code.value) return;
    const first = form.name.value.normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/)[0] || '';
    const c = clean(first);
    if (c.length >= 2) form.code.value = clean(`${c}10`);
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('vdErr').hidden = true;
    { const bad = payCheck(form); if (bad) return say(bad); }
    if (!form.ok.checked) return say('terms');
    const btn = $('vdBtn'); btn.disabled = true;
    try {
      const r = await fetch('/api/challenge/create-code', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.name.value, email: form.email.value, phone: form.phone.value, code: form.code.value, website: form.website.value, pillar: form.pillar.value, ...payBody(form) }) });
      const d = await r.json().catch(() => ({}));
      if (!d.ok) { btn.disabled = false; return say(d.error); }
      const url = d.url.replace('https://www.', '');
      $('vdCode').textContent = d.code;
      $('vdUrl').value = url;
      const [hook, script] = (COPY[form.pillar.value] || COPY.all)[es() ? 'es' : 'en'];
      const msg = es()
        ? `${hook} Con mi código ${d.code} tienes 10% de descuento en tu pase: https://${url}`
        : `${hook} Use my code ${d.code} for 10% off your pass: https://${url}`;
      $('vdScript').textContent = script.replace('{CODE}', d.code);
      $('vdWa').href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      form.hidden = true; $('vdDone').hidden = false;
      push({ event: 'community_code_created', tif_promo_code: d.code, tif_pillar: form.pillar.value });
    } catch { btn.disabled = false; say('generic'); }
  });
  $('vdScriptCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('vdScript').textContent); } catch {}
    $('vdScriptCopy').textContent = es() ? '¡Copiado!' : 'Copied!';
  });
  $('vdCopy').addEventListener('click', async () => {
    const v = `https://${$('vdUrl').value}`;
    try { await navigator.clipboard.writeText(v); } catch { $('vdUrl').select(); document.execCommand('copy'); }
    $('vdCopy').textContent = es() ? '¡Copiado!' : 'Copied!';
  });
  // "Already have a code?": find your link and sales with your email.
  const find = $('vdFind');
  find?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('vdFound'); out.hidden = false; out.textContent = '…';
    try {
      const r = await fetch('/api/challenge/my-code', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: find.email.value }) });
      const d = await r.json().catch(() => ({}));
      if (!d.ok) { out.textContent = d.error === 'invalid_email' ? (es() ? 'Revisa tu correo.' : 'Check your email.') : (es() ? 'No encontramos un código con ese correo. Ármalo arriba en 30 segundos.' : 'No code found for that email. Create one above in 30 seconds.'); return; }
      const url = d.url.replace('https://www.', '');
      out.innerHTML = '';
      const b = document.createElement('b'); b.textContent = d.code;
      const a = document.createElement('a'); a.href = d.url; a.textContent = url; a.target = '_blank'; a.rel = 'noopener';
      out.append(es() ? 'Tu código: ' : 'Your code: ', b, ' · ', a, document.createElement('br'),
        es() ? `Ventas pagadas: ${d.orders} (${d.tickets} ${d.tickets === 1 ? 'pase' : 'pases'})` : `Paid sales: ${d.orders} (${d.tickets} ${d.tickets === 1 ? 'pass' : 'passes'})`,
        document.createElement('br'), d.hasPayout ? (es() ? '✓ Datos de pago registrados.' : '✓ Payment details on file.') : (es() ? 'Falta registrar dónde te depositamos ↓' : 'Add where we pay you ↓'));
      payAdd.hidden = Boolean(d.hasPayout);
      payAdd.dataset.email = find.email.value;
      push({ event: 'community_code_lookup', tif_promo_code: d.code });
    } catch { out.textContent = es() ? 'Algo salió mal. Intenta de nuevo.' : 'Something went wrong. Try again.'; }
  });
  // Sellers from before: add bank details once (changes go through the team).
  const payAdd = $('vdPayAdd');
  wirePay(payAdd);
  payAdd.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('vdPayErr'); err.hidden = true;
    const show = (k) => { const m = MSG[k] || MSG.generic; err.textContent = es() ? m[1] : m[0]; err.hidden = false; };
    const bad = payCheck(payAdd); if (bad) return show(bad);
    const btn = payAdd.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const r = await fetch('/api/challenge/payout-info', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: payAdd.dataset.email, ...payBody(payAdd) }) });
      const d = await r.json().catch(() => ({}));
      if (!d.ok) { btn.disabled = false; return show(d.error); }
      payAdd.innerHTML = `<p class="vd-official">${es() ? '✓ Listo. Guardamos tus datos de pago.' : '✓ Done. Your payment details are saved.'}</p>`;
      push({ event: 'seller_payout_saved' });
    } catch { btn.disabled = false; show('generic'); }
  });
})();
