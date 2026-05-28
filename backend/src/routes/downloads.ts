/**
 * Download Routes
 *
 * GET /api/downloads/:productSlug — Serve product downloads to entitled users
 *
 * Generic endpoint — works for any product with a download_key.
 * Downloads are served from private versioned storage.
 * The URL never exposes the actual file path.
 */

import { Hono } from 'hono';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { stat } from 'fs/promises';
import * as productService from '../services/product.service.js';
import * as purchaseService from '../services/purchase.service.js';
import { config } from '../config.js';

const downloads = new Hono();

/**
 * Resolve the latest version file from the product's storage directory.
 * Files are expected to follow semver naming: v1.0.0.zip, v1.0.1.zip, etc.
 * Returns the path to the latest version, or null if no files exist.
 */
function resolveLatestDownload(downloadKey: string): string | null {
  const productDir = join(config.storagePath, 'products', downloadKey);

  if (!existsSync(productDir)) {
    return null;
  }

  const files = readdirSync(productDir)
    .filter((f) => f.endsWith('.zip'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  return join(productDir, files[0]);
}

downloads.get('/:productSlug', async (c) => {
  const productSlug = c.req.param('productSlug');
  const email = c.req.query('email');

  // Validate email is provided
  if (!email) {
    return c.json(
      { error: 'UNAUTHORIZED', message: 'Email is required to verify ownership' },
      401
    );
  }

  // Get the product's download key from ProductService
  const product = await productService.getActiveProduct(productSlug);
  if (!product) {
    return c.json(
      { error: 'NOT_FOUND', message: 'Product not found' },
      404
    );
  }

  if (!product.download_key) {
    return c.json(
      { error: 'NOT_FOUND', message: 'No download available for this product' },
      404
    );
  }

  // Verify ownership via entitlement
  const hasAccess = await purchaseService.hasEntitlement(email, product.id);
  if (!hasAccess) {
    return c.json(
      { error: 'FORBIDDEN', message: 'You do not own this product. Please purchase it first.' },
      403
    );
  }

  // Resolve the latest download file from versioned storage
  const filePath = resolveLatestDownload(product.download_key);
  if (!filePath) {
    console.error(`No download files found for product: ${productSlug} (key: ${product.download_key})`);
    return c.json(
      { error: 'FILE_NOT_FOUND', message: 'Download file is not available. Please contact support.' },
      500
    );
  }

  try {
    const fileStat = await stat(filePath);
    const file = Bun.file(filePath);
    const fileName = `${productSlug}-latest.zip`;

    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
    c.header('Content-Length', fileStat.size.toString());
    c.header('Cache-Control', 'no-store');

    return new Response(file.stream(), {
      headers: c.res.headers,
    });
  } catch (error) {
    console.error('Failed to serve download:', error);
    return c.json(
      { error: 'DOWNLOAD_FAILED', message: 'Failed to serve download. Please try again.' },
      500
    );
  }
});

export default downloads;
