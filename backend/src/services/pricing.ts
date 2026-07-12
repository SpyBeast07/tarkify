/**
 * Pricing & tax calculation — single shared source of truth.
 *
 * All tax math happens here so the Razorpay order amount, the stored
 * purchase totals, the receipt, and the admin/customer displays all agree.
 */

/** GST rate applied when tax is enabled (18%). */
export const TAX_RATE = 0.18;

export const TAX_LABEL = 'GST (18%)';

export interface Pricing {
  /** Base product price in the smallest currency unit (paise). */
  baseAmount: number;
  /** Tax in the smallest currency unit (paise). 0 when tax is disabled. */
  taxAmount: number;
  /** Final amount charged to the customer (base + tax), in paise. */
  totalAmount: number;
  /** The effective tax rate (0 when disabled). */
  taxRate: number;
  /** Whether tax was applied. */
  taxEnabled: boolean;
}

/**
 * Compute the pricing breakdown for a base amount.
 *
 * @param baseAmount - Product price in the smallest currency unit (paise).
 * @param taxEnabled - Whether GST should be applied.
 */
export function computePricing(baseAmount: number, taxEnabled: boolean): Pricing {
  const taxAmount = taxEnabled ? Math.round(baseAmount * TAX_RATE) : 0;
  return {
    baseAmount,
    taxAmount,
    totalAmount: baseAmount + taxAmount,
    taxRate: taxEnabled ? TAX_RATE : 0,
    taxEnabled,
  };
}
