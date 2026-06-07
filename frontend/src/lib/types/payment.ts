/**
 * Payment-related TypeScript types for the frontend.
 * Mirrors the backend API contracts.
 */

export interface CreateOrderResponse {
	orderId: string;
	amount: number;
	currency: string;
	key: string;
	productName: string;
}

export interface VerifyPaymentResponse {
	success: boolean;
	message: string;
	/** Secure time-limited token to authorise the download. */
	downloadToken?: string;
}

export interface PaymentError {
	error: string;
	message: string;
}

export type PurchaseFlowState =
	| 'idle'
	| 'collecting_email'
	| 'creating_order'
	| 'checkout_open'
	| 'verifying'
	| 'success'
	| 'error'
	| 'cancelled';

export interface RazorpayCheckoutOptions {
	key: string;
	amount: number;
	currency: string;
	name: string;
	description: string;
	order_id: string;
	prefill?: {
		email?: string;
	};
	theme?: {
		color?: string;
	};
	handler: (response: RazorpayPaymentResponse) => void;
	modal?: {
		ondismiss?: () => void;
	};
}

export interface RazorpayPaymentResponse {
	razorpay_order_id: string;
	razorpay_payment_id: string;
	razorpay_signature: string;
}

/**
 * Global Razorpay type declaration for the checkout script.
 */
export interface RazorpayInstance {
	open: () => void;
	close: () => void;
}

export interface RazorpayConstructor {
	new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

declare global {
	interface Window {
		Razorpay: RazorpayConstructor;
	}
}
