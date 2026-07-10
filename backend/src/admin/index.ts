import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth.js';
import dashboard from './dashboard/routes.js';
import products from './products/routes.js';
import orders from './orders/routes.js';
import payments from './payments/routes.js';
import customers from './customers/routes.js';

const admin = new Hono();

admin.use('*', requireAuth, requireRole('admin'));

admin.route('/dashboard', dashboard);
admin.route('/products', products);
admin.route('/orders', orders);
admin.route('/payments', payments);
admin.route('/customers', customers);

export default admin;
