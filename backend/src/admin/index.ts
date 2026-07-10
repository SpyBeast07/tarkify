import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth.js';
import dashboard from './dashboard/routes.js';
import products from './products/routes.js';

const admin = new Hono();

admin.use('*', requireAuth, requireRole('admin'));

admin.route('/dashboard', dashboard);
admin.route('/products', products);

export default admin;
