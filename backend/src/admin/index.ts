import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth.js';
import dashboard from './dashboard/routes.js';
import products from './products/routes.js';
import orders from './orders/routes.js';
import payments from './payments/routes.js';
import customers from './customers/routes.js';
import downloads from './downloads/routes.js';
import communication from './communication/routes.js';
import email from './email/routes.js';
import analytics from './analytics/routes.js';
import system from './system/routes.js';
import settings from './settings/routes.js';
import audit from './audit/routes.js';
import search from './search/routes.js';

const admin = new Hono();

admin.use('*', requireAuth, requireRole('admin'));

admin.route('/dashboard', dashboard);
admin.route('/products', products);
admin.route('/orders', orders);
admin.route('/payments', payments);
admin.route('/customers', customers);
admin.route('/downloads', downloads);
admin.route('/communication', communication);
admin.route('/email', email);
admin.route('/analytics', analytics);
admin.route('/system', system);
admin.route('/settings', settings);
admin.route('/audit', audit);
admin.route('/search', search);

export default admin;
