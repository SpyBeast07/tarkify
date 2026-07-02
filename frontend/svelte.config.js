import adapter from '@sveltejs/adapter-vercel';
import { loadEnv } from 'vite';

// Load environment variables based on NODE_ENV (defaults to development)
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const apiUrl = env.VITE_API_URL || 'http://localhost:3009';

// Extract the host origin from VITE_API_URL safely
let apiOrigin = '';
try {
	const parsedUrl = new URL(apiUrl);
	apiOrigin = parsedUrl.origin;
} catch {
	apiOrigin = apiUrl;
}

// Build connect-src directive values
const connectSrc = ["'self'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'];
if (apiOrigin) {
	connectSrc.push(apiOrigin);
}
if (isDev) {
	// Allow dev-server HMR websockets and local endpoints
	connectSrc.push('ws://localhost:*');
	connectSrc.push('ws://127.0.0.1:*');
	connectSrc.push('http://localhost:*');
	connectSrc.push('http://127.0.0.1:*');
}

// Build script-src directive values
const scriptSrc = ["'self'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'];
if (isDev) {
	// Vite development requires unsafe-eval/unsafe-inline to compile templates and apply hot-reload
	scriptSrc.push("'unsafe-inline'");
	scriptSrc.push("'unsafe-eval'");
}

export default {
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ["'self'"],
				'script-src': scriptSrc,
				'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
				'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
				'img-src': ["'self'", 'data:', 'blob:'],
				'connect-src': connectSrc,
				'frame-src': ["'self'", 'https://checkout.razorpay.com', 'https://*.razorpay.com'],
				'object-src': ["'none'"],
				'base-uri': ["'self'"],
				'form-action': ["'self'"],
				'frame-ancestors': ["'none'"]
			}
		}
	},
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	}
};
