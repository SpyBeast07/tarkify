<script lang="ts">
	import { type Snippet } from 'svelte';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		onconfirm?: () => void;
		oncancel?: () => void;
		variant?: 'primary' | 'danger';
		children?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		message = '',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		onconfirm,
		oncancel,
		variant = 'primary',
		children
	}: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open) {
			dialogEl?.showModal();
		} else {
			dialogEl?.close();
		}
	});

	function handleClose() {
		open = false;
		oncancel?.();
	}

	function handleConfirm() {
		open = false;
		onconfirm?.();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	class="dialog-element glass"
	onclose={handleClose}
	onclick={(e) => {
		if (e.target === dialogEl) {
			open = false;
		}
	}}
>
	<div class="dialog-content">
		<h3 class="dialog-title">{title}</h3>
		{#if message}
			<p class="dialog-message">{message}</p>
		{/if}
		{#if children}
			<div class="dialog-custom-content">
				{@render children()}
			</div>
		{/if}
		<div class="dialog-actions">
			<Button variant="ghost" onclick={handleClose}>{cancelText}</Button>
			<Button variant={variant === 'danger' ? 'danger' : 'primary'} onclick={handleConfirm}>
				{confirmText}
			</Button>
		</div>
	</div>
</dialog>

<style>
	.dialog-element {
		border: 1px solid var(--color-glass-border);
		border-radius: 20px;
		padding: 2rem;
		max-width: 450px;
		width: calc(100% - 2rem);
		color: var(--color-text);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
	}

	.dialog-element::backdrop {
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(6px);
	}

	.dialog-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 0;
		margin-bottom: 0.75rem;
	}

	.dialog-message {
		font-size: 0.95rem;
		opacity: 0.85;
		line-height: 1.5;
		margin-bottom: 1.75rem;
	}

	.dialog-custom-content {
		margin-bottom: 1.75rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}
</style>
