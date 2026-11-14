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
    email_has_code: ['This email already has a code. Write to innovation@likegroup.io if you lost it.', 'Este correo ya tiene un código. Escribe a innovation@likegroup.io si lo perdiste.'],
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
        ? `¡Vente a Tulum Innovation Fest! 9–12 dic en IKAL Arena, Tulum. Con mi código ${d.code} tienes 10% de descuento: https://${url}`
        : `Join me at Tulum Innovation Fest! Dec 9–12 at IKAL Arena, Tulum. Use my code ${d.code} for 10% off: https://${url}`;
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
})();
