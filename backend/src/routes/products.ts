/**
 * Product Routes
 *
 * GET /api/products        — List all active products
 * GET /api/products/:slug  — Get a single product by slug
 *
 * The database is the source of truth for product info and pricing.
 * The frontend should fetch product data from here instead of
 * relying on static JSON files.
 */

import { Hono } from 'hono';
import * as productService from '../services/product.service.js';
import type { ProductResponse } from '../types/index.js';

const products = new Hono();

/**
 * List all active products.
 */
products.get('/', async (c) => {
  const activeProducts = await productService.listActiveProducts();

  const response: ProductResponse[] = activeProducts.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    type: p.type,
    price: p.price,
    currency: p.currency,
  }));

  return c.json({ products: response });
});

/**
 * Get a single product by slug.
 */
products.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const product = await productService.getActiveProduct(slug);

  if (!product) {
    return c.json(
      { error: 'NOT_FOUND', message: 'Product not found' },
      404
    );
  }

  const response: ProductResponse = {
    slug: product.slug,
    name: product.name,
    description: product.description,
    type: product.type,
    price: product.price,
    currency: product.currency,
  };

  return c.json({ product: response });
});

export default products;
