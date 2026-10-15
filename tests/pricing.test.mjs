import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usdToMxn, ExchangeRateMissingError } from '../lib/ticketing/pricing.mjs';

test('USD → MXN rounds up to the whole peso, exactly', () => {
  assert.equal(usdToMxn(218, 18.5), 4033);
  assert.equal(usdToMxn(770.40, 18.5), 14253);   // 14252.40 → 14253
  assert.equal(usdToMxn(1590, 18.4321), 29308);  // 29307.039 → 29308
  assert.equal(usdToMxn(109, '18.50'), 2017);    // 2016.5 → 2017
});

test('no rate or bad amounts fail loudly', () => {
  assert.throws(() => usdToMxn(218, null), ExchangeRateMissingError);
  assert.throws(() => usdToMxn(0, 18.5));
});
