import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as productService from './service.js';
import { createProductSchema, updateProductSchema } from './validation.js';
import type { ProductStatus, ProductVisibility } from './types.js';
import { AppError } from './service.js';

const products = new Hono<AppEnv>();

products.use('*', requireAuth, requireRole('admin'));

// GET /api/admin/products — list with search, filters, pagination, sort
products.get('/', async (c) => {
  try {
    const query = c.req.query();
    const params = {
      search: query.search || undefined,
      status: (query.status || undefined) as ProductStatus | undefined,
      visibility: (query.visibility || undefined) as ProductVisibility | undefined,
      category: query.category || undefined,
      sort: (query.sort || 'newest') as 'newest' | 'oldest' | 'updated' | 'price' | 'name',
      page: query.page ? parseInt(query.page, 10) : 1,
      perPage: query.perPage ? parseInt(query.perPage, 10) : 20,
    };
    const result = await productService.listProducts(params);
    return c.json(result);
  } catch (err) {
    console.error('[admin/products] Failed to list products:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list products', 500);
  }
});

// GET /api/admin/products/categories — list all categories
products.get('/categories', async (c) => {
  try {
    const categories = await productService.getCategories();
    return c.json({ categories });
  } catch (err) {
    console.error('[admin/products] Failed to list categories:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list categories', 500);
  }
});

// GET /api/admin/products/:id — get product by id
products.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = await productService.getProduct(id);
    if (!product) {
      return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
    }
    const audit = await productService.getProductAudit(id);
    return c.json({ product, audit });
  } catch (err) {
    console.error('[admin/products] Failed to get product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get product', 500);
  }
});

// POST /api/admin/products — create product
products.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }

    const user = c.get('user');
    const product = await productService.createProduct(
      parsed.data,
      user!.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );

    return c.json({ product }, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(c, err.code, err.message, err.status as ContentfulStatusCode);
    }
    console.error('[admin/products] Failed to create product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create product', 500);
  }
});

// PUT /api/admin/products/:id — update product
products.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }

    const user = c.get('user');
    const product = await productService.updateProduct(
      id,
      parsed.data,
      user!.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );

    if (!product) {
      return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
    }

    return c.json({ product });
  } catch (err) {
    if (err instanceof AppError) {
      return errorResponse(c, err.code, err.message, err.status as ContentfulStatusCode);
    }
    console.error('[admin/products] Failed to update product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update product', 500);
  }
});

// POST /api/admin/products/:id/publish — publish product
products.post('/:id/publish', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const product = await productService.publishProduct(
      id,
      user!.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );

    if (!product) {
      return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
    }

    return c.json({ product });
  } catch (err) {
    console.error('[admin/products] Failed to publish product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to publish product', 500);
  }
});

// POST /api/admin/products/:id/unpublish — unpublish product
products.post('/:id/unpublish', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const product = await productService.unpublishProduct(
      id,
      user!.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );

    if (!product) {
      return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
    }

    return c.json({ product });
  } catch (err) {
    console.error('[admin/products] Failed to unpublish product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to unpublish product', 500);
  }
});

// POST /api/admin/products/:id/archive — archive product
products.post('/:id/archive', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const product = await productService.archiveProduct(
      id,
      user!.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );

    if (!product) {
      return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
    }

    return c.json({ product });
  } catch (err) {
    console.error('[admin/products] Failed to archive product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to archive product', 500);
  }
});

// POST /api/admin/products/:id/restore — restore archived product
products.post('/:id/restore', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const product = await productService.restoreProduct(
      id,
      user!.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );

    if (!product) {
      return errorResponse(c, 'NOT_FOUND', 'Product not found', 404);
    }

    return c.json({ product });
  } catch (err) {
    console.error('[admin/products] Failed to restore product:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to restore product', 500);
  }
});

export default products;
