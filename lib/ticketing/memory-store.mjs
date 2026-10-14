// In-memory store used by tests and local runs. Production uses the Supabase store
// (same method names) so the webhook logic does not change.

export function createMemoryStore({ orders = [] } = {}) {
  const state = {
    orders: new Map(orders.map((o) => [o.id, { status: 'pending', ...o }])),
    nonces: new Set(),
    events: [],
  };
  return {
    state,
    async claimNonce(nonce) {
      if (state.nonces.has(nonce)) return false;
      state.nonces.add(nonce);
      return true;
    },
    async recordPaymentEvent(record) {
      state.events.push(record);
    },
    async findOrderForBlokkoEvent(event) {
      for (const order of state.orders.values()) {
        if (event.merchantReference && order.id === event.merchantReference) return order;
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
      Object.assign(order, { status: 'paid', ...info });
      return { changed: true, order };
    },
  };
}
