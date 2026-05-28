/**
 * Product Service
 *
 * Central authority for all product-related operations.
 * Every feature — payments, subscriptions, downloads, invoices —
 * asks this service about products rather than reading JSON or hardcoding values.
 *
 * The database is the source of truth for pricing.
 */

import { query } from '../db.js';
import type { Product } from '../types/index.js';

/**
 * Get a product by slug. Returns null if not found.
 */
export async function getProduct(slug: string): Promise<Product | null> {
  const result = await query<Product>(
    'SELECT * FROM products WHERE slug = $1',
    [slug]
  );
  return result.rows[0] ?? null;
}

/**
 * Get a product by its internal UUID. Returns null if not found.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const result = await query<Product>(
    'SELECT * FROM products WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

/**
 * Get an active product by slug. Returns null if not found or inactive.
 * This is the primary method used during checkout — inactive products
 * cannot be purchased.
 */
export async function getActiveProduct(slug: string): Promise<Product | null> {
  const result = await query<Product>(
    'SELECT * FROM products WHERE slug = $1 AND active = true',
    [slug]
  );
  return result.rows[0] ?? null;
}

/**
 * List all active products.
 */
export async function listActiveProducts(): Promise<Product[]> {
  const result = await query<Product>(
    'SELECT * FROM products WHERE active = true ORDER BY created_at ASC'
  );
  return result.rows;
}

/**
 * Validate that a product exists and can be purchased.
 */
export async function validateProduct(slug: string): Promise<{
  valid: boolean;
  product: Product | null;
  reason?: string;
}> {
  const product = await getProduct(slug);

  if (!product) {
    return { valid: false, product: null, reason: 'Product not found' };
  }

  if (!product.active) {
    return { valid: false, product, reason: 'Product is not available for purchase' };
  }

  return { valid: true, product };
}

/**
 * Get the authoritative price for a product.
 * Returns null if the product doesn't exist or is inactive.
 */
export async function getPrice(
  slug: string
): Promise<{ amount: number; currency: string } | null> {
  const product = await getActiveProduct(slug);
  if (!product) return null;
  return { amount: product.price, currency: product.currency };
}

/**
 * Get the download key for a product.
 * The download key maps to the storage directory: storage/products/{download_key}/
 * Returns null if the product has no downloadable content.
 */
export async function getDownloadKey(slug: string): Promise<string | null> {
  const product = await getActiveProduct(slug);
  if (!product) return null;
  return product.download_key;
}

/**
 * Check if a product is active and available.
 */
export async function isActive(slug: string): Promise<boolean> {
  const product = await getProduct(slug);
  return product !== null && product.active;
}
