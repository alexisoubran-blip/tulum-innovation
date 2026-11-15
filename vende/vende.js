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
    generic: ['Something went wrong. Try again in a moment.', 'Algo salió mal. Intenta de nuevo en un momento.'],
  };
  const say = (k) => { const m = MSG[k] || MSG.generic; $('vdErr').textContent = es() ? m[1] : m[0]; $('vdErr').hidden = false; };
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
    if (!form.ok.checked) return say('terms');
    const btn = $('vdBtn'); btn.disabled = true;
    try {
      const r = await fetch('/api/challenge/create-code', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.name.value, email: form.email.value, phone: form.phone.value, code: form.code.value, website: form.website.value }) });
      const d = await r.json().catch(() => ({}));
      if (!d.ok) { btn.disabled = false; return say(d.error); }
      const url = d.url.replace('https://www.', '');
      $('vdCode').textContent = d.code;
      $('vdUrl').value = url;
      const msg = es()
        ? `¡Vente a Tulum Innovation Fest! 9–12 dic en IKAL Arena, Tulum. Con mi código ${d.code} tienes 10% de descuento en tu pase (y ahí mismo puedes pedir el Innovation Mezcal): https://${url}`
        : `Join me at Tulum Innovation Fest! Dec 9–12 at IKAL Arena, Tulum. Use my code ${d.code} for 10% off your pass (you can also get the Innovation Mezcal there): https://${url}`;
      $('vdWa').href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      form.hidden = true; $('vdDone').hidden = false;
      push({ event: 'community_code_created', tif_promo_code: d.code });
    } catch { btn.disabled = false; say('generic'); }
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
        es() ? `Ventas pagadas: ${d.orders} (${d.tickets} ${d.tickets === 1 ? 'pase' : 'pases'})` : `Paid sales: ${d.orders} (${d.tickets} ${d.tickets === 1 ? 'pass' : 'passes'})`);
      push({ event: 'community_code_lookup', tif_promo_code: d.code });
    } catch { out.textContent = es() ? 'Algo salió mal. Intenta de nuevo.' : 'Something went wrong. Try again.'; }
  });
})();
