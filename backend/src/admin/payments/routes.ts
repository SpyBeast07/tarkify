import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as paymentService from './service.js';
import { paymentListParamsSchema } from './validation.js';

const payments = new Hono<AppEnv>();

payments.use('*', requireAuth, requireRole('admin'));

// GET /api/admin/payments — list payments with search, filters, pagination, sort
payments.get('/', async (c) => {
  try {
    const query = c.req.query();
    const parsed = paymentListParamsSchema.safeParse(query);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const result = await paymentService.listPayments(parsed.data);
    return c.json(result);
  } catch (err) {
    console.error('[admin/payments] Failed to list payments:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list payments', 500);
  }
});

// GET /api/admin/payments/options — get filter options
payments.get('/options', async (c) => {
  try {
    const products = await paymentService.getProductOptions();
    return c.json({ products });
  } catch (err) {
    console.error('[admin/payments] Failed to load options:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load options', 500);
  }
});

// GET /api/admin/payments/:id — get payment detail
payments.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await paymentService.getPayment(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Payment not found', 404);
    }
    return c.json(data);
  } catch (err) {
    console.error('[admin/payments] Failed to get payment:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get payment', 500);
  }
});

export default payments;
