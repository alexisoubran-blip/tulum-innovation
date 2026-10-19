// In-memory store used by tests and local runs. Production uses the Supabase store
// (same method names) so the webhook logic does not change.

import { randomUUID } from 'node:crypto';

export function createMemoryStore({ orders = [], passes = [], rate = null } = {}) {
  const state = {
    orders: new Map(orders.map((o) => [o.id, { status: 'pending', ...o }])),
    nonces: new Set(),
    events: [],
    passes: new Map(passes.map((p) => [p.id, { on_sale: true, ...p }])),
    attempts: [],
    tickets: [],
    rate,
  };
  return {
    state,
    async claimNonce(nonce) {
      if (state.nonces.has(nonce)) return false;
      state.nonces.add(nonce);
      return true;
    },
    async releaseNonce(nonce) {
      state.nonces.delete(nonce);
    },
    async recordPaymentEvent(record) {
      state.events.push(record);
    },
    async findOrderForBlokkoEvent(event) {
      for (const order of state.orders.values()) {
        if (event.merchantReference && order.id === event.merchantReference) return order;
        const attempt = state.attempts.find((a) => [event.merchantReference, event.merchantTransactionId].includes(a.id) || (event.transactionUuid && a.provider_transaction_id === event.transactionUuid));
        if (attempt && attempt.order_id === order.id) return order;
        if (event.merchantId && order.id === event.merchantId) return order;
        if (event.invoiceNumber && order.blokkoInvoiceNumber === event.invoiceNumber) return order;
        if (order.blokkoTransactionUuid && order.blokkoTransactionUuid === event.transactionUuid) return order;
      }
      return null;
    },
    async markOrderPaid(orderId, info) {
      const order = state.orders.get(orderId);
      if (!order) throw new Error(`Order ${orderId} not found`);
      if (order.status === 'paid') return { changed: false, order };
      Object.assign(order, { status: 'paid', ...info, provider_reference: order.provider_reference ?? info.providerReference ?? null, paid_at: info.paidAt ?? new Date().toISOString() });
      return { changed: true, order };
    },
    async currentUsdMxn() { return state.rate; },
    async listPasses() { return [...state.passes.values()].filter((p) => p.on_sale && !p.hidden); },
    async getPass(id) { return state.passes.get(id) ?? null; },
    async createOrder(row) {
      const order = { id: randomUUID(), status: 'pending', created_at: new Date().toISOString(), tickets_emailed_at: null, paid_at: null, provider_reference: null, ...row };
      if (!order.expires_at) order.expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      state.orders.set(order.id, order);
      return order;
    },
    async getOrder(id) { return state.orders.get(id) ?? null; },
    async updateOrder(id, patch) {
      const order = state.orders.get(id);
      if (!order || order.status !== 'pending') return null;
      Object.assign(order, patch);
      return order;
    },
    async getOrderByTransferReference(reference) { return [...state.orders.values()].find((o) => o.transfer_reference === reference) ?? null; },
    async listTransferOrders() { return [...state.orders.values()].filter((o) => o.payment_method === 'SPEI'); },
    async listInvoiceOrders() { return [...state.orders.values()].filter((o) => o.status === 'paid' && o.metadata?.invoice); },
    async recentAttempts(limit = 25) { return [...state.attempts].reverse().slice(0, limit); },
    async getAttempt(id) { return state.attempts.find((a) => a.id === id) ?? null; },
    async countFailedCardAttempts(sinceIso) { return state.attempts.filter((a) => a.provider === 'tacpay' && a.status === 'failed' && a.created_at >= sinceIso).length; },
    async createAttempt(row) {
      const attempt = { id: randomUUID(), status: 'pending', created_at: new Date(Date.now() + state.attempts.length).toISOString(), ...row };
      state.attempts.push(attempt);
      return attempt;
    },
    async updateAttempt(id, patch) {
      const attempt = state.attempts.find((a) => a.id === id);
      if (attempt) Object.assign(attempt, patch);
      return attempt ?? null;
    },
    async listAttempts(orderId) { return state.attempts.filter((a) => a.order_id === orderId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)); },
    async insertTickets(rows) {
      for (const row of rows) {
        if (!state.tickets.some((t) => t.order_id === row.order_id && t.seq === row.seq)) state.tickets.push({ status: 'valid', ...row });
      }
    },
    async listTickets(orderId) { return state.tickets.filter((t) => t.order_id === orderId).sort((a, b) => a.seq - b.seq); },
    async claimTicketEmail(orderId) {
      const order = state.orders.get(orderId);
      if (!order || order.tickets_emailed_at) return false;
      order.tickets_emailed_at = new Date().toISOString();
      return true;
    },
    async releaseTicketEmail(orderId) { const order = state.orders.get(orderId); if (order) order.tickets_emailed_at = null; },
  };
}
