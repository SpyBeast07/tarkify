/**
 * CORS Middleware
 *
 * Configures Cross-Origin Resource Sharing for the frontend origin.
 */

import { cors } from 'hono/cors';
import { config } from '../config.js';

export const corsMiddleware = cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5173',
      'https://tarkify.qzz.io',
      'http://tarkify.qzz.io',
      config.frontendUrl,
    ];
    if (allowed.includes(origin)) {
      return origin;
    }
    // Return default origin for other cases
    return config.frontendUrl;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
