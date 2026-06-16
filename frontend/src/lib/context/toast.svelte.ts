import { browser } from '$app/environment';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

let toastId = 0;

export function createToastState() {
	let toasts = $state<Toast[]>([]);

	function addToast(message: string, type: ToastType = 'info', duration: number = 4000) {
		const id = `toast-${++toastId}`;
		toasts = [...toasts, { id, message, type, duration }];

		if (browser && duration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, duration);
		}
	}

	function removeToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	return {
		get toasts() {
			return toasts;
		},
		addToast,
		removeToast
	};
}
