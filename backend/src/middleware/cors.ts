/**
 * CORS Middleware
 *
 * Configures Cross-Origin Resource Sharing for the frontend origin.
 */

import { cors } from 'hono/cors';
import { config } from '../config.js';

export const corsMiddleware = cors({
  origin: config.frontendUrl,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
