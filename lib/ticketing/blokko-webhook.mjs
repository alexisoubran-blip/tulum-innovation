// Blokko webhook handling, kept independent from the HTTP runtime so it can be tested.
//
// Contract (docs "Webhook Definition"): Blokko POSTs the transaction; we must answer 200,
// otherwise it retries at 0s, 30s, 60s and 90s. So:
//   - a bad signature or malformed payload → 401/400 (Blokko retries; nothing is recorded as paid)
//   - an event we already processed → 200 (idempotent, no second ticket)
//   - an order we cannot match → 200 + alert (retrying would not help; a human reviews it)
//   - a store failure → 500 (let Blokko retry)

import { verifyIncoming, parseWebhookPayload, STATUS } from './blokko.mjs';

/**
 * @param {object} req  { method, path, query, rawBody, headers }  headers keys lower-cased
 * @param {object} deps { config, store, onPaid?, alert?, now? }
 *   store.claimNonce(nonce) → Promise<boolean>   true if the nonce is new
 *   store.recordPaymentEvent(record) → Promise<void>
 *   store.findOrderForBlokkoEvent(event) → Promise<order|null>
 *   store.markOrderPaid(orderId, info) → Promise<{ changed: boolean, order }>
 */
export async function handleBlokkoWebhook(req, deps) {
  const { config, store, onPaid = async () => {}, alert = async () => {}, now = Date.now() } = deps;

  // The nonce is checked against the persistent store below (serverless instances share no memory).
  const verification = verifyIncoming(config, {
    method: req.method,
    path: req.path,
    query: req.query || '',
    rawBody: req.rawBody || '',
    headerValue: req.headers['blokko-signature'],
    now,
  });
  if (!verification.ok) {
    await alert({ type: 'blokko_webhook_rejected', reason: verification.reason });
    return { status: 401, body: { ok: false, error: verification.reason } };
  }

  const parsed = parseWebhookPayload(req.rawBody);
  if (!parsed.ok) {
    await alert({ type: 'blokko_webhook_invalid', reason: parsed.reason });
    return { status: 400, body: { ok: false, error: parsed.reason } };
  }
  const { event } = parsed;

  try {
    if (!(await store.claimNonce(verification.nonce))) {
      return { status: 200, body: { ok: true, duplicate: true } };
    }
    await store.recordPaymentEvent({ provider: 'blokko', reference: event.transactionUuid, status: event.status, payload: event, receivedAt: new Date(now).toISOString() });

    if (event.status !== STATUS.EXECUTED) {
      return { status: 200, body: { ok: true, status: 'pending' } };
    }

    const order = await store.findOrderForBlokkoEvent(event);
    if (!order) {
      await alert({ type: 'blokko_payment_unmatched', transactionUuid: event.transactionUuid, merchantReference: event.merchantReference, invoiceNumber: event.invoiceNumber });
      return { status: 200, body: { ok: true, matched: false } };
    }

    const result = await store.markOrderPaid(order.id, {
      provider: 'blokko',
      providerReference: event.transactionUuid,
      authorizationId: event.authorizationId,
      paidAt: event.completedAt || new Date(now).toISOString(),
    });
    if (result.changed) await onPaid(result.order);
    return { status: 200, body: { ok: true, orderId: order.id, alreadyPaid: !result.changed } };
  } catch (error) {
    await alert({ type: 'blokko_webhook_error', message: error.message });
    return { status: 500, body: { ok: false, error: 'internal_error' } };
  }
}
