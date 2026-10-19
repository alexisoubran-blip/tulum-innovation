// Ticket delivery email through Brevo's transactional API (https://api.brevo.com/v3/smtp/email).
// Needs BREVO_API_KEY; the sender must be verified in Brevo (default innovation@likegroup.io).

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const COPY = {
  es: {
    subject: (pass) => `Tus boletos · ${pass} · Tulum Innovation Fest 2026`,
    hello: (name) => `Hola ${name},`,
    intro: 'Tu pago fue confirmado. Estos son tus boletos para Tulum Innovation Fest 2026, del 9 al 12 de diciembre en IKAL Arena, Tulum.',
    button: 'Ver mis boletos',
    qty: (n) => (n === 1 ? '1 boleto' : `${n} boletos`),
    paid: 'Total pagado',
    door: 'Presenta el código QR de cada boleto en el acceso. Guarda este correo: el enlace es personal.',
    help: '¿Dudas? Responde a este correo.',
  },
  en: {
    subject: (pass) => `Your tickets · ${pass} · Tulum Innovation Fest 2026`,
    hello: (name) => `Hi ${name},`,
    intro: 'Your payment is confirmed. Here are your tickets for Tulum Innovation Fest 2026, December 9–12 at IKAL Arena, Tulum.',
    button: 'View my tickets',
    qty: (n) => (n === 1 ? '1 ticket' : `${n} tickets`),
    paid: 'Total paid',
    door: 'Show each ticket’s QR code at the entrance. Keep this email: the link is personal.',
    help: 'Questions? Just reply to this email.',
  },
};

// Products that do not issue tickets (sponsorships): payment confirmation, team follows up.
const CONFIRM = {
  es: {
    subject: (pass) => `Pago confirmado · ${pass} · Tulum Innovation Fest 2026`,
    intro: 'Tu pago fue confirmado. Nuestro equipo de alianzas te contactará en las próximas 48 horas para coordinar los beneficios, entregables y la factura si la necesitas.',
    button: 'Ver mi compra',
    door: 'Guarda este correo como comprobante.',
  },
  en: {
    subject: (pass) => `Payment confirmed · ${pass} · Tulum Innovation Fest 2026`,
    intro: 'Your payment is confirmed. Our partnerships team will contact you within 48 hours to coordinate the benefits, deliverables and the invoice if you need one.',
    button: 'View my purchase',
    door: 'Keep this email as your receipt.',
  },
};

export function ticketEmail({ kind = 'tickets', locale = 'es', name, passName, quantity, amountMxn, ticketsUrl }) {
  const base = COPY[locale] || COPY.es;
  const t = kind === 'confirmation' ? { ...base, ...(CONFIRM[locale] || CONFIRM.es) } : base;
  const amount = `$${Number(amountMxn).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const html = `<!doctype html><html><body style="margin:0;background:#00080B;font-family:Arial,Helvetica,sans-serif;color:#f2f1ea">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#00080B"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a1518;border:1px solid #1f2a2d;border-radius:14px">
<tr><td style="padding:28px 28px 8px"><img src="https://www.tuluminnovationfest.com/assets/tulum-innovation-fest-logo.png" width="150" alt="Tulum Innovation Fest" style="display:block"></td></tr>
<tr><td style="padding:16px 28px 0;font-size:16px;line-height:1.6">${esc(t.hello(name))}<br><br>${esc(t.intro)}</td></tr>
<tr><td style="padding:20px 28px 0"><table role="presentation" width="100%" style="border-top:1px solid #1f2a2d;border-bottom:1px solid #1f2a2d"><tr>
<td style="padding:14px 0;font-size:15px"><strong>${esc(passName)}</strong><br><span style="color:#a9aca8">${esc(t.qty(quantity))}</span></td>
<td align="right" style="padding:14px 0;font-size:13px;color:#a9aca8">${esc(t.paid)}<br><strong style="color:#f2f1ea;font-size:15px">${esc(amount)}</strong></td></tr></table></td></tr>
<tr><td style="padding:24px 28px"><a href="${esc(ticketsUrl)}" style="display:inline-block;background:#D14414;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:999px">${esc(t.button)}</a></td></tr>
<tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.6;color:#a9aca8">${esc(t.door)}<br>${esc(t.help)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${t.hello(name)}\n\n${t.intro}\n\n${passName} · ${t.qty(quantity)} · ${t.paid}: ${amount}\n\n${t.button}: ${ticketsUrl}\n\n${t.door}\n${t.help}`;
  return { subject: t.subject(passName), html, text };
}

// Bank-transfer instructions, sent when the buyer chooses to pay by transfer.
const TRANSFER = {
  es: {
    subject: (ref) => `Datos para tu transferencia · ${ref} · Tulum Innovation Fest 2026`,
    intro: 'Apartamos tu compra. Para completarla, transfiere el monto exacto y escribe la referencia en el concepto de pago. Al confirmar el depósito te enviamos tu compra por correo (máximo 1 día hábil).',
    amount: 'Monto exacto', reference: 'Referencia (concepto)', clabe: 'CLABE', beneficiary: 'Beneficiario', bank: 'Banco',
    intl: 'Desde fuera de México (transferencia internacional)', swift: 'SWIFT', account: 'Número de cuenta', branch: 'Sucursal', aba: 'ABA (EE. UU.)',
    intlNote: 'Incluye la referencia en el mensaje al beneficiario. Las comisiones bancarias corren por tu cuenta; debe llegar el monto completo.',
    deadline: (d) => `Transfiere antes del ${d}; después la orden vence.`, button: 'Ver mi orden',
  },
  en: {
    subject: (ref) => `Bank transfer details · ${ref} · Tulum Innovation Fest 2026`,
    intro: 'Your purchase is on hold. To complete it, transfer the exact amount and write the reference in the payment concept. Once we confirm the deposit we email your purchase (within 1 business day).',
    amount: 'Exact amount', reference: 'Reference (payment concept)', clabe: 'CLABE', beneficiary: 'Beneficiary', bank: 'Bank',
    intl: 'From outside Mexico (international wire)', swift: 'SWIFT', account: 'Account number', branch: 'Branch', aba: 'ABA (US)',
    intlNote: 'Include the reference in the message to the beneficiary. Bank fees are on the sender; the full amount must arrive.',
    deadline: (d) => `Transfer before ${d}; after that the order expires.`, button: 'View my order',
  },
};

export function transferEmail({ locale = 'es', name, passName, quantity, transfer, expiresAt, orderUrl }) {
  const t = { ...(COPY[locale] || COPY.es), ...(TRANSFER[locale] || TRANSFER.es) };
  const amount = `$${Number(transfer.amountMxn).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const when = new Date(expiresAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Cancun' });
  const rows = [[t.amount, amount], [t.reference, transfer.reference], [t.clabe, transfer.clabe], [t.beneficiary, transfer.beneficiary], [t.bank, transfer.bank]];
  const intl = transfer.international;
  const intlRows = intl ? [[t.swift, intl.swift], [t.account, intl.account], ...(intl.branch ? [[t.branch, intl.branch]] : []), ...(intl.aba ? [[t.aba, intl.aba]] : [])] : [];
  const table = (list) => list.map(([k, v]) => `<tr><td style="padding:8px 0;color:#a9aca8;font-size:13px">${esc(k)}</td><td align="right" style="padding:8px 0;font-size:15px"><strong>${esc(v)}</strong></td></tr>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#00080B;font-family:Arial,Helvetica,sans-serif;color:#f2f1ea">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#00080B"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a1518;border:1px solid #1f2a2d;border-radius:14px">
<tr><td style="padding:28px 28px 8px"><img src="https://www.tuluminnovationfest.com/assets/tulum-innovation-fest-logo.png" width="150" alt="Tulum Innovation Fest" style="display:block"></td></tr>
<tr><td style="padding:16px 28px 0;font-size:16px;line-height:1.6">${esc(t.hello(name))}<br><br>${esc(t.intro)}</td></tr>
<tr><td style="padding:12px 28px 0;font-size:14px;color:#a9aca8"><strong style="color:#f2f1ea">${esc(passName)}</strong> · ${esc(t.qty(quantity))}</td></tr>
<tr><td style="padding:12px 28px 0"><table role="presentation" width="100%" style="border-top:1px solid #1f2a2d">${table(rows)}</table></td></tr>
${intl ? `<tr><td style="padding:18px 28px 0;font-size:14px"><strong>${esc(t.intl)}</strong></td></tr><tr><td style="padding:4px 28px 0"><table role="presentation" width="100%" style="border-top:1px solid #1f2a2d">${table(intlRows)}</table></td></tr><tr><td style="padding:6px 28px 0;font-size:12px;color:#a9aca8">${esc(t.intlNote)}</td></tr>` : ''}
<tr><td style="padding:18px 28px 0;font-size:13px;color:#a9aca8">${esc(t.deadline(when))}</td></tr>
<tr><td style="padding:22px 28px"><a href="${esc(orderUrl)}" style="display:inline-block;background:#D14414;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:999px">${esc(t.button)}</a></td></tr>
<tr><td style="padding:0 28px 28px;font-size:13px;color:#a9aca8">${esc(t.help)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [t.hello(name), '', t.intro, '', `${passName} · ${t.qty(quantity)}`, ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(intl ? ['', t.intl, ...intlRows.map(([k, v]) => `${k}: ${v}`), t.intlNote] : []), '', t.deadline(when), '', `${t.button}: ${orderUrl}`, '', t.help].join('\n');
  return { subject: t.subject(transfer.reference), html, text };
}

export async function sendTicketEmail(message, { apiKey, senderEmail, senderName = 'Tulum Innovation Fest', fetchImpl = globalThis.fetch }) {
  if (!apiKey) return { sent: false, reason: 'BREVO_API_KEY not set' };
  const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail || 'innovation@likegroup.io' },
      to: [{ email: message.to, name: message.name }],
      replyTo: { email: senderEmail || 'innovation@likegroup.io', name: senderName },
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      tags: ['tif-tickets'],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { sent: false, reason: `Brevo responded ${response.status}` };
  return { sent: true };
}
