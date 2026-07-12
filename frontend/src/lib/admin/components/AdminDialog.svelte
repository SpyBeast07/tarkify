<script lang="ts">
	import { type Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'danger';
		disabled?: boolean;
		children?: Snippet;
		footer?: Snippet;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(),
		title,
		message = '',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'primary',
		disabled = false,
		children,
		footer,
		onconfirm,
		oncancel
	}: Props = $props();

	function handleClose() {
		if (disabled) return;
		open = false;
		oncancel?.();
	}

	function handleConfirm() {
		if (disabled) return;
		onconfirm?.();
	}
</script>

{#if open}
	<div
		class="admin-dialog-backdrop"
		transition:fade={{ duration: 150 }}
		onclick={handleClose}
		role="presentation"
	>
		<div
			class="admin-dialog-container glass"
			transition:fly={{ y: 15, duration: 250 }}
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
		>
			<div class="admin-dialog-header">
				<h2 id="dialog-title" class="admin-dialog-title">{title}</h2>
			</div>

			<div class="admin-dialog-body">
				{#if message}
					<p class="admin-dialog-message">{message}</p>
				{/if}
				{#if children}
					{@render children()}
				{/if}
			</div>

			<div class="admin-dialog-footer">
				{#if footer}
					{@render footer()}
				{:else}
					<Button variant="ghost" size="sm" onclick={handleClose} disabled={disabled}>
						{cancelText}
					</Button>
					<Button variant={variant} size="sm" onclick={handleConfirm} disabled={disabled}>
						{confirmText}
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-dialog-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 20, 0, 0.4);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.admin-dialog-container {
		width: 100%;
		max-width: 480px;
		border-radius: 20px;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.admin-dialog-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--color-glass-border);
	}

	.admin-dialog-title {
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--color-primary-green);
		margin: 0;
	}

	.admin-dialog-body {
		padding: 1.5rem;
		font-size: 0.925rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.admin-dialog-message {
		margin: 0;
		opacity: 0.85;
	}

	.admin-dialog-footer {
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-top: 1px solid var(--color-glass-border);
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	@media (max-width: 480px) {
		.admin-dialog-backdrop {
			padding: 1rem;
		}

		.admin-dialog-footer {
			flex-direction: column-reverse;
			align-items: stretch;
		}

		.admin-dialog-footer :global(.btn) {
			width: 100%;
		}
	}
</style>
