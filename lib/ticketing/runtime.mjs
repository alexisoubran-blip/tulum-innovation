// Wiring for Vercel functions: store + Blokko client + checkout service, and JSON helpers.

import { getStore, StoreNotConfiguredError } from './store.mjs';
import { configFromEnv, createClient } from './blokko.mjs';
import { createCheckout, CheckoutError } from './checkout.mjs';
import { LGM_BANK_ENV } from './bank-account.mjs';
import { configFromEnv as cardsConfigFromEnv, createClient as createCardsClient } from './blisscore.mjs';

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

export async function getCheckout() {
  const store = await getStore();
  const blokko = createClient(configFromEnv());
  const cards = createCardsClient(cardsConfigFromEnv());
  return createCheckout({ store, blokko, cards, env: { ...LGM_BANK_ENV, ...process.env } });
}

// Runs a checkout action and maps known errors to clean JSON; unknown errors never leak details.
export async function handle(fn) {
  try {
    return json(200, { ok: true, ...(await fn(await getCheckout())) });
  } catch (error) {
    if (error instanceof CheckoutError) return json(error.status, { ok: false, error: error.code });
    if (error instanceof StoreNotConfiguredError) return json(503, { ok: false, error: 'store_not_configured' });
    console.error('[checkout]', error?.name, error?.message);
    return json(500, { ok: false, error: 'internal_error' });
  }
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}
