import { cors } from 'hono/cors';
import { config } from '../config.js';

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return origin;

    const allowed = [
      'http://localhost:5173',
      'https://tarkify.qzz.io',
      'http://tarkify.qzz.io',
      config.frontendUrl,
    ];

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const normalizedOrigins = allowed.map((o) => o.replace(/\/+$/, ''));

    if (normalizedOrigins.includes(normalizedOrigin)) {
      return origin;
    }

    if (/^https:\/\/.+\.vercel\.app$/.test(normalizedOrigin)) {
      return origin;
    }

    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  credentials: true,
});
