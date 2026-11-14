// Checkout service: product → order → payment (card via TacPay/BlissCore, Blokko QR, SPEI transfer)
// → paid → tickets → email.
// Independent of the HTTP runtime so it can be tested with the memory store and a fake Blokko client.
//
// Money rules: prices come from the database (never from the browser), plus VAT where the product
// has it, converted to MXN at TIF's current rate and rounded up to the whole peso; the order keeps
// the rate it was charged at. The signed Blokko webhook is the source of truth; the status check also
// asks Blokko directly (authenticated API) so the buyer is not left waiting. Bank transfers are
// confirmed by an admin. Cards are charged synchronously (BlissCore has no webhook or status query): an
// approved answer marks the order paid at once; a timeout leaves the attempt 'unconfirmed' and blocks
// further payments on that order until an admin checks the BlissCore panel. Every path marks the order paid exactly once (mark_order_paid) and issuing
// tickets is idempotent.

import { randomUUID, randomInt } from 'node:crypto';
import { usdToMxn } from './pricing.mjs';
import { sealOrderToken, openOrderToken } from './order-token.mjs';
import { ticketToken, tokenHash } from './tickets.mjs';
import { ticketEmail, transferEmail, sendTicketEmail } from './email.mjs';
import { clabeIsValid } from './bank-account.mjs';
import { countryOptions, normalizePhone, validateInvoice, TAX_REGIMES, CFDI_USES } from './buyer.mjs';
import { toUtcIso, BlokkoError } from './blokko.mjs';
import { validateCard, validateBilling } from './blisscore.mjs';
import { CATEGORIES, PRODUCTS } from './catalog-content.mjs';

const L = (v, locale) => (v && typeof v === 'object' ? v[locale] || v.es || v.en || '' : v || '');

// Blokko methods offered at checkout, in display order (override with BLOKKO_ALLOWED_METHODS).
export const DEFAULT_METHODS = ['WALL', 'BCLN', 'CRPT', 'CASH', 'CETS', 'BTSO', 'CODI', 'LPIX', 'KWCL'];
export const ORDER_TTL_MINUTES = 30;
export const TRANSFER_TTL_HOURS = 72;
export const MAX_ATTEMPTS = 20;
export const MAX_QUANTITY = 10;
export const MAX_CARD_ATTEMPTS = 5;          // per order: stops card testing on one order
export const CARD_FAILURE_WINDOW_MIN = 15;   // site-wide circuit breaker against card testing
export const CARD_FAILURE_LIMIT = 25;
const ORDER_TOKEN_TTL = 60 * 60 * 24 * 120; // the link in the ticket email stays valid through the event

const B = (en, es) => ({ en, es });
// How each method is presented: group, friendly name and a one-line explanation.
export const METHOD_INFO = {
  CARD: { group: 'card', provider: 'tacpay', name: 'Visa / Mastercard', hint: B('Credit or debit · cards issued in Mexico', 'Crédito o débito · tarjetas emitidas en México'), how: B('Enter your card details; the charge is approved instantly by TacPay. Foreign cards are not accepted yet.', 'Escribe los datos de tu tarjeta; TacPay aprueba el cargo al momento. Por ahora no se aceptan tarjetas extranjeras.') },
  SPEI: { group: 'bank', provider: 'manual', name: B('Bank transfer', 'Transferencia bancaria'), hint: B('SPEI from Mexico or international wire', 'SPEI desde México o transferencia internacional'), how: B('Transfer the exact amount with your reference. We confirm it and send your purchase (up to 1 business day).', 'Transfiere el monto exacto con tu referencia. Lo confirmamos y te enviamos tu compra (hasta 1 día hábil).') },
  CODI: { group: 'bank', provider: 'blokko', name: 'CoDi', hint: B('Your bank app · pesos', 'App de tu banco · pesos'), how: B('Scan the QR with your Mexican bank app (CoDi by Banxico) and pay in pesos.', 'Escanea el QR con la app de tu banco (CoDi de Banxico) y paga en pesos.') },
  BTSO: { group: 'bank', provider: 'blokko', name: 'Bitso', hint: B('Pesos or crypto balance', 'Saldo en pesos o cripto'), how: B('Scan the QR with the Bitso app and pay from your balance.', 'Escanea el QR con la app de Bitso y paga con tu saldo.') },
  WALL: { group: 'crypto', provider: 'blokko', name: 'WalletConnect', hint: B('USDC / USDT · MetaMask, Trust, Tether…', 'USDC / USDT · MetaMask, Trust, Tether…'), how: B('Scan with your wallet and approve the stablecoin payment.', 'Escanea con tu wallet y aprueba el pago en stablecoins.') },
  BCLN: { group: 'crypto', provider: 'blokko', name: 'Bitcoin Lightning', hint: B('Muun, Phoenix, Wallet of Satoshi…', 'Muun, Phoenix, Wallet of Satoshi…'), how: B('Scan the Lightning invoice with your Bitcoin wallet. It confirms in seconds.', 'Escanea la factura Lightning con tu wallet de Bitcoin. Se confirma en segundos.') },
  CRPT: { group: 'crypto', provider: 'blokko', name: 'Crypto.com', hint: B('Crypto.com app', 'App de Crypto.com'), how: B('Scan the QR with the Crypto.com app and pay from your balance.', 'Escanea el QR con la app de Crypto.com y paga con tu saldo.') },
  CETS: { group: 'crypto', provider: 'blokko', name: 'CETES (Solana)', hint: B('Tokenized CETES on Solana', 'CETES tokenizados en Solana'), how: B('Scan with your Solana wallet and pay with tokenized CETES.', 'Escanea con tu wallet de Solana y paga con CETES tokenizados.') },
  LPIX: { group: 'latam', provider: 'blokko', name: 'PIX', hint: B('Brazil · any bank app', 'Brasil · app de cualquier banco'), how: B('Scan the QR with your Brazilian bank app and pay with PIX.', 'Escanea el QR con la app de tu banco en Brasil y paga con PIX.') },
  KWCL: { group: 'latam', provider: 'blokko', name: 'Khipu', hint: B('Chile · bank transfer', 'Chile · transferencia bancaria'), how: B('Scan the QR and pay from your Chilean bank with Khipu.', 'Escanea el QR y paga desde tu banco en Chile con Khipu.') },
  CASH: { group: 'crypto', provider: 'blokko', name: 'Cash App', hint: B('Bitcoin from Cash App (US)', 'Bitcoin desde Cash App (EE. UU.)'), how: B('Scan the QR with Cash App and pay with Bitcoin.', 'Escanea el QR con Cash App y paga con Bitcoin.') },
};
export const METHOD_GROUPS = [
  { id: 'card', name: B('Card', 'Tarjeta') },
  { id: 'bank', name: B('Pesos: banks and apps', 'Pesos: bancos y apps') },
  { id: 'crypto', name: B('Crypto and stablecoins', 'Cripto y stablecoins') },
  { id: 'latam', name: B('Local payments in Latin America', 'Pagos locales en Latinoamérica') },
];

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

export function bankTransferConfig(env = process.env) {
  const clabe = String(env.BANK_TRANSFER_CLABE || '').replace(/\s+/g, '');
  if (!clabeIsValid(clabe) || !env.BANK_TRANSFER_BENEFICIARY || !env.BANK_TRANSFER_BANK) return null;
  const opt = (k) => String(env[k] || '').trim() || null;
  // International wires (from outside Mexico): only when SWIFT and account number are set.
  const swift = opt('BANK_TRANSFER_SWIFT');
  const account = opt('BANK_TRANSFER_ACCOUNT');
  const international = swift && account ? { swift, account, branch: opt('BANK_TRANSFER_BRANCH'), aba: opt('BANK_TRANSFER_ABA') } : null;
  return { clabe, beneficiary: env.BANK_TRANSFER_BENEFICIARY, bank: env.BANK_TRANSFER_BANK, international };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const round2 = (n) => Math.round(n * 100) / 100;
const ceilPeso = (n) => Math.ceil(Math.round(n * 100) / 100);
const CARD_VALIDATION = {
  invalid_card: 'card_invalid', invalid_expiry: 'card_invalid_expiry', invalid_cvv: 'card_invalid_cvv',
  invalid_holder: 'card_invalid_holder', card_brand_not_supported: 'card_brand_not_supported',
};
const CARD_ERRORS = {
  insufficient_funds: 'card_insufficient_funds', expired_card: 'card_expired', invalid_cvv: 'card_invalid_cvv',
  invalid_card: 'card_invalid', invalid_expiry: 'card_invalid_expiry', processor_error: 'card_try_again', internal_error: 'card_try_again',
};

// Server-side price of `quantity` units at `rate`. Products with a fixed MXN price (Business Pass) are
// charged that exact amount; USD-priced products are converted and rounded up to the whole peso.
export function priceOf(pass, quantity, rate) {
  const taxRate = Number(pass.tax_rate || 0);
  if (pass.price_mxn != null && Number(pass.price_mxn) > 0) {
    const subtotalMxn = round2(Number(pass.price_mxn) * quantity);
    const amountMxn = ceilPeso(subtotalMxn * (1 + taxRate));
    const amountUsd = round2(amountMxn / rate);
    return { currency: 'MXN', unitUsd: round2(Number(pass.price_mxn) / rate), taxUsd: round2((amountMxn - subtotalMxn) / rate), amountUsd, amountMxn };
  }
  const unitUsd = Number(pass.price_usd);
  const subtotal = round2(unitUsd * quantity);
  const taxUsd = round2(subtotal * taxRate);
  const amountUsd = round2(subtotal + taxUsd);
  return { currency: 'USD', unitUsd, taxUsd, amountUsd, amountMxn: usdToMxn(amountUsd, rate) };
}

const PANEL_GOAL = 25;
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newTransferReference = () => `TIF${Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join('')}`;

export function createCheckout({ store, blokko, cards = null, emailDomainOk = null, env = process.env, now = () => Date.now(), sendEmail = sendTicketEmail, siteUrl = 'https://www.tuluminnovationfest.com' }) {
  const secret = env.ORDER_TOKEN_SECRET;
  const blokkoMethods = allowedMethods(env);
  const bank = bankTransferConfig(env);
  // Sandbox cards approve test numbers (4111…): never sell real tickets with them on the live site.
  const cardsLive = Boolean(cards?.configured) && !(cards.sandbox && env.VERCEL_ENV === 'production' && env.BLISSCORE_SANDBOX_IN_CHECKOUT !== 'true');

  const orderFromToken = async (token) => {
    const id = token ? openOrderToken(token, secret, { now: now() }) : null;
    const order = id ? await store.getOrder(id) : null;
    if (!order) throw new CheckoutError('order_not_found', 404);
    return order;
  };

  // Speaker Challenge: a valid code for this pass, or a CheckoutError. Never called without a code,
  // so sales without a code don't depend on the promo_codes table.
  const normCode = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  const resolvePromo = async (rawCode, passId) => {
    const code = normCode(rawCode);
    if (code.length < 3) throw new CheckoutError('promo_invalid');
    let promo = null;
    try { promo = await store.getPromoCode(code); } catch { throw new CheckoutError('promo_invalid'); }
    if (!promo || !promo.active) throw new CheckoutError('promo_invalid');
    if (passId && Array.isArray(promo.applies_to) && promo.applies_to.length && !promo.applies_to.includes(passId)) throw new CheckoutError('promo_not_applicable');
    return promo;
  };
  const discounted = (pass, pct) => ({
    ...pass,
    price_usd: round2(Number(pass.price_usd) * (1 - pct / 100)),
    price_mxn: pass.price_mxn != null && Number(pass.price_mxn) > 0 ? round2(Number(pass.price_mxn) * (1 - pct / 100)) : pass.price_mxn,
  });

  const transferInfo = (order) => (order.payment_method === 'SPEI' && order.transfer_reference && bank
    ? { reference: order.transfer_reference, clabe: bank.clabe, beneficiary: bank.beneficiary, bank: bank.bank, international: bank.international, amountMxn: Number(order.amount_mxn) }
    : null);

  const summary = (order, pass) => ({
    orderId: order.id,
    status: order.status === 'pending' && Date.parse(order.expires_at) < now() ? 'expired' : order.status,
    passId: order.pass_id,
    passName: pass?.name ?? order.pass_id,
    category: pass?.category ?? 'festival',
    issuesTickets: pass ? pass.issues_tickets !== false : true,
    quantity: order.quantity,
    subtotalUsd: round2(Number(order.amount_usd) - Number(order.tax_usd || 0)),
    taxUsd: Number(order.tax_usd || 0),
    amountUsd: Number(order.amount_usd),
    amountMxn: Number(order.amount_mxn),
    rate: Number(order.fx_usd_mxn),
    expiresAt: order.expires_at,
    pricedIn: pass?.price_mxn != null ? 'MXN' : 'USD',
    paymentMethod: order.payment_method ?? null,
    transfer: transferInfo(order),
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    promo: order.metadata?.promo ? { code: order.metadata.promo.code, speaker: order.metadata.promo.speaker, percentOff: order.metadata.promo.percent_off, listAmountMxn: order.metadata.promo.list_amount_mxn, discountMxn: order.metadata.promo.discount_mxn } : null,
  });

  // Speaker Challenge totals from paid orders only (tickets = quantity, not orders).
  async function challengeData() {
    const [codes, paid] = await Promise.all([store.listPromoCodes(), store.listPromoPaidOrders()]);
    const sold = new Map();
    for (const o of paid) {
      const t = sold.get(o.promo_code) || { tickets: 0, orders: 0, revenueMxn: 0 };
      t.tickets += Number(o.quantity) || 0; t.orders += 1; t.revenueMxn = round2(t.revenueMxn + Number(o.amount_mxn || 0));
      sold.set(o.promo_code, t);
    }
    const rows = codes.map((c) => {
      const t = sold.get(c.code) || { tickets: 0, orders: 0, revenueMxn: 0 };
      const goal = c.tier === 'A' || c.tier === 'Equipo TIF' || c.tier === 'Panel' ? null : (c.goal_tickets || null);
      return { ...c, ...t, goal, pct: goal ? Math.round(t.tickets / goal * 100) : null, courtesies: Math.floor(t.tickets / 5) };
    });
    return { rows, panelGoal: PANEL_GOAL };
  }

  async function fulfill(order) {
    if (order.status !== 'paid') return [];
    const pass = await store.getPass(order.pass_id);
    const issues = pass ? pass.issues_tickets !== false : true;
    let tickets = [];
    if (issues) {
      const rows = Array.from({ length: order.quantity }, (_, i) => {
        const id = randomUUID();
        return { id, order_id: order.id, pass_id: order.pass_id, seq: i + 1, holder_name: order.buyer_name, holder_email: order.buyer_email, token_hash: tokenHash(ticketToken(id, secret)) };
      });
      await store.insertTickets(rows);
      tickets = await store.listTickets(order.id);
    }

    if (await store.claimTicketEmail(order.id)) {
      const token = sealOrderToken(order.id, secret, { ttlSeconds: ORDER_TOKEN_TTL, now: now() });
      const message = ticketEmail({
        kind: issues ? 'tickets' : pass?.category === 'merch' ? 'pickup' : 'confirmation',
        locale: order.locale || 'es',
        orderRef: String(order.id).slice(0, 8).toUpperCase(),
        note: L(PRODUCTS[order.pass_id]?.emailNote, order.locale || 'es'),
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

  // Confirms with Blokko every QR still pending for the order (the buyer may have switched methods).
  async function checkBlokkoAttempts(order) {
    const attempts = (await store.listAttempts(order.id)).filter((a) => a.status === 'pending' && a.provider === 'blokko').slice(0, 5);
    for (const attempt of attempts) {
      let r;
      try { r = await blokko.getPaymentByMerchantTransactionId(attempt.id); } catch { continue; }
      if (r?.transactionStatus === 'E') {
        const result = await store.markOrderPaid(order.id, {
          provider: 'blokko',
          providerReference: r.transactionId ?? attempt.provider_transaction_id ?? null,
          authorizationId: r.authorizationId ?? null,
          paidAt: toUtcIso(r.completedAt) || new Date(now()).toISOString(),
        });
        await store.updateAttempt(attempt.id, { status: 'paid' });
        return result.order;
      }
      if (attempt.expires_at && Date.parse(attempt.expires_at) < now()) {
        await store.updateAttempt(attempt.id, { status: 'expired' });
        attempt.status = 'expired';
      }
    }
    return order;
  }

  function methodsFor(blokkoList) {
    const byId = new Map((Array.isArray(blokkoList) ? blokkoList : []).map((m) => [String(m.id).toUpperCase(), m]));
    const out = [];
    const push = (id, available, logoUrl = null) => {
      const info = METHOD_INFO[id] || { group: 'crypto', provider: 'blokko', name: id, hint: B('', ''), how: B('', '') };
      out.push({ id, group: info.group, provider: info.provider, name: typeof info.name === 'string' ? B(info.name, info.name) : info.name, hint: info.hint, how: info.how, logoUrl, available });
    };
    push('CARD', cardsLive); // TacPay · BlissCore: production affiliate code (sandbox only outside production)
    push('SPEI', Boolean(bank));
    for (const id of blokkoMethods) if (byId.has(id)) push(id, true, byId.get(id).logoUrl || null);
    return out;
  }

  async function payByCard(order, previous, { card, billing }) {
    if (!cardsLive) throw new CheckoutError('method_unavailable');
    if (previous.length >= MAX_ATTEMPTS) throw new CheckoutError('too_many_attempts', 429);
    if (previous.filter((a) => a.provider === 'tacpay').length >= MAX_CARD_ATTEMPTS) throw new CheckoutError('too_many_card_attempts', 429);
    const since = new Date(now() - CARD_FAILURE_WINDOW_MIN * 60 * 1000).toISOString();
    if ((await store.countFailedCardAttempts(since)) >= CARD_FAILURE_LIMIT) throw new CheckoutError('card_temporarily_unavailable', 503);

    const checked = validateCard(card || {}, { now: new Date(now()), sandbox: cards.sandbox });
    if (checked.error) throw new CheckoutError(CARD_VALIDATION[checked.error] || 'card_invalid');
    const addr = validateBilling(billing || {});
    if (addr.error) throw new CheckoutError(addr.error);

    const pass = await store.getPass(order.pass_id);
    if (order.payment_method !== 'CARD') await store.updateOrder(order.id, { payment_method: 'CARD' });
    const attempt = await store.createAttempt({
      order_id: order.id, provider: 'tacpay', payment_method_id: 'CARD', amount_mxn: order.amount_mxn,
      card_brand: checked.brand, card_last4: checked.last4,
    });

    const result = await cards.charge({
      orderId: attempt.id, // unique per attempt, as BlissCore requires
      amount: Number(order.amount_mxn),
      description: `TIF 2026 · ${pass?.name ?? order.pass_id} x${order.quantity}`,
      card: checked.card,
      customer: { name: order.buyer_name, email: order.buyer_email, phone: order.buyer_phone },
      billing: addr.billing,
    });

    if (result.outcome === 'approved') {
      const paid = await store.markOrderPaid(order.id, {
        provider: 'tacpay', providerReference: result.transactionId, authorizationId: result.authorizationCode, paidAt: new Date(now()).toISOString(),
      });
      await store.updateAttempt(attempt.id, {
        status: 'paid', provider_transaction_id: result.transactionId, authorization_code: result.authorizationCode,
        ...(paid.changed ? {} : { error_code: 'duplicate_payment', error_detail: 'Order was already paid by another method: refund from the BlissCore panel.' }),
      });
      await fulfill(paid.order);
      return { status: 'paid', kind: 'card' };
    }
    if (result.outcome === 'declined') {
      await store.updateAttempt(attempt.id, { status: 'failed', error_code: `card_${result.code}`.slice(0, 60), error_detail: result.message || null });
      throw new CheckoutError(CARD_ERRORS[result.code] || 'card_declined', 402);
    }
    await store.updateAttempt(attempt.id, { status: 'unconfirmed', error_code: `card_${result.code}`.slice(0, 60), error_detail: result.message || null });
    throw new CheckoutError('card_unconfirmed', 502);
  }

  return {
    fulfill,

    // `includePass` adds a hidden product (Whale Tank, internal test) when its direct link asks for it.
    async options({ includePass } = {}) {
      const [listed, rate] = await Promise.all([store.listPasses(), store.currentUsdMxn()]);
      const passes = [...listed];
      if (includePass && !passes.some((p) => p.id === includePass)) {
        const extra = await store.getPass(String(includePass));
        if (extra && extra.on_sale && extra.hidden) passes.push(extra);
      }
      let blokkoList = [];
      try { blokkoList = await blokko.getPaymentMethods(); } catch { blokkoList = []; }
      return {
        rate,
        categories: CATEGORIES,
        countries: countryOptions(),
        invoice: { regimes: TAX_REGIMES.map(([code, name]) => ({ code, name })), uses: CFDI_USES.map(([code, name]) => ({ code, name })) },
        methodGroups: METHOD_GROUPS,
        passes: passes.filter((p) => Number(p.price_usd) > 0 || p.price_pending).map((p) => {
          const taxRate = Number(p.tax_rate || 0);
          const pending = p.price_pending === true;
          const fixedMxn = p.price_mxn != null && Number(p.price_mxn) > 0;
          const unit = !pending && rate ? priceOf(p, 1, rate) : null;
          const priceUsd = pending ? null : fixedMxn ? unit?.unitUsd ?? null : Number(p.price_usd);
          return {
            id: p.id,
            name: p.name,
            category: p.category || 'festival',
            pricePending: pending,
            pricedIn: fixedMxn ? 'MXN' : 'USD',
            priceUsd,
            taxRate,
            totalUsd: pending ? null : unit ? unit.amountUsd : round2(Number(p.price_usd) * (1 + taxRate)),
            priceMxn: unit ? unit.amountMxn : null,
            maxQuantity: Math.min(Number(p.max_quantity || MAX_QUANTITY), MAX_QUANTITY),
            issuesTickets: p.issues_tickets !== false,
            content: PRODUCTS[p.id] || null,
          };
        }),
        methods: methodsFor(blokkoList),
      };
    },

    async createOrder(input = {}) {
      if (input.website) throw new CheckoutError('invalid_request'); // honeypot
      // Name in parts (first name, paternal and optional maternal surname); `name` kept for older clients.
      const firstName = clean(input.firstName, 60);
      const lastName1 = clean(input.lastName1, 60);
      const lastName2 = clean(input.lastName2, 60);
      const structured = Boolean(firstName || lastName1);
      if (structured && (firstName.length < 2 || lastName1.length < 2)) throw new CheckoutError(firstName.length < 2 ? 'invalid_first_name' : 'invalid_last_name');
      const name = structured ? [firstName, lastName1, lastName2].filter(Boolean).join(' ').slice(0, 120) : clean(input.name, 120);
      const email = clean(input.email, 160).toLowerCase();
      if (input.emailConfirm != null && clean(input.emailConfirm, 160).toLowerCase() !== email) throw new CheckoutError('email_mismatch');
      const phoneResult = normalizePhone(input.phoneCountry, input.phone);
      if (phoneResult.error) throw new CheckoutError('invalid_phone');
      const phone = phoneResult.phone;
      const country = phoneResult.country || clean(input.country, 60) || null;
      const company = clean(input.company, 120) || null;
      const jobTitle = clean(input.jobTitle, 120) || null;
      const invoiceResult = validateInvoice(input.invoice);
      if (invoiceResult.error) throw new CheckoutError(invoiceResult.error);
      const quantity = Number(input.quantity);
      const locale = input.locale === 'en' ? 'en' : 'es';
      if (name.length < 2) throw new CheckoutError('invalid_name');
      if (!EMAIL_RE.test(email)) throw new CheckoutError('invalid_email');
      if (emailDomainOk && !(await emailDomainOk(email))) throw new CheckoutError('invalid_email_domain');
      if (input.acceptTerms !== true) throw new CheckoutError('terms_required');

      const pass = await store.getPass(String(input.passId || ''));
      if (!pass || !pass.on_sale || !(Number(pass.price_usd) > 0)) throw new CheckoutError('pass_unavailable');
      if (pass.price_pending) throw new CheckoutError('price_pending');
      const fields = PRODUCTS[pass.id]?.fields || [];
      const business = {};
      if (fields.includes('businessName')) {
        business.name = clean(input.businessName, 120);
        if (business.name.length < 2) throw new CheckoutError('invalid_business_name');
      }
      if (fields.includes('businessAddress')) {
        business.address = clean(input.businessAddress, 200);
        if (business.address.length < 5) throw new CheckoutError('invalid_business_address');
      }
      if (fields.includes('phone') && !(phone && phone.replace(/\D/g, '').length >= 10)) throw new CheckoutError('invalid_phone');
      const maxQty = Math.min(Number(pass.max_quantity || MAX_QUANTITY), MAX_QUANTITY);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQty) throw new CheckoutError('invalid_quantity');
      const rate = await store.currentUsdMxn();
      if (!rate) throw new CheckoutError('rate_not_set', 503);

      // Pay-what-you-want products (voluntary contribution): the buyer sets the USD amount within the range.
      const custom = PRODUCTS[pass.id]?.customAmount;
      let priced = pass;
      if (custom) {
        const amount = Math.round(Number(input.amountUsd) * 100) / 100;
        if (quantity !== 1 || !Number.isFinite(amount) || amount < custom.min || amount > custom.max) throw new CheckoutError('invalid_amount');
        priced = { ...pass, price_usd: amount, price_mxn: null, tax_rate: 0 };
      }
      const rawCode = input.promoCode ?? input.attribution?.code;
      const promo = !custom && rawCode ? await resolvePromo(rawCode, pass.id) : null;
      const listPrice = promo ? priceOf(priced, quantity, rate) : null;
      if (promo) priced = discounted(priced, Number(promo.percent_off));
      const price = priceOf(priced, quantity, rate);
      const a = input.attribution || {};
      const metadata = {};
      if (promo) metadata.promo = { code: promo.code, speaker: promo.speaker_name, percent_off: Number(promo.percent_off), list_amount_mxn: listPrice.amountMxn, discount_mxn: round2(listPrice.amountMxn - price.amountMxn) };
      if (a.ref) metadata.ref = clean(a.ref, 40);
      if (Object.keys(business).length) metadata.business = business;
      if (custom) metadata.custom_amount_usd = price.unitUsd;
      if (structured) metadata.buyer = { first_name: firstName, last_name_1: lastName1, last_name_2: lastName2 || null };
      if (company) metadata.company = company;
      if (jobTitle) metadata.job_title = jobTitle;
      if (invoiceResult.invoice) metadata.invoice = invoiceResult.invoice;
      const order = await store.createOrder({
        pass_id: pass.id,
        quantity,
        unit_price_usd: price.unitUsd,
        tax_usd: price.taxUsd,
        amount_usd: price.amountUsd,
        amount_mxn: price.amountMxn,
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
        metadata,
        ...(promo ? { promo_code: promo.code } : {}),
        expires_at: new Date(now() + ORDER_TTL_MINUTES * 60 * 1000).toISOString(),
      });
      return { token: sealOrderToken(order.id, secret, { ttlSeconds: ORDER_TOKEN_TTL, now: now() }), order: summary(order, pass) };
    },

    async pay({ token, methodId, card, billing } = {}) {
      const order = await orderFromToken(token);
      if (order.status === 'paid') return { status: 'paid' };
      if (order.status !== 'pending' || Date.parse(order.expires_at) < now()) throw new CheckoutError('order_expired', 410);
      const method = String(methodId || '').toUpperCase();
      const previous = await store.listAttempts(order.id);
      // A card charge we could not confirm may have gone through: no other payment until it is checked.
      if (previous.some((a) => a.status === 'unconfirmed')) throw new CheckoutError('card_check_pending', 409);

      if (method === 'CARD') return payByCard(order, previous, { card, billing });

      if (method === 'SPEI') {
        if (!bank) throw new CheckoutError('method_unavailable');
        const firstTransfer = !order.transfer_reference;
        const updated = await store.updateOrder(order.id, {
          payment_method: 'SPEI',
          transfer_reference: order.transfer_reference || newTransferReference(),
          expires_at: new Date(now() + TRANSFER_TTL_HOURS * 3600 * 1000).toISOString(),
        });
        if (!updated) throw new CheckoutError('order_expired', 410);
        if (firstTransfer) {
          // First time this order picks a transfer: email the instructions (best effort).
          const pass = await store.getPass(order.pass_id);
          const message = transferEmail({
            locale: order.locale || 'es', name: order.buyer_name, passName: pass?.name ?? order.pass_id, quantity: order.quantity,
            transfer: transferInfo(updated), expiresAt: updated.expires_at,
            orderUrl: `${siteUrl}/checkout?t=${encodeURIComponent(sealOrderToken(order.id, secret, { ttlSeconds: ORDER_TOKEN_TTL, now: now() }))}`,
          });
          try { await sendEmail({ ...message, to: order.buyer_email, name: order.buyer_name }, { apiKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL }); } catch {}
        }
        return { status: 'pending', kind: 'transfer', methodId: 'SPEI', transfer: transferInfo(updated), expiresAt: updated.expires_at, amountMxn: Number(updated.amount_mxn) };
      }
      if (!blokkoMethods.includes(method)) throw new CheckoutError('method_not_allowed');

      if (previous.length >= MAX_ATTEMPTS) throw new CheckoutError('too_many_attempts', 429);
      if (order.payment_method !== method) await store.updateOrder(order.id, { payment_method: method });

      const attempt = await store.createAttempt({ order_id: order.id, provider: 'blokko', payment_method_id: method, amount_mxn: order.amount_mxn });
      let response;
      try {
        response = await blokko.createPaymentIntent({
          merchantTransactionId: attempt.id,
          // Blokko rejects a repeated merchantReference (100-DUPLICATED_MERCHANT_REFERENCE) when the buyer
          // switches methods, so each QR carries its own attempt id; the webhook maps it back to the order.
          merchantReference: attempt.id,
          amount: Number(order.amount_mxn).toFixed(2),
          paymentMethodId: method,
        });
      } catch (error) {
        // Keep Blokko's answer (status and message only) so failures can be diagnosed in /admin/blokko.
        const detail = error instanceof BlokkoError
          ? `${error.status} ${typeof error.body === 'object' && error.body ? (error.body.message || error.body.error || JSON.stringify(error.body)) : String(error.body || '')}`.slice(0, 500)
          : String(error?.message || error).slice(0, 500);
        await store.updateAttempt(attempt.id, { status: 'failed', error_code: error instanceof BlokkoError ? `blokko_${error.status}` : 'request_failed', error_detail: detail });
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
        kind: 'qr',
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
      let cardUnconfirmed = false;

      if (order.status === 'pending') {
        order = await checkBlokkoAttempts(order);
        if (order.status === 'pending') {
          const attempts = await store.listAttempts(order.id);
          cardUnconfirmed = attempts.some((a) => a.status === 'unconfirmed');
          const [latest] = attempts;
          if (latest && latest.status === 'pending' && latest.provider === 'blokko') {
            attemptInfo = { id: latest.id, status: latest.status, methodId: latest.payment_method_id, expiresAt: latest.expires_at, qrUrl: latest.qr_url, qrContent: latest.qr_content };
          }
        }
      }

      let ticketsReady = false;
      if (order.status === 'paid') {
        const tickets = await fulfill(order); // idempotent: repairs missing tickets or a failed email
        ticketsReady = pass?.issues_tickets === false ? true : tickets.length === order.quantity;
      }
      return { ...summary(order, pass), attempt: attemptInfo, cardUnconfirmed, ticketsReady };
    },

    async tickets({ token } = {}) {
      const order = await orderFromToken(token);
      if (order.status !== 'paid') throw new CheckoutError('not_paid', 409);
      const pass = await store.getPass(order.pass_id);
      let tickets = await store.listTickets(order.id);
      if (pass?.issues_tickets !== false && tickets.length < order.quantity) tickets = await fulfill(order);
      return {
        passName: pass?.name ?? order.pass_id,
        buyerName: order.buyer_name,
        issuesTickets: pass?.issues_tickets !== false,
        category: pass?.category || 'festival',
        quantity: order.quantity,
        orderRef: String(order.id).slice(0, 8).toUpperCase(),
        tickets: tickets.map((t) => ({ seq: t.seq, holder: t.holder_name, status: t.status, code: ticketToken(t.id, secret) })),
      };
    },

    // ---------------------------------------------------------------- admin (behind TICKETING_ADMIN_TOKEN)
    async adminOverview() {
      const [transfers, attempts, invoices] = await Promise.all([store.listTransferOrders(), store.recentAttempts(25), store.listInvoiceOrders ? store.listInvoiceOrders() : []]);
      return {
        invoices: invoices.map((o) => ({ passId: o.pass_id, quantity: o.quantity, amountMxn: Number(o.amount_mxn), buyerName: o.buyer_name, buyerEmail: o.buyer_email, paidAt: o.paid_at, ...o.metadata.invoice })),
        transfers: transfers.map((o) => ({ reference: o.transfer_reference, status: o.status, passId: o.pass_id, quantity: o.quantity, amountMxn: Number(o.amount_mxn), buyerName: o.buyer_name, buyerEmail: o.buyer_email, createdAt: o.created_at, expiresAt: o.expires_at })),
        attempts: attempts.map((a) => ({
          id: a.id,
          method: a.payment_method_id,
          status: a.status,
          amountMxn: Number(a.amount_mxn),
          card: a.card_last4 ? `${a.card_brand || ''} ····${a.card_last4}`.trim() : null,
          reference: a.provider_transaction_id || null,
          error: a.error_code ? `${a.error_code}: ${a.error_detail || ''}` : null,
          createdAt: a.created_at,
        })),
      };
    },

    // Sales admin (retroactive, straight from the orders table). Never returns card numbers: only brand + last 4.
    async adminSales({ from, to } = {}) {
      const iso = (v) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);
      const [rows, passes] = await Promise.all([store.listSales({ from: iso(from), to: iso(to) }), store.listAllPasses ? store.listAllPasses() : store.listPasses()]);
      const names = new Map(passes.map((p) => [p.id, p.name]));
      const PROCESSOR = { tacpay: 'TaakPay', blokko: 'Blokko', manual: 'Banco · SPEI' };
      const CHANNEL = {
        CARD: ['Tarjeta', 'Visa / Mastercard'], SPEI: ['Transferencia', 'SPEI · Citibanamex LGM'],
        WALL: ['Cripto', 'Stablecoin USDC / USDT · WalletConnect'], BCLN: ['Cripto', 'Bitcoin · Lightning'], CRPT: ['Cripto', 'Crypto.com'],
        CETS: ['Cripto', 'CETES tokenizados · Solana'], CASH: ['Cripto', 'Bitcoin · Cash App'],
        BTSO: ['Pesos', 'Bitso (saldo pesos o cripto)'], CODI: ['Pesos', 'CoDi · app bancaria'],
        LPIX: ['LatAm', 'PIX · Brasil'], KWCL: ['LatAm', 'Khipu · Chile'],
      };
      return rows.map((o) => {
        const attempts = (o.payment_attempts || []).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        const paidAttempt = attempts.find((a) => a.status === 'paid') || null;
        const card = attempts.find((a) => a.card_last4 && (a.status === 'paid' || o.status !== 'paid')) || null;
        const m = o.metadata || {};
        const shown = paidAttempt || attempts[0] || null;
        const provider = o.provider || shown?.provider || (o.payment_method === 'SPEI' ? 'manual' : null);
        const method = provider === 'manual' ? 'SPEI' : provider === 'tacpay' ? 'CARD' : (shown?.payment_method_id || o.payment_method || null);
        const [kind, channel] = CHANNEL[method] || [method ? 'Otro' : '—', method || '—'];
        return {
          id: o.id,
          status: o.status === 'pending' && o.expires_at && Date.parse(o.expires_at) < now() ? 'expired' : o.status,
          createdAt: o.created_at, paidAt: o.paid_at, refundedAt: o.refunded_at,
          passId: o.pass_id, passName: names.get(o.pass_id) || o.pass_id, quantity: o.quantity,
          amountUsd: Number(o.amount_usd), taxUsd: Number(o.tax_usd || 0), amountMxn: o.amount_mxn != null ? Number(o.amount_mxn) : null, rate: o.fx_usd_mxn != null ? Number(o.fx_usd_mxn) : null,
          provider, processor: PROCESSOR[provider] || '—',
          method, methodLabel: kind, channel, kind,
          paidAttemptId: paidAttempt?.id || null,
          blokkoAttemptId: (paidAttempt?.provider === 'blokko' ? paidAttempt : attempts.find((a) => a.provider === 'blokko'))?.id || null,
          reference: o.provider_reference || paidAttempt?.provider_transaction_id || o.transfer_reference || null,
          authorization: o.provider_authorization || paidAttempt?.authorization_code || null,
          processorOrderId: paidAttempt?.provider === 'tacpay' ? paidAttempt.id : null,
          card: card ? `${card.card_brand || ''} ····${card.card_last4}`.trim() : null,
          transferReference: o.transfer_reference || null,
          attempts: attempts.length,
          lastError: attempts.find((a) => a.error_code)?.error_code || null,
          tickets: (o.tickets || []).length, emailed: Boolean(o.tickets_emailed_at),
          buyerName: o.buyer_name, buyerEmail: o.buyer_email, buyerPhone: o.buyer_phone, country: o.buyer_country,
          company: m.company || null, jobTitle: m.job_title || null, business: m.business || null, invoice: m.invoice || null,
          utm: [o.utm_source, o.utm_medium, o.utm_campaign].filter(Boolean).join(' / ') || null, ref: m.ref || null,
          customAmountUsd: m.custom_amount_usd ?? null,
          promoCode: m.promo?.code || null, promoSpeaker: m.promo?.speaker || null, discountMxn: m.promo?.discount_mxn ?? null,
        };
      });
    },

    // Checks a code for the checkout UI: speaker name and discount, no internal data.
    async promo({ code, passId } = {}) {
      const promo = await resolvePromo(code, passId || null);
      return { code: promo.code, speaker: promo.speaker_name, percentOff: Number(promo.percent_off), appliesTo: promo.applies_to || [] };
    },

    // Public data for a speaker landing (/s/CODE): no email, goal or revenue.
    async speakerPage({ code } = {}) {
      const promo = await resolvePromo(code, null);
      return { code: promo.code, community: promo.tier === 'Comunidad', name: promo.speaker_name, organization: promo.organization, pillar: promo.pillar, session: promo.session, photo: promo.photo_url, percentOff: Number(promo.percent_off), appliesTo: promo.applies_to || [] };
    },

    // Public leaderboard: names, photos and paid tickets only. Tier A / TIF team only if they sold.
    async leaderboard() {
      const { rows } = await challengeData();
      const live = rows.filter((r) => r.active);
      const community = live.filter((r) => r.tier === 'Comunidad' && r.tickets > 0)
        .sort((x, y) => y.tickets - x.tickets).slice(0, 10).map((r) => ({ name: r.speaker_name, tickets: r.tickets }));
      const people = live
        .filter((r) => r.tier !== 'Panel' && r.tier !== 'Comunidad' && (r.goal || r.tickets > 0))
        .sort((x, y) => y.tickets - x.tickets || (y.pct || 0) - (x.pct || 0) || x.sort_order - y.sort_order)
        .slice(0, 15)
        .map((r) => ({ name: r.speaker_name, organization: r.organization, photo: r.photo_url, tier: r.tier, tickets: r.tickets, goal: r.goal, pct: r.pct }));
      const panels = new Map();
      for (const r of live.filter((x) => x.tier === 'Panel' && x.panel && !/por definir/i.test(x.panel))) {
        const p = panels.get(r.panel) || { name: r.panel, members: [], tickets: 0, goal: PANEL_GOAL };
        p.members.push({ name: r.speaker_name, photo: r.photo_url, tickets: r.tickets });
        p.tickets += r.tickets;
        panels.set(r.panel, p);
      }
      const total = rows.reduce((n, r) => n + r.tickets, 0);
      return { updatedAt: new Date(now()).toISOString(), totalTickets: total, people, community, panels: [...panels.values()].map((p) => ({ ...p, pct: Math.round(p.tickets / p.goal * 100) })).sort((a, b) => b.tickets - a.tickets) };
    },

    // Internal report: everything per speaker, for the admin panel and the CSV.
    async adminSpeakers() {
      const { rows } = await challengeData();
      return rows.map((r) => ({ code: r.code, name: r.speaker_name, phone: r.phone || null, source: r.source || 'admin', organization: r.organization, pillar: r.pillar, tier: r.tier, panel: r.panel, email: r.email, session: r.session, active: r.active, percentOff: Number(r.percent_off), appliesTo: r.applies_to, goal: r.goal, tickets: r.tickets, orders: r.orders, pct: r.pct, revenueMxn: r.revenueMxn, courtesies: r.courtesies }));
    },

    // Community sellers (/vende): anyone creates their own code. One code per email; the code is
    // the only thing that ever goes in a URL. Discount and attribution work like speaker codes.
    async createCommunityCode({ name, email, phone, code, website } = {}) {
      if (website) throw new CheckoutError('invalid_request');            // honeypot
      const n = String(name || '').replace(/\s+/g, ' ').trim();
      if (n.length < 3 || n.length > 60 || /https?:|www\.|[<>]/i.test(n)) throw new CheckoutError('invalid_name');
      const mail = String(email || '').trim().toLowerCase();
      if (!EMAIL_RE.test(mail) || mail.length > 120) throw new CheckoutError('invalid_email');
      if (emailDomainOk && !(await emailDomainOk(mail))) throw new CheckoutError('invalid_email_domain');
      const tel = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
      if (tel.replace(/\D/g, '').length < 8) throw new CheckoutError('invalid_phone');
      const c = normCode(code);
      if (c.length < 4 || c.length > 16) throw new CheckoutError('code_length');
      if (/^(TIF|TCF|ADMIN|TEST|FREE|GRATIS|STAFF|VIP|PRENSA|PRESS|CORTESIA|COMP)/.test(c)) throw new CheckoutError('code_reserved');
      const mine = await store.findPromoByEmail(mail);
      if (mine) throw new CheckoutError('email_has_code', 409);
      if (await store.getPromoCode(c)) throw new CheckoutError('code_taken', 409);
      let row;
      try {
        row = await store.createPromoCode({ code: c, speaker_name: n, email: mail, phone: tel, tier: 'Comunidad', source: 'self-serve', percent_off: 10, applies_to: ['general-access', 'executive-pass'], active: true, sort_order: 1000 });
      } catch (e) {
        if (e?.status === 409 || /duplicate|23505/.test(String(e?.message))) throw new CheckoutError('code_taken', 409);
        throw e;
      }
      return { code: row.code, name: row.speaker_name, percentOff: Number(row.percent_off), url: `${siteUrl}/s/${row.code}` };
    },

    // Seller control (/admin/vendedores): commission per code and a manual payout log.
    async adminSellers() {
      const [{ rows }, payouts] = await Promise.all([challengeData(), store.listPromoPayouts()]);
      const paid = new Map();
      for (const p of payouts) paid.set(p.code, round2((paid.get(p.code) || 0) + Number(p.amount_mxn)));
      return {
        sellers: rows.map((r) => {
          const pct = r.commission_pct != null ? Number(r.commission_pct) : null;
          const earned = pct != null ? round2(r.revenueMxn * pct / 100) : 0;
          const paidOut = paid.get(r.code) || 0;
          return { code: r.code, name: r.speaker_name, organization: r.organization, tier: r.tier, source: r.source || 'admin', email: r.email, phone: r.phone || null,
            active: r.active, tickets: r.tickets, orders: r.orders, revenueMxn: r.revenueMxn, commissionPct: pct, earnedMxn: earned, paidMxn: paidOut, pendingMxn: Math.max(0, round2(earned - paidOut)), createdAt: r.created_at || null };
        }),
        payouts: payouts.map((p) => ({ code: p.code, amountMxn: Number(p.amount_mxn), note: p.note || null, createdAt: p.created_at })),
      };
    },

    async setCommission({ code, tier, pct } = {}) {
      const v = pct === null || pct === '' ? null : Number(pct);
      if (v !== null && !(v >= 0 && v <= 50)) throw new CheckoutError('invalid_commission');
      if (tier) {
        const codes = (await store.listPromoCodes()).filter((c) => c.tier === tier);
        for (const c of codes) await store.updatePromoCode(c.code, { commission_pct: v });
        return { updated: codes.length, pct: v };
      }
      const row = await store.updatePromoCode(normCode(code), { commission_pct: v });
      if (!row) throw new CheckoutError('promo_invalid', 404);
      return { updated: 1, code: row.code, pct: v };
    },

    async recordPayout({ code, amountMxn, note } = {}) {
      const c = normCode(code);
      const amount = round2(Number(amountMxn));
      if (!(amount > 0)) throw new CheckoutError('invalid_amount');
      const { sellers } = await this.adminSellers();
      const s = sellers.find((x) => x.code === c);
      if (!s) throw new CheckoutError('promo_invalid', 404);
      if (amount > s.pendingMxn + 0.5) throw new CheckoutError('amount_above_pending');
      await store.createPromoPayout({ code: c, amount_mxn: amount, note: String(note || '').slice(0, 200) || null });
      return { code: c, amountMxn: amount, pendingMxn: Math.max(0, round2(s.pendingMxn - amount)) };
    },

    async adminCreateSeller({ name, code, email, phone, commissionPct } = {}) {
      const n = String(name || '').replace(/\s+/g, ' ').trim();
      if (n.length < 2 || n.length > 60) throw new CheckoutError('invalid_name');
      const c = normCode(code || n.normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')[0] + '10');
      if (c.length < 3 || c.length > 16) throw new CheckoutError('code_length');
      if (await store.getPromoCode(c)) throw new CheckoutError('code_taken', 409);
      const mail = String(email || '').trim().toLowerCase();
      if (mail && !EMAIL_RE.test(mail)) throw new CheckoutError('invalid_email');
      const pct = commissionPct === '' || commissionPct == null ? null : Number(commissionPct);
      if (pct !== null && !(pct >= 0 && pct <= 50)) throw new CheckoutError('invalid_commission');
      let row;
      try {
        row = await store.createPromoCode({ code: c, speaker_name: n, email: mail || null, phone: String(phone || '').replace(/[^\d+]/g, '').slice(0, 20) || null, tier: 'Comunidad', source: 'admin', percent_off: 10, applies_to: ['general-access', 'executive-pass'], active: true, sort_order: 1000, commission_pct: pct });
      } catch (e) {
        if (e?.status === 409 || /duplicate|23505/.test(String(e?.message))) throw new CheckoutError('code_taken', 409);
        throw e;
      }
      return { code: row.code, name: row.speaker_name, url: `${siteUrl}/s/${row.code}` };
    },

    async setPromoActive({ code, active } = {}) {
      const c = normCode(code);
      const row = await store.updatePromoCode(c, { active: active === true });
      if (!row) throw new CheckoutError('promo_invalid', 404);
      return { code: row.code, active: row.active };
    },

    // Settles a card attempt left 'unconfirmed' after checking the BlissCore panel.
    async resolveCard({ attemptId, charged, reference } = {}) {
      const attempt = await store.getAttempt(String(attemptId || ''));
      if (!attempt || attempt.provider !== 'tacpay') throw new CheckoutError('attempt_not_found', 404);
      if (attempt.status !== 'unconfirmed') throw new CheckoutError('attempt_not_unconfirmed', 409);
      if (charged !== true) {
        await store.updateAttempt(attempt.id, { status: 'failed', error_detail: `${attempt.error_detail || ''} · not charged (admin)`.slice(0, 500) });
        return { attemptId: attempt.id, status: 'failed' };
      }
      const ref = clean(reference, 80) || attempt.id;
      const result = await store.markOrderPaid(attempt.order_id, { provider: 'tacpay', providerReference: ref, paidAt: new Date(now()).toISOString() });
      await store.updateAttempt(attempt.id, { status: 'paid', provider_transaction_id: ref === attempt.id ? null : ref });
      await fulfill(result.order);
      return { attemptId: attempt.id, status: 'paid', alreadyPaid: !result.changed };
    },

    async confirmTransfer({ reference } = {}) {
      const order = await store.getOrderByTransferReference(String(reference || '').trim().toUpperCase());
      if (!order) throw new CheckoutError('order_not_found', 404);
      const result = await store.markOrderPaid(order.id, { provider: 'manual', providerReference: order.transfer_reference, paidAt: new Date(now()).toISOString() });
      await fulfill(result.order);
      return { reference: order.transfer_reference, alreadyPaid: !result.changed, buyerEmail: order.buyer_email };
    },
  };
}
