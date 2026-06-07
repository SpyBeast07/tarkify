/**
 * Razorpay Checkout Service
 *
 * Handles dynamic loading of the Razorpay checkout script
 * and opening the checkout modal.
 *
 * Isolated from page components — payment logic does not
 * belong inside Svelte components.
 */

import type {
	RazorpayCheckoutOptions,
	RazorpayPaymentResponse,
	RazorpayInstance,
	CreateOrderResponse
} from '$lib/types/payment';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

/**
 * Dynamically load the Razorpay checkout script.
 * Only loads once — subsequent calls return immediately.
 */
export function loadRazorpayScript(): Promise<void> {
	if (scriptLoaded) return Promise.resolve();
	if (scriptLoading) return scriptLoading;

	scriptLoading = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = RAZORPAY_SCRIPT_URL;
		script.async = true;
		script.onload = () => {
			scriptLoaded = true;
			resolve();
		};
		script.onerror = () => {
			scriptLoading = null;
			reject(new Error('Failed to load Razorpay checkout script'));
		};
		document.head.appendChild(script);
	});

	return scriptLoading;
}

/**
 * Open the Razorpay Checkout modal with an order.
 *
 * @param order - The order response from the backend
 * @param email - Customer email to prefill
 * @param onSuccess - Called when payment succeeds
 * @param onDismiss - Called when user closes the modal without paying
 */
export async function openCheckout(
	order: CreateOrderResponse,
	email: string,
	onSuccess: (response: RazorpayPaymentResponse) => void,
	onDismiss: () => void
): Promise<RazorpayInstance> {
	await loadRazorpayScript();

	if (!window.Razorpay) {
		throw new Error('Razorpay SDK not available');
	}

	const options: RazorpayCheckoutOptions = {
		key: order.key,
		amount: order.amount,
		currency: order.currency,
		name: 'Tarkify',
		description: `Purchase ${order.productName}`,
		order_id: order.orderId,
		prefill: {
			email
		},
		theme: {
			color: '#273b09'
		},
		handler: onSuccess,
		modal: {
			ondismiss: onDismiss
		}
	};

	const razorpay = new window.Razorpay(options);
	razorpay.open();
	return razorpay;
}
