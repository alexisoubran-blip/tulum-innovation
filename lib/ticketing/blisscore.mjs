// TacPay card payments through the BlissCore API (Guía de Integración BlissCore v2.1).
//
// One endpoint, one synchronous call: POST {base}/payments/affiliate/payment with the affiliate_code
// in the body. HTTP 200 for approved AND declined (read `success`), 400 for validation errors,
// 500 for processor/internal errors. Only Mexican Visa and Mastercard, MXN only, min 1.00 MXN.
// No status-query endpoint and no refunds API (refunds are done in the BlissCore panel).
//
// Card data passes through this server only in memory: it is never stored, logged or echoed back.

export const SANDBOX_BASE_URL = 'https://sandbox.blisscorepay.cloud';
export const PRODUCTION_BASE_URL = 'https://api-prod.blisscorepay.cloud';
export const PAYMENT_PATH = '/payments/affiliate/payment';
export const TIMEOUT_MS = 30_000;

// Declines that must not be retried with the same card (guide, page 4).
export const FINAL_DECLINES = new Set(['card_declined', 'insufficient_funds', 'expired_card', 'invalid_card', 'invalid_cvv', 'invalid_expiry', 'invalid_amount', 'missing_fields']);
// Temporary errors: the charge did not go through and the buyer may try again.
export const TEMPORARY_ERRORS = new Set(['processor_error', 'internal_error']);

export function configFromEnv(env = process.env) {
  const affiliateCode = String(env.BLISSCORE_AFFILIATE_CODE || '').trim();
  return {
    baseUrl: String(env.BLISSCORE_BASE_URL || SANDBOX_BASE_URL).replace(/\/+$/, ''),
    affiliateCode,
    configured: affiliateCode.length > 0,
    get sandbox() { return this.baseUrl === SANDBOX_BASE_URL; },
  };
}

// ---------------------------------------------------------------- card validation (before calling BlissCore)
const digits = (v) => String(v ?? '').replace(/[\s-]/g, '');

export function luhn(number) {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let d = number.charCodeAt(i) - 48;
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(number) {
  if (!/^\d{16}$/.test(number)) return null;
  if (number[0] === '4') return 'visa';
  const p2 = Number(number.slice(0, 2));
  const p4 = Number(number.slice(0, 4));
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return 'mastercard';
  return null;
}

// Returns { card } normalised for BlissCore, or { error } with a field-specific code.
// `sandbox` skips the Luhn check: BlissCore's decline test cards (…1112, …1113, …4445) fail it on purpose.
export function validateCard(input = {}, { now = new Date(), sandbox = false } = {}) {
  const number = digits(input.number);
  if (!/^\d{16}$/.test(number) || (!sandbox && !luhn(number))) return { error: 'invalid_card' };
  const brand = cardBrand(number);
  if (!brand) return { error: 'card_brand_not_supported' };

  const month = Number(digits(input.expMonth));
  let year = Number(digits(input.expYear));
  if (year < 100) year += 2000;
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) return { error: 'invalid_expiry' };
  const endOfMonth = Date.UTC(year, month, 1); // first instant after the expiry month
  if (endOfMonth <= now.getTime() || year > now.getUTCFullYear() + 20) return { error: 'invalid_expiry' };

  const cvv = digits(input.cvv);
  if (!/^\d{3}$/.test(cvv)) return { error: 'invalid_cvv' };

  const holderName = String(input.holderName ?? '').trim().replace(/\s+/g, ' ').toUpperCase().slice(0, 80);
  if (holderName.length < 3) return { error: 'invalid_holder' };

  return {
    card: { number, exp_month: String(month).padStart(2, '0'), exp_year: String(year), cvv, holder_name: holderName },
    brand,
    last4: number.slice(-4),
  };
}

const text = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export function validateBilling(input = {}) {
  const billing = {
    street: text(input.street, 120),
    city: text(input.city, 80),
    state: text(input.state, 80),
    country: 'MX',
    postal_code: digits(input.postalCode),
  };
  if (billing.street.length < 3 || billing.city.length < 2 || billing.state.length < 2) return { error: 'invalid_billing' };
  if (!/^\d{5}$/.test(billing.postal_code)) return { error: 'invalid_postal_code' };
  return { billing };
}

// ---------------------------------------------------------------- client
export class BlissCoreError extends Error {
  constructor(message, { status = null, code = null } = {}) {
    super(message);
    this.name = 'BlissCoreError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Charges a card. Resolves to one of:
 *   { outcome: 'approved', transactionId, authorizationCode, processorTransactionId, amount }
 *   { outcome: 'declined', code, message, retryable }   (no money moved)
 *   { outcome: 'unknown', code, message }                (timeout / unreadable answer: verify in the panel)
 * Throws BlissCoreError only when the integration is not configured.
 */
export function createClient(config, { fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS } = {}) {
  return {
    configured: Boolean(config?.configured),
    sandbox: Boolean(config?.sandbox),

    async charge({ orderId, amount, description, card, customer, billing }) {
      if (!config?.configured) throw new BlissCoreError('BlissCore is not configured (BLISSCORE_AFFILIATE_CODE)');
      const body = {
        affiliate_code: config.affiliateCode,
        order_id: String(orderId).slice(0, 50),
        amount: Math.round(Number(amount) * 100) / 100,
        currency: 'MXN',
        description: String(description || '').slice(0, 120),
        card,
        customer: {
          name: String(customer?.name || '').slice(0, 120),
          email: String(customer?.email || '').slice(0, 160),
          ...(customer?.phone ? { phone: String(customer.phone).replace(/[^\d+]/g, '').slice(0, 20) } : {}),
        },
        billing_address: billing,
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res;
      try {
        res = await fetchImpl(`${config.baseUrl}${PAYMENT_PATH}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'TulumInnovationFest/1.0' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        // Timeout or network failure after the request may have reached the processor.
        // Node's fetch hides the reason in error.cause (DNS, refused connection, TLS certificate…).
        const cause = error?.cause ? [error.cause.code, error.cause.message].filter(Boolean).join(' ') : '';
        return { outcome: 'unknown', code: error?.name === 'AbortError' ? 'timeout' : 'network_error', message: `${String(error?.message || error)}${cause ? ` · ${cause}` : ''}`.slice(0, 300) };
      } finally {
        clearTimeout(timer);
      }

      let data = null;
      try { data = await res.json(); } catch { data = null; }

      if (data && data.success === true && String(data.status || '').toLowerCase() === 'approved' && data.transaction_id) {
        return {
          outcome: 'approved',
          transactionId: String(data.transaction_id),
          authorizationCode: data.authorization_code ? String(data.authorization_code) : null,
          processorTransactionId: data.selia_transaction_id ? String(data.selia_transaction_id) : null,
          amount: Number(data.amount ?? body.amount),
        };
      }
      const code = String(data?.error?.code || '').toLowerCase() || null;
      const message = String(data?.error?.message || '').slice(0, 200);
      if (data && data.success === false && code) {
        if (code === 'timeout') return { outcome: 'unknown', code, message };
        return { outcome: 'declined', code, message, retryable: TEMPORARY_ERRORS.has(code), httpStatus: res.status };
      }
      if (res.status >= 400 && res.status < 500) return { outcome: 'declined', code: code || `http_${res.status}`, message, retryable: false, httpStatus: res.status };
      // 5xx without a clear answer, or a 200 we cannot read: the charge may or may not exist.
      return { outcome: 'unknown', code: code || `http_${res.status}`, message };
    },
  };
}
