// Store factory. The Supabase store (orders, tickets, payment_events, nonces) is the next
// step; until its credentials exist, endpoints that need persistence answer 503 instead of
// accepting a payment they cannot record.

export class StoreNotConfiguredError extends Error {
  constructor() {
    super('Ticketing database is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    this.name = 'StoreNotConfiguredError';
  }
}

export async function getStore(env = process.env) {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createSupabaseStore } = await import('./supabase-store.mjs');
    return createSupabaseStore(env);
  }
  throw new StoreNotConfiguredError();
}
