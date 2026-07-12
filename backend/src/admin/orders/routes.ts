import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as orderService from './service.js';
import { orderListParamsSchema } from './validation.js';

const orders = new Hono<AppEnv>();

orders.use('*', requireAuth, requireRole('admin'));

// GET /api/admin/orders — list orders with search, filters, pagination, sort
orders.get('/', async (c) => {
  try {
    const query = c.req.query();
    const parsed = orderListParamsSchema.safeParse(query);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const result = await orderService.listOrders(parsed.data);
    return c.json(result);
  } catch (err) {
    console.error('[admin/orders] Failed to list orders:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list orders', 500);
  }
});

// GET /api/admin/orders/options — get filter options (products, statuses)
orders.get('/options', async (c) => {
  try {
    const [products, statuses] = await Promise.all([
      orderService.getProductOptions(),
      orderService.getAllStatuses(),
    ]);
    return c.json({ products, statuses });
  } catch (err) {
    console.error('[admin/orders] Failed to load options:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load options', 500);
  }
});

// GET /api/admin/orders/:id — get order detail
orders.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await orderService.getOrder(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Order not found', 404);
    }
    return c.json(data);
  } catch (err) {
    console.error('[admin/orders] Failed to get order:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get order', 500);
  }
});

export default orders;
