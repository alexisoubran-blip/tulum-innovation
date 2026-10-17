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

export function ticketEmail({ locale = 'es', name, passName, quantity, amountMxn, ticketsUrl }) {
  const t = COPY[locale] || COPY.es;
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
