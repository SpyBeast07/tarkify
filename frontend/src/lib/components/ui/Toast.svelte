<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from '@lucide/svelte';
	import type { Toast as ToastType } from '$lib/context/toast.svelte';

	const toastState = getContext<{
		toasts: ToastType[];
		removeToast: (id: string) => void;
	}>('toast');

	const iconMap = {
		success: CheckCircle,
		error: AlertCircle,
		info: Info,
		warning: AlertTriangle
	};

	const colorMap = {
		success: 'toast-success',
		error: 'toast-error',
		info: 'toast-info',
		warning: 'toast-warning'
	};
</script>

{#if toastState?.toasts.length}
	<div class="toast-container" aria-live="polite" aria-relevant="additions removals">
		{#each toastState.toasts as toast (toast.id)}
			{@const IconComp = iconMap[toast.type]}
			<div
				class="toast-item {colorMap[toast.type]}"
				transition:fly={{ x: 20, duration: 300 }}
				role="status"
			>
				{#if IconComp}
					<IconComp size={18} class="toast-icon" />
				{/if}
				<span class="toast-message">{toast.message}</span>
				<button
					class="toast-close"
					onclick={() => toastState.removeToast(toast.id)}
					aria-label="Dismiss notification"
				>
					<X size={16} />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 400px;
		pointer-events: none;
	}

	.toast-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.125rem;
		border-radius: 12px;
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
		border: 1px solid var(--color-glass-border);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		pointer-events: auto;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.toast-icon {
		flex-shrink: 0;
	}

	.toast-success {
		border-left: 4px solid #10b981;
	}

	.toast-error {
		border-left: 4px solid #ef4444;
	}

	.toast-info {
		border-left: 4px solid #3b82f6;
	}

	.toast-warning {
		border-left: 4px solid #f59e0b;
	}

	.toast-message {
		flex: 1;
		line-height: 1.4;
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--color-text);
		opacity: 0.5;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.2s;
	}

	.toast-close:hover {
		opacity: 1;
	}
</style>
