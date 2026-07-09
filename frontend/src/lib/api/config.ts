const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3009';
export const API_BASE = rawUrl.replace(/\/+$/, '');
export const AUTH_BASE = `${API_BASE}/api/auth`;
