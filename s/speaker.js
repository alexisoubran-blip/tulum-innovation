// Speaker invitation (/s/CODE): the speaker's code goes into the checkout links with UTMs.
// Only the speaker code is in the URL — never buyer data.
(() => {
  const $ = (id) => document.getElementById(id);
  const code = (location.pathname.split('/').filter(Boolean)[1] || new URLSearchParams(location.search).get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  const push = (o) => { try { (window.dataLayer = window.dataLayer || []).push(o); } catch {} };
  const fail = () => { $('scInvite').hidden = true; $('scInvalid').hidden = false; };
  if (!code) return fail();

  // Keep incoming UTMs (e.g. a collab post) and default to the challenge ones.
  const inQ = new URLSearchParams(location.search);
  const utm = { utm_source: 'speaker', utm_medium: 'referral', utm_campaign: 'speaker-challenge', utm_content: code };
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach((k) => { if (inQ.get(k)) utm[k] = inQ.get(k); });
  try { sessionStorage.setItem('tif-promo', code); } catch {}
  const link = (pass) => `/checkout?${new URLSearchParams({ pass, detail: '0', code, ...utm, ref: `s-${code}` })}`;

  fetch(`/api/challenge/speaker?code=${encodeURIComponent(code)}`, { cache: 'no-store' })
    .then((r) => r.json())
    .then((s) => {
      if (!s.ok) return fail();
      document.title = `${s.name} · Tulum Innovation Fest 2026`;
      $('scName').textContent = s.name;
      $('scOrg').textContent = s.organization || '';
      if (s.session) { $('scSession').hidden = false; $('scSession').textContent = s.session; }
      $('scCode').textContent = s.code;
      $('scOff').textContent = `−${s.percentOff}%`;
      $('scInitials').textContent = s.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
      if (s.photo) { const img = new Image(); img.src = s.photo; img.alt = s.name; img.decoding = 'async'; $('scPhoto').appendChild(img); }
      $('scBuy').href = link('general-access');
      $('scBuyExec').href = link('executive-pass');
      $('scInvite').setAttribute('aria-busy', 'false');
      // Retargeting: visitors of a speaker page (GTM → Meta ViewContent / Google remarketing).
      push({ event: 'speaker_landing_view', tif_promo_code: s.code, tif_speaker: s.name, tif_content_ids: ['general-access', 'executive-pass'] });
    })
    .catch(fail);
  ['scBuy', 'scBuyExec'].forEach((id) => $(id).addEventListener('click', () => push({ event: 'speaker_landing_click', tif_promo_code: code, tif_product_id: id === 'scBuy' ? 'general-access' : 'executive-pass' })));
})();
