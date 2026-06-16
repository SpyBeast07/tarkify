/**
 * Download Routes
 *
 * GET /api/downloads/:productSlug?token=<download_token>
 *
 * Serves product downloads to customers who hold a valid download token.
 * The token was issued by POST /api/payments/verify after successful payment.
 *
 * Security:
 * - No email parameter. Ownership is proved by the token.
 * - Token is validated server-side: existence + expiry + product match.
 * - Filesystem paths are never exposed.
 * - Files are version-sorted using semantic versioning (v10 > v2).
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
 * Parse a semver-like filename (e.g. "v1.10.2.zip") into numeric parts
 * for correct version comparison.
 * Files that do not match the pattern sort to the bottom.
 */
function parseSemver(filename: string): [number, number, number] {
  const match = filename.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Resolve the latest version file from the product's storage directory.
 * Files are expected to follow semver naming: v1.0.0.zip, v1.0.1.zip, etc.
 * Returns the absolute path to the latest version, or null if no files exist.
 *
 * FIXED: uses numeric semver comparison so v10.0.0 > v2.0.0.
 */
function resolveLatestDownload(downloadKey: string): string | null {
  const productDir = join(config.storagePath, 'products', downloadKey);

  if (!existsSync(productDir)) {
    return null;
  }

  const files = readdirSync(productDir)
    .filter((f) => f.endsWith('.zip'))
    .sort((a, b) => {
      const [aMaj, aMin, aPatch] = parseSemver(a);
      const [bMaj, bMin, bPatch] = parseSemver(b);
      if (bMaj !== aMaj) return bMaj - aMaj;
      if (bMin !== aMin) return bMin - aMin;
      return bPatch - aPatch;
    });

  if (files.length === 0) return null;

  return join(productDir, files[0]);
}

downloads.get('/:productSlug', async (c) => {
  const productSlug = c.req.param('productSlug');
  const token = c.req.query('token');

  // Token is required — no email fallback.
  if (!token) {
    return c.json(
      { error: 'UNAUTHORIZED', message: 'A valid download token is required.' },
      401
    );
  }

  // Validate token: existence + expiry check (single DB query).
  const tokenRecord = await purchaseService.validateDownloadToken(token);
  if (!tokenRecord) {
    return c.json(
      { error: 'UNAUTHORIZED', message: 'Download token is invalid or has expired.' },
      401
    );
  }

  // Get the product by slug to resolve the download_key.
  const product = await productService.getActiveProduct(productSlug);
  if (!product) {
    return c.json(
      { error: 'NOT_FOUND', message: 'Product not found' },
      404
    );
  }

  // Cross-check: the token must belong to this product.
  // This prevents a token issued for product A from downloading product B.
  if (tokenRecord.product_id !== product.id) {
    return c.json(
      { error: 'FORBIDDEN', message: 'This token is not valid for the requested product.' },
      403
    );
  }

  if (!product.download_key) {
    return c.json(
      { error: 'NOT_FOUND', message: 'No download available for this product' },
      404
    );
  }

  // Resolve the latest download file using semver-correct ordering.
  const filePath = resolveLatestDownload(product.download_key);
  if (!filePath) {
    console.error(
      `No download files found for product slug=${productSlug} download_key=${product.download_key}`
    );
    return c.json(
      { error: 'FILE_NOT_FOUND', message: 'Download file is not available. Please contact support.' },
      500
    );
  }

  try {
    const fileStat = await stat(filePath);
    const file = Bun.file(filePath);
    // Sanitize the slug before using it in Content-Disposition to prevent
    // header injection attacks (CWE-93). Strip all non-alphanumeric chars
    // except hyphen and underscore.
    const safeSlug = productSlug.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${safeSlug}-latest.zip`;

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
