// Checkout service: order → Blokko payment intent (QR) → paid → tickets → email.
// Independent of the HTTP runtime so it can be tested with the memory store and a fake Blokko client.
//
// Money rules: prices come from the database (never from the browser), are converted to MXN at
// TIF's current rate and rounded up to the whole peso; the order keeps the rate it was charged at.
// The signed Blokko webhook is the source of truth; the status check also asks Blokko directly
// (authenticated API) so the buyer is not left waiting if the webhook is delayed. Either path
// marks the order paid exactly once (mark_order_paid) and issuing tickets is idempotent.

import { randomUUID } from 'node:crypto';
import { usdToMxn } from './pricing.mjs';
import { sealOrderToken, openOrderToken } from './order-token.mjs';
import { ticketToken, tokenHash } from './tickets.mjs';
import { ticketEmail, sendTicketEmail } from './email.mjs';
import { toUtcIso, BlokkoError } from './blokko.mjs';

// Blokko methods offered at checkout, in display order (override with BLOKKO_ALLOWED_METHODS).
export const DEFAULT_METHODS = ['WALL', 'CRPT', 'CASH', 'BCLN', 'BTSO', 'CODI'];
export const ORDER_TTL_MINUTES = 30;
export const MAX_ATTEMPTS = 8;
export const MAX_QUANTITY = 10;
const ORDER_TOKEN_TTL = 60 * 60 * 24 * 120; // the link in the ticket email stays valid through the event

export class CheckoutError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = 'CheckoutError';
    this.code = code;
    this.status = status;
  }
}

export function allowedMethods(env = process.env) {
  const list = (env.BLOKKO_ALLOWED_METHODS || DEFAULT_METHODS.join(',')).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return [...new Set(list)];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const round2 = (n) => Math.round(n * 100) / 100;

export function createCheckout({ store, blokko, env = process.env, now = () => Date.now(), sendEmail = sendTicketEmail, siteUrl = 'https://www.tuluminnovationfest.com' }) {
  const secret = env.ORDER_TOKEN_SECRET;
  const methods = allowedMethods(env);

  const orderFromToken = async (token) => {
    const id = token ? openOrderToken(token, secret, { now: now() }) : null;
    const order = id ? await store.getOrder(id) : null;
    if (!order) throw new CheckoutError('order_not_found', 404);
    return order;
  };

  const summary = (order, pass) => ({
    status: order.status === 'pending' && Date.parse(order.expires_at) < now() ? 'expired' : order.status,
    passId: order.pass_id,
    passName: pass?.name ?? order.pass_id,
    quantity: order.quantity,
    amountUsd: Number(order.amount_usd),
    amountMxn: Number(order.amount_mxn),
    rate: Number(order.fx_usd_mxn),
    expiresAt: order.expires_at,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
  });

  async function fulfill(order) {
    if (order.status !== 'paid') return [];
    const pass = await store.getPass(order.pass_id);
    const rows = Array.from({ length: order.quantity }, (_, i) => {
      const id = randomUUID();
      return { id, order_id: order.id, pass_id: order.pass_id, seq: i + 1, holder_name: order.buyer_name, holder_email: order.buyer_email, token_hash: tokenHash(ticketToken(id, secret)) };
    });
    await store.insertTickets(rows);
    const tickets = await store.listTickets(order.id);

    if (await store.claimTicketEmail(order.id)) {
      const token = sealOrderToken(order.id, secret, { ttlSeconds: ORDER_TOKEN_TTL, now: now() });
      const message = ticketEmail({
        locale: order.locale || 'es',
        name: order.buyer_name,
        passName: pass?.name ?? order.pass_id,
        quantity: order.quantity,
        amountMxn: order.amount_mxn,
        ticketsUrl: `${siteUrl}/boleto?t=${encodeURIComponent(token)}`,
      });
      let result;
      try {
        result = await sendEmail({ ...message, to: order.buyer_email, name: order.buyer_name }, { apiKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL });
      } catch {
        result = { sent: false };
      }
      if (!result.sent) await store.releaseTicketEmail(order.id); // retried on the next status check
    }
    return tickets;
  }

  return {
    fulfill,

    async options() {
      const [passes, rate] = await Promise.all([store.listPasses(), store.currentUsdMxn()]);
      let available = [];
      try {
        const list = await blokko.getPaymentMethods();
        const byId = new Map((Array.isArray(list) ? list : []).map((m) => [String(m.id).toUpperCase(), m]));
        available = methods.filter((id) => byId.has(id)).map((id) => {
          const m = byId.get(id);
          return { id, name: m.name || id, category: m.category || null, logoUrl: m.logoUrl || null };
        });
      } catch {
        available = [];
      }
      return {
        rate,
        passes: passes.map((p) => ({
          id: p.id,
          name: p.name,
          priceUsd: Number(p.price_usd),
          priceMxn: rate && Number(p.price_usd) > 0 ? usdToMxn(p.price_usd, rate) : null,
        })),
        methods: available,
      };
    },

    async createOrder(input = {}) {
      if (input.website) throw new CheckoutError('invalid_request'); // honeypot
      const name = clean(input.name, 120);
      const email = clean(input.email, 160).toLowerCase();
      const phone = clean(input.phone, 40) || null;
      const country = clean(input.country, 60) || null;
      const quantity = Number(input.quantity);
      const locale = input.locale === 'en' ? 'en' : 'es';
      if (name.length < 2) throw new CheckoutError('invalid_name');
      if (!EMAIL_RE.test(email)) throw new CheckoutError('invalid_email');
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new CheckoutError('invalid_quantity');
      if (input.acceptTerms !== true) throw new CheckoutError('terms_required');

      const pass = await store.getPass(String(input.passId || ''));
      if (!pass || !pass.on_sale || !(Number(pass.price_usd) > 0)) throw new CheckoutError('pass_unavailable');
      const rate = await store.currentUsdMxn();
      if (!rate) throw new CheckoutError('rate_not_set', 503);

      const unit = Number(pass.price_usd);
      const amountUsd = round2(unit * quantity);
      const a = input.attribution || {};
      const order = await store.createOrder({
        pass_id: pass.id,
        quantity,
        unit_price_usd: unit,
        amount_usd: amountUsd,
        amount_mxn: usdToMxn(amountUsd, rate),
        fx_usd_mxn: rate,
        currency: 'MXN',
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        buyer_country: country,
        locale,
        utm_source: clean(a.utm_source, 120) || null,
        utm_medium: clean(a.utm_medium, 120) || null,
        utm_campaign: clean(a.utm_campaign, 160) || null,
        utm_content: clean(a.utm_content, 160) || null,
        utm_term: clean(a.utm_term, 160) || null,
        gclid: clean(a.gclid, 200) || null,
        fbclid: clean(a.fbclid, 200) || null,
        metadata: a.ref ? { ref: clean(a.ref, 40) } : {},
        expires_at: new Date(now() + ORDER_TTL_MINUTES * 60 * 1000).toISOString(),
      });
      return { token: sealOrderToken(order.id, secret, { ttlSeconds: ORDER_TOKEN_TTL, now: now() }), order: summary(order, pass) };
    },

    async pay({ token, methodId } = {}) {
      const order = await orderFromToken(token);
      if (order.status === 'paid') return { status: 'paid' };
      if (order.status !== 'pending' || Date.parse(order.expires_at) < now()) throw new CheckoutError('order_expired', 410);
      const method = String(methodId || '').toUpperCase();
      if (!methods.includes(method)) throw new CheckoutError('method_not_allowed');
      const previous = await store.listAttempts(order.id);
      if (previous.length >= MAX_ATTEMPTS) throw new CheckoutError('too_many_attempts', 429);

      const attempt = await store.createAttempt({ order_id: order.id, provider: 'blokko', payment_method_id: method, amount_mxn: order.amount_mxn });
      let response;
      try {
        response = await blokko.createPaymentIntent({
          merchantTransactionId: attempt.id,
          merchantReference: order.id,
          amount: Number(order.amount_mxn).toFixed(2),
          paymentMethodId: method,
        });
      } catch (error) {
        await store.updateAttempt(attempt.id, { status: 'failed' });
        throw new CheckoutError(error instanceof BlokkoError ? 'payment_provider_error' : 'payment_failed', 502);
      }
      const expiresAt = toUtcIso(response?.expiresAt) || new Date(now() + 3 * 60 * 1000).toISOString();
      await store.updateAttempt(attempt.id, {
        provider_transaction_id: response?.transactionId ?? null,
        qr_url: response?.qrUrl ?? null,
        qr_content: response?.qrContent ?? null,
        expires_at: expiresAt,
      });
      return {
        status: 'pending',
        attemptId: attempt.id,
        methodId: method,
        qrUrl: response?.qrUrl ?? null,
        qrContent: response?.qrContent ?? null,
        expiresAt,
        amountMxn: Number(response?.totalAmount ?? order.amount_mxn),
        currency: response?.currency ?? 'MXN',
      };
    },

    async status({ token } = {}) {
      let order = await orderFromToken(token);
      const pass = await store.getPass(order.pass_id);
      let attemptInfo = null;

      if (order.status === 'pending') {
        const [latest] = await store.listAttempts(order.id);
        if (latest && latest.status === 'pending') {
          try {
            const r = await blokko.getPaymentByMerchantTransactionId(latest.id);
            if (r?.transactionStatus === 'E') {
              const result = await store.markOrderPaid(order.id, {
                provider: 'blokko',
                providerReference: r.transactionId ?? latest.provider_transaction_id ?? null,
                authorizationId: r.authorizationId ?? null,
                paidAt: toUtcIso(r.completedAt) || new Date(now()).toISOString(),
              });
              order = result.order;
              await store.updateAttempt(latest.id, { status: 'paid' });
            } else if (latest.expires_at && Date.parse(latest.expires_at) < now()) {
              await store.updateAttempt(latest.id, { status: 'expired' });
              latest.status = 'expired';
            }
          } catch {
            // Blokko unreachable: keep waiting for the webhook.
          }
          attemptInfo = { id: latest.id, status: latest.status, methodId: latest.payment_method_id, expiresAt: latest.expires_at, qrUrl: latest.qr_url, qrContent: latest.qr_content };
        }
      }

      let ticketsReady = false;
      if (order.status === 'paid') {
        const tickets = await fulfill(order); // idempotent: repairs missing tickets or a failed email
        ticketsReady = tickets.length === order.quantity;
      }
      return { ...summary(order, pass), attempt: attemptInfo, ticketsReady };
    },

    async tickets({ token } = {}) {
      const order = await orderFromToken(token);
      if (order.status !== 'paid') throw new CheckoutError('not_paid', 409);
      const pass = await store.getPass(order.pass_id);
      let tickets = await store.listTickets(order.id);
      if (tickets.length < order.quantity) tickets = await fulfill(order);
      return {
        passName: pass?.name ?? order.pass_id,
        buyerName: order.buyer_name,
        tickets: tickets.map((t) => ({ seq: t.seq, holder: t.holder_name, status: t.status, code: ticketToken(t.id, secret) })),
      };
    },
  };
}
