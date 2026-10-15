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

    // Health check: confirms the key works and the migration ran. Returns counts only, no rows.
    async healthCheck() {
      const passes = await request('GET', 'passes?select=id,on_sale');
      const checks = {};
      for (const table of ['orders', 'tickets', 'payment_events', 'webhook_nonces', 'resellers', 'staff']) {
        await request('GET', `${table}?select=*&limit=0`);
        checks[table] = 'ok';
      }
      return { passes: passes.length, passesOnSale: passes.filter((p) => p.on_sale).length, tables: checks };
    },

    // Used by checkout (next step): store the invoice returned by Blokko on the order.
    async attachBlokkoInvoice(orderId, { invoiceNumber, hash, invoiceUrl }) {
      const rows = await request('PATCH', `orders?id=${eq(orderId)}&status=eq.pending`, {
        prefer: 'return=representation',
        body: { provider: 'blokko', blokko_invoice_number: invoiceNumber, blokko_invoice_hash: hash ?? null, blokko_invoice_url: invoiceUrl ?? null },
      });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    },
  };
}
