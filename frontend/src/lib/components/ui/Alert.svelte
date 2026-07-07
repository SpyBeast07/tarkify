<script lang="ts">
	import { type Snippet } from 'svelte';
	import { AlertTriangle, CheckCircle, Info, X } from '@lucide/svelte';

	interface Props {
		type: 'error' | 'success' | 'warning' | 'info';
		dismissible?: boolean;
		onDismiss?: () => void;
		class?: string;
		children?: Snippet;
	}

	let { type, dismissible = false, onDismiss, class: className = '', children }: Props = $props();

	const iconMap = {
		error: AlertTriangle,
		success: CheckCircle,
		warning: AlertTriangle,
		info: Info
	};

	let IconComp = $derived(iconMap[type]);
</script>

<div class="form-alert form-alert-{type} {className}" role={type === 'error' ? 'alert' : 'status'}>
	<IconComp size={16} aria-hidden="true" />
	<span>
		{#if children}
			{@render children()}
		{/if}
	</span>
	{#if dismissible}
		<button class="alert-dismiss" onclick={onDismiss} aria-label="Dismiss">
			<X size={14} />
		</button>
	{/if}
</div>

<style>
	.form-alert {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.form-alert span {
		flex: 1;
	}

	.form-alert-error {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.form-alert-success {
		background-color: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #22c55e;
	}

	.form-alert-warning {
		background-color: rgba(251, 191, 36, 0.1);
		border: 1px solid rgba(251, 191, 36, 0.3);
		color: #f59e0b;
	}

	.form-alert-info {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		color: #3b82f6;
	}

	.alert-dismiss {
		background: none;
		border: none;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: opacity 0.2s ease;
	}

	.alert-dismiss:hover {
		opacity: 1;
	}
</style>
