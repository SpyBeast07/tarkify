import { describe, it, expect } from 'bun:test';
import { computePricing, TAX_RATE } from '../src/services/pricing.js';

describe('computePricing', () => {
  it('returns base amount unchanged when tax is disabled', () => {
    const p = computePricing(2900, false);
    expect(p.baseAmount).toBe(2900);
    expect(p.taxAmount).toBe(0);
    expect(p.totalAmount).toBe(2900);
    expect(p.taxEnabled).toBe(false);
    expect(p.taxRate).toBe(0);
  });

  it('applies 18% GST when tax is enabled', () => {
    const p = computePricing(2900, true);
    expect(p.baseAmount).toBe(2900);
    expect(p.taxAmount).toBe(522); // round(2900 * 0.18)
    expect(p.totalAmount).toBe(3422);
    expect(p.taxEnabled).toBe(true);
    expect(p.taxRate).toBe(TAX_RATE);
  });

  it('rounds tax to the nearest paise', () => {
    const p = computePricing(1000, true);
    expect(p.taxAmount).toBe(180);
    expect(p.totalAmount).toBe(1180);
  });
});
