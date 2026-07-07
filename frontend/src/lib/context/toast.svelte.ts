import { browser } from '$app/environment';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

let toastId = 0;

export type ToastState = ReturnType<typeof createToastState>;

export function createToastState() {
	let toasts = $state<Toast[]>([]);
	const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

	function addToast(message: string, type: ToastType = 'info', duration: number = 4000) {
		const id = `toast-${++toastId}`;
		toasts = [...toasts, { id, message, type, duration }];

		if (browser && duration > 0) {
			const timeout = setTimeout(() => {
				removeToast(id);
			}, duration);
			timeouts.set(id, timeout);
		}
	}

	function removeToast(id: string) {
		const timeout = timeouts.get(id);
		if (timeout) {
			clearTimeout(timeout);
			timeouts.delete(id);
		}
		toasts = toasts.filter((t) => t.id !== id);
	}

	function destroy() {
		for (const timeout of timeouts.values()) {
			clearTimeout(timeout);
		}
		timeouts.clear();
		toasts = [];
	}

	return {
		get toasts() {
			return toasts;
		},
		addToast,
		removeToast,
		destroy
	};
}
