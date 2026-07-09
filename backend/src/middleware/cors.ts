import { cors } from 'hono/cors';
import { config } from '../config.js';

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return origin;

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const normalizedAllowed = config.frontendUrl.replace(/\/+$/, '');

    if (normalizedOrigin === normalizedAllowed) {
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
