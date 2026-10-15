// USD → MXN at the rate TIF sets (public.exchange_rates). Blokko charges in MXN.
// Rounded UP to the whole peso so the amount received never falls below the USD price.

export class ExchangeRateMissingError extends Error {
  constructor() {
    super('No USD→MXN exchange rate is set (add a row to public.exchange_rates)');
    this.name = 'ExchangeRateMissingError';
  }
}

export function usdToMxn(amountUsd, rate) {
  const usd = Number(amountUsd);
  const fx = Number(rate);
  if (!(fx > 0)) throw new ExchangeRateMissingError();
  if (!(usd > 0)) throw new Error('Amount must be greater than 0');
  // Work in cents to avoid floating point drift (218 × 18.5 must be exactly 4033).
  const cents = Math.round(usd * 100) * Math.round(fx * 10000) / 10000;
  return Math.ceil(Math.round(cents) / 100);
}
