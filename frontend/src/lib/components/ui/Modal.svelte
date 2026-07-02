<script lang="ts">
	import { type Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { X } from '@lucide/svelte';

	interface Props {
		show: boolean;
		title?: string;
		closeOnBackdrop?: boolean;
		class?: string;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		show = $bindable(false),
		title = '',
		closeOnBackdrop = true,
		class: className = '',
		children,
		footer
	}: Props = $props();

	function close() {
		show = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (closeOnBackdrop && e.target === e.currentTarget) {
			close();
		}
	}

	$effect(() => {
		if (show) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (show && e.key === 'Escape') {
			close();
		}
	}}
/>

{#if show}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" transition:fade={{ duration: 200 }} onclick={handleBackdropClick}>
		<!-- Modal Content Sheet -->
		<div
			class="modal-card {className}"
			transition:fly={{ y: 30, duration: 300 }}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="modal-header">
				{#if title}
					<h3 class="modal-title">{title}</h3>
				{:else}
					<div></div>
				{/if}
				<button class="modal-close-btn" onclick={close} aria-label="Close modal">
					<X size={20} />
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				{#if children}
					{@render children()}
				{/if}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}

	.modal-card {
		width: 100%;
		max-width: 550px;
		border-radius: 24px;
		display: flex;
		flex-direction: column;
		max-height: 90vh;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		background: var(--color-light-bg);
		border: 1px solid var(--color-glass-border);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.75rem;
		border-bottom: 1px solid var(--color-glass-border);
	}

	.modal-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.modal-close-btn {
		background: transparent;
		border: none;
		color: var(--color-text);
		opacity: 0.6;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close-btn:hover {
		opacity: 1;
		background-color: var(--color-glass-bg);
	}

	.modal-body {
		padding: 1.75rem;
		overflow-y: auto;
		flex: 1;
		color: var(--color-text);
	}

	.modal-footer {
		padding: 1.25rem 1.75rem;
		border-top: 1px solid var(--color-glass-border);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		background: rgba(0, 0, 0, 0.02);
	}

	:global([data-theme='dark']) .modal-footer {
		background: rgba(255, 255, 255, 0.02);
	}
</style>
