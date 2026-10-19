// Supabase store for ticketing: same interface as memory-store.mjs, backed by the tables in
// supabase/migrations/20261015000000_ticketing_core.sql through the PostgREST Data API.
//
// Server-only. It uses the service_role / secret key, which bypasses RLS, so it must never be
// imported by browser code. No npm dependency: plain fetch.
//
// Rows come back as the database returns them (snake_case: id, status, blokko_invoice_number…).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SupabaseStoreError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'SupabaseStoreError';
    this.status = status;
    this.code = code;
  }
}

export function createSupabaseStore(env = process.env, { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const baseUrl = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) throw new SupabaseStoreError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

  // Legacy service_role keys are JWTs and go in both headers. The newer sb_secret_ keys are
  // not JWTs and are sent only as apikey.
  const authHeaders = { apikey: key };
  if (key.startsWith('eyJ')) authHeaders.Authorization = `Bearer ${key}`;

  async function request(method, path, { body, prefer } = {}) {
    const headers = { ...authHeaders, Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (prefer) headers.Prefer = prefer;
    const response = await fetchImpl(`${baseUrl}/rest/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }
    if (!response.ok) {
      // Only PostgREST's error code and message; never the key or the request body.
      const code = data?.code;
      throw new SupabaseStoreError(`Supabase ${method} ${path.split('?')[0]} failed (${response.status}${code ? ` ${code}` : ''}): ${data?.message || 'no message'}`, { status: response.status, code });
    }
    return data;
  }

  const eq = (value) => `eq.${encodeURIComponent(value)}`;

  async function findOne(filter) {
    const rows = await request('GET', `orders?select=*&${filter}&limit=1`);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  return {
    async claimNonce(nonce, provider = 'blokko') {
      try {
        await request('POST', 'webhook_nonces', { body: { nonce, provider }, prefer: 'return=minimal' });
        return true;
      } catch (error) {
        if (error.status === 409 || error.code === '23505') return false;
        throw error;
      }
    },

    async releaseNonce(nonce) {
      await request('DELETE', `webhook_nonces?nonce=${eq(nonce)}`, { prefer: 'return=minimal' });
    },

    async recordPaymentEvent(record) {
      await request('POST', 'payment_events', {
        prefer: 'return=minimal',
        body: {
          provider: record.provider,
          reference: record.reference ?? null,
          status: record.status ?? null,
          order_id: record.orderId ?? null,
          payload: record.payload ?? {},
          received_at: record.receivedAt ?? new Date().toISOString(),
        },
      });
    },

    // Matching order: our order id travels as merchantReference (payment intents) or merchantId;
    // invoice payments match on the invoice number we stored when creating the invoice; a retry
    // after a first match finds the order by Blokko's transactionUuid.
    async findOrderForBlokkoEvent(event) {
      for (const candidate of [event.merchantReference, event.merchantId]) {
        if (candidate && UUID_RE.test(candidate)) {
          const order = await findOne(`id=${eq(candidate)}`);
          if (order) return order;
        }
      }
      if (event.invoiceNumber) {
        const order = await findOne(`blokko_invoice_number=${eq(event.invoiceNumber)}`);
        if (order) return order;
      }
      if (event.transactionUuid) {
        const order = await findOne(`provider=eq.blokko&provider_reference=${eq(event.transactionUuid)}`);
        if (order) return order;
      }
      return null;
    },

    async markOrderPaid(orderId, info) {
      const rows = await request('POST', 'rpc/mark_order_paid', {
        body: {
          p_order_id: orderId,
          p_provider: info.provider,
          p_reference: info.providerReference ?? null,
          p_authorization: info.authorizationId ?? null,
          p_paid_at: info.paidAt ?? new Date().toISOString(),
        },
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row || !row.order_row) throw new SupabaseStoreError(`mark_order_paid returned no row for ${orderId}`);
      return { changed: row.changed === true, order: row.order_row };
    },

    // TIF's current USD → MXN rate, or null if none is set yet.
    async currentUsdMxn() {
      const value = await request('POST', 'rpc/current_usd_mxn', { body: {} });
      return value === null || value === undefined ? null : Number(value);
    },

    // Health check: confirms the key works and the migration ran. Returns counts only, no rows.
    async healthCheck() {
      const passes = await request('GET', 'passes?select=id,on_sale');
      const checks = {};
      for (const table of ['orders', 'tickets', 'payment_events', 'webhook_nonces', 'resellers', 'staff', 'payment_attempts', 'exchange_rates']) {
        await request('GET', `${table}?select=*&limit=0`);
        checks[table] = 'ok';
      }
      const rate = await this.currentUsdMxn();
      return { passes: passes.length, passesOnSale: passes.filter((p) => p.on_sale).length, usdMxnRateSet: rate !== null, tables: checks };
    },

    // ---------------------------------------------------------------- checkout
    async listPasses() {
      return request('GET', 'passes?select=*&on_sale=is.true&hidden=is.false&order=sort_order.asc');
    },

    async getPass(id) {
      const rows = await request('GET', `passes?select=*&id=${eq(id)}&limit=1`);
      return rows?.[0] ?? null;
    },

    async createOrder(row) {
      const rows = await request('POST', 'orders', { body: row, prefer: 'return=representation' });
      return rows[0];
    },

    async getOrder(id) {
      if (!UUID_RE.test(String(id))) return null;
      return findOne(`id=${eq(id)}`);
    },

    // Only pending orders change (payment method, transfer reference, expiry).
    async updateOrder(id, patch) {
      const rows = await request('PATCH', `orders?id=${eq(id)}&status=eq.pending`, { body: patch, prefer: 'return=representation' });
      return rows?.[0] ?? null;
    },

    async getOrderByTransferReference(reference) {
      if (!/^TIF[A-Z0-9]{6}$/.test(reference)) return null;
      return findOne(`transfer_reference=${eq(reference)}`);
    },

    async listTransferOrders() {
      return request('GET', 'orders?select=id,status,pass_id,quantity,amount_mxn,buyer_name,buyer_email,transfer_reference,created_at,expires_at&payment_method=eq.SPEI&order=created_at.desc&limit=50');
    },

    async listInvoiceOrders() {
      return request('GET', 'orders?select=id,status,pass_id,quantity,amount_mxn,buyer_name,buyer_email,buyer_phone,metadata,paid_at,created_at&metadata->invoice=not.is.null&status=eq.paid&order=paid_at.desc&limit=100');
    },

    async recentAttempts(limit = 25) {
      return request('GET', `payment_attempts?select=id,provider,payment_method_id,status,amount_mxn,card_brand,card_last4,provider_transaction_id,error_code,error_detail,created_at&order=created_at.desc&limit=${Number(limit) || 25}`);
    },

    async getAttempt(id) {
      if (!UUID_RE.test(String(id))) return null;
      const rows = await request('GET', `payment_attempts?select=*&id=${eq(id)}&limit=1`);
      return rows?.[0] ?? null;
    },

    // Declined card attempts site-wide since `sinceIso` (circuit breaker against card testing).
    async countFailedCardAttempts(sinceIso) {
      const rows = await request('GET', `payment_attempts?select=id&provider=eq.tacpay&status=eq.failed&created_at=gte.${encodeURIComponent(sinceIso)}&limit=200`);
      return Array.isArray(rows) ? rows.length : 0;
    },

    async createAttempt(row) {
      const rows = await request('POST', 'payment_attempts', { body: row, prefer: 'return=representation' });
      return rows[0];
    },

    async updateAttempt(id, patch) {
      const rows = await request('PATCH', `payment_attempts?id=${eq(id)}`, { body: patch, prefer: 'return=representation' });
      return rows?.[0] ?? null;
    },

    async listAttempts(orderId) {
      return request('GET', `payment_attempts?select=*&order_id=${eq(orderId)}&order=created_at.desc`);
    },

    // Inserts tickets; rows whose (order_id, seq) already exist are skipped, so issuing is idempotent.
    async insertTickets(rows) {
      if (!rows.length) return;
      await request('POST', 'tickets?on_conflict=order_id,seq', { body: rows, prefer: 'resolution=ignore-duplicates,return=minimal' });
    },

    async listTickets(orderId) {
      return request('GET', `tickets?select=id,order_id,pass_id,seq,holder_name,holder_email,status,issued_at,checked_in_at&order_id=${eq(orderId)}&order=seq.asc`);
    },

    // Claims the right to email the tickets: true only for the first caller.
    async claimTicketEmail(orderId) {
      const rows = await request('PATCH', `orders?id=${eq(orderId)}&tickets_emailed_at=is.null`, {
        body: { tickets_emailed_at: new Date().toISOString() },
        prefer: 'return=representation',
      });
      return Array.isArray(rows) && rows.length > 0;
    },

    async releaseTicketEmail(orderId) {
      await request('PATCH', `orders?id=${eq(orderId)}`, { body: { tickets_emailed_at: null }, prefer: 'return=minimal' });
    },
  };
}
