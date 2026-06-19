/**
 * CORS Middleware
 *
 * Configures Cross-Origin Resource Sharing for the frontend origin.
 */

import { cors } from 'hono/cors';
import { config } from '../config.js';

export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return '*';

    const allowed = [
      'http://localhost:5173',
      'https://tarkify.qzz.io',
      'http://tarkify.qzz.io',
      config.frontendUrl,
    ];

    // Remove trailing slash from config URL for consistent matching
    const normalizedOrigins = allowed.map((o) => o.replace(/\/+$/, ''));

    if (normalizedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return origin;
    }

    // Reject unknown origins — do NOT return a fallback origin.
    // Returning a fallback tells the browser to accept the response,
    // which defeats the purpose of CORS.
    return null;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});
