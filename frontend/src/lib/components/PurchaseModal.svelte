<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { CheckCircle, AlertCircle, Loader, X, Mail, ShoppingBag } from '@lucide/svelte';
	import { createOrder, verifyPayment } from '$lib/api/payments';
	import { openCheckout } from '$lib/services/razorpay';
	import type { PurchaseFlowState, RazorpayPaymentResponse } from '$lib/types/payment';
	import { validateEmail } from '$lib/utils/validation';

	interface Props {
		open: boolean;
		productSlug: string;
		productName: string;
		onclose: () => void;
	}

	let { open = $bindable(false), productSlug, productName, onclose }: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();
	let email = $state('');
	let flowState: PurchaseFlowState = $state('collecting_email');
	let errorMessage = $state('');
	let downloadToken = $state<string | undefined>(undefined);

	let isEmailValid = $derived(validateEmail(email));

	let wasOpen = false;
	$effect(() => {
		if (open) {
			if (!wasOpen) {
				flowState = 'collecting_email';
				errorMessage = '';
				downloadToken = undefined;
				wasOpen = true;
			}
			if (flowState === 'checkout_open') {
				if (dialogEl?.open) {
					dialogEl.close();
				}
			} else {
				if (dialogEl && !dialogEl.open) {
					dialogEl.showModal();
				}
			}
		} else {
			wasOpen = false;
			if (dialogEl?.open) {
				dialogEl.close();
			}
		}
	});

	function handleClose() {
		if (flowState === 'checkout_open') {
			return;
		}
		open = false;
		onclose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl && flowState !== 'creating_order' && flowState !== 'verifying') {
			handleClose();
		}
	}

	async function handlePurchase() {
		if (!isEmailValid) return;

		flowState = 'creating_order';
		errorMessage = '';

		try {
			// Step 1: Create order on backend (price from DB)
			const order = await createOrder(productSlug, email);

			flowState = 'checkout_open';

			// Step 2: Open Razorpay Checkout
			await openCheckout(order, email, handlePaymentSuccess, handlePaymentDismiss);
		} catch (error) {
			flowState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Failed to start checkout';
		}
	}

	async function handlePaymentSuccess(response: RazorpayPaymentResponse) {
		flowState = 'verifying';

		try {
			// Step 3: Verify payment on backend
			const result = await verifyPayment(
				response.razorpay_order_id,
				response.razorpay_payment_id,
				response.razorpay_signature
			);

			// Store the secure download token returned by the backend.
			downloadToken = result.downloadToken;
			flowState = 'success';
		} catch (error) {
			flowState = 'error';
			errorMessage =
				error instanceof Error
					? error.message
					: 'Payment verification failed. If your payment was deducted, please contact support.';
		}
	}

	function handlePaymentDismiss() {
		flowState = 'cancelled';
	}

	function handleRetry() {
		flowState = 'collecting_email';
		errorMessage = '';
	}
</script>

<dialog
	bind:this={dialogEl}
	class="purchase-dialog"
	onclose={handleClose}
	onclick={handleBackdropClick}
	oncancel={(e) => {
		if (flowState === 'creating_order' || flowState === 'verifying') {
			e.preventDefault();
		}
	}}
>
	<div class="purchase-dialog-content" transition:fly={{ y: 20, duration: 300 }}>
		<!-- Close button -->
		{#if flowState !== 'creating_order' && flowState !== 'verifying'}
			<button class="purchase-close-btn" onclick={handleClose} aria-label="Close">
				<X size={20} />
			</button>
		{/if}

		<!-- Email Collection -->
		{#if flowState === 'collecting_email'}
			<div class="purchase-step" transition:fade={{ duration: 200 }}>
				<div class="purchase-icon-wrapper">
					<ShoppingBag size={28} />
				</div>
				<h3 class="purchase-title">Purchase {productName}</h3>
				<p class="purchase-subtitle">
					Enter your email to receive your license and download access.
				</p>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handlePurchase();
					}}
					class="purchase-form"
				>
					<div class="purchase-input-group">
						<Mail size={18} class="purchase-input-icon" />
						<input
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							class="purchase-email-input"
							required
							autocomplete="email"
						/>
					</div>
					<button
						type="submit"
						class="btn btn-primary purchase-submit-btn"
						disabled={!isEmailValid}
					>
						Continue to Payment
					</button>
				</form>
			</div>
		{/if}

		<!-- Creating Order / Loading -->
		{#if flowState === 'creating_order'}
			<div class="purchase-step purchase-loading" transition:fade={{ duration: 200 }}>
				<div class="purchase-spinner">
					<Loader size={32} class="spin" />
				</div>
				<h3 class="purchase-title">Preparing your order…</h3>
				<p class="purchase-subtitle">This will only take a moment.</p>
			</div>
		{/if}

		<!-- Checkout Open -->
		{#if flowState === 'checkout_open'}
			<div class="purchase-step purchase-loading" transition:fade={{ duration: 200 }}>
				<div class="purchase-spinner">
					<Loader size={32} class="spin" />
				</div>
				<h3 class="purchase-title">Complete your payment</h3>
				<p class="purchase-subtitle">
					The Razorpay checkout window is open. Complete your payment there.
				</p>
			</div>
		{/if}

		<!-- Verifying -->
		{#if flowState === 'verifying'}
			<div class="purchase-step purchase-loading" transition:fade={{ duration: 200 }}>
				<div class="purchase-spinner">
					<Loader size={32} class="spin" />
				</div>
				<h3 class="purchase-title">Verifying payment…</h3>
				<p class="purchase-subtitle">Confirming your payment with Razorpay.</p>
			</div>
		{/if}

		<!-- Success -->
		{#if flowState === 'success'}
			<div class="purchase-step purchase-success" transition:fade={{ duration: 200 }}>
				<div class="purchase-icon-wrapper purchase-icon-success">
					<CheckCircle size={32} />
				</div>
				<h3 class="purchase-title">Purchase Complete!</h3>
				<p class="purchase-subtitle">
					Thank you for purchasing {productName}. Your download access has been activated.
				</p>
				{#if downloadToken}
					<a
						href={`${import.meta.env.VITE_API_URL || 'http://localhost:3009'}/api/downloads/${productSlug}?token=${downloadToken}`}
						class="btn btn-primary purchase-submit-btn"
						download
					>
						Download Now
					</a>
				{/if}
				<button
					class="btn {downloadToken ? 'btn-outline' : 'btn-primary'} purchase-submit-btn"
					onclick={handleClose}
				>
					Done
				</button>
			</div>
		{/if}

		<!-- Error -->
		{#if flowState === 'error'}
			<div class="purchase-step purchase-error" transition:fade={{ duration: 200 }}>
				<div class="purchase-icon-wrapper purchase-icon-error">
					<AlertCircle size={32} />
				</div>
				<h3 class="purchase-title">Something went wrong</h3>
				<p class="purchase-subtitle">{errorMessage}</p>
				<div class="purchase-error-actions">
					<button class="btn btn-primary" onclick={handleRetry}> Try Again </button>
					<button class="btn btn-outline" onclick={handleClose}> Close </button>
				</div>
			</div>
		{/if}

		<!-- Cancelled -->
		{#if flowState === 'cancelled'}
			<div class="purchase-step" transition:fade={{ duration: 200 }}>
				<div class="purchase-icon-wrapper">
					<AlertCircle size={28} />
				</div>
				<h3 class="purchase-title">Payment Cancelled</h3>
				<p class="purchase-subtitle">
					No worries — no payment was charged. You can try again when you're ready.
				</p>
				<div class="purchase-error-actions">
					<button class="btn btn-primary" onclick={handleRetry}> Try Again </button>
					<button class="btn btn-outline" onclick={handleClose}> Close </button>
				</div>
			</div>
		{/if}
	</div>
</dialog>

<style>
	.purchase-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin: 0;
		border: 1px solid var(--color-glass-border);
		border-radius: 24px;
		padding: 0;
		max-width: 460px;
		width: calc(100% - 2rem);
		color: var(--color-text);
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		background: var(--color-light-bg);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		overflow: hidden;
	}

	.purchase-dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
	}

	.purchase-dialog-content {
		position: relative;
		padding: 2.5rem 2rem 2rem;
	}

	.purchase-close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: var(--color-text);
		opacity: 0.5;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 8px;
		transition: var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.purchase-close-btn:hover {
		opacity: 1;
		background: var(--color-glass-bg);
	}

	.purchase-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
	}

	.purchase-icon-wrapper {
		width: 56px;
		height: 56px;
		border-radius: 16px;
		background: linear-gradient(135deg, var(--color-primary-green), var(--color-accent-green));
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		margin-bottom: 0.5rem;
	}

	.purchase-icon-success {
		background: linear-gradient(135deg, #059669, #10b981);
	}

	.purchase-icon-error {
		background: linear-gradient(135deg, #dc2626, #ef4444);
	}

	.purchase-title {
		font-family: var(--font-heading);
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0;
		line-height: 1.3;
	}

	.purchase-subtitle {
		font-size: 0.9rem;
		opacity: 0.7;
		line-height: 1.6;
		max-width: 340px;
		margin: 0 0 0.75rem;
	}

	.purchase-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.purchase-input-group {
		position: relative;
		width: 100%;
	}

	.purchase-input-group :global(.purchase-input-icon) {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0.4;
		pointer-events: none;
	}

	.purchase-email-input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 2.75rem;
		border: 1px solid var(--color-glass-border);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text);
		font-size: 0.95rem;
		font-family: var(--font-main);
		transition: var(--transition-smooth);
		outline: none;
	}

	.purchase-email-input:focus {
		border-color: var(--color-primary-green);
		box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.15);
	}

	.purchase-email-input::placeholder {
		opacity: 0.4;
	}

	.purchase-submit-btn {
		width: 100%;
		padding: 0.875rem;
		font-size: 0.95rem;
		font-weight: 600;
		border-radius: 12px;
	}

	.purchase-submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.purchase-loading {
		padding: 1rem 0;
	}

	.purchase-spinner {
		margin-bottom: 0.5rem;
	}

	.purchase-spinner :global(.spin) {
		animation: purchase-spin 1.2s linear infinite;
	}

	@keyframes purchase-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.purchase-error-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.75rem;
		width: 100%;
	}

	.purchase-error-actions .btn {
		flex: 1;
		padding: 0.75rem;
		border-radius: 12px;
		font-size: 0.9rem;
	}

	@media (max-width: 480px) {
		.purchase-dialog {
			max-width: calc(100% - 1.5rem);
			border-radius: 20px;
		}

		.purchase-dialog-content {
			padding: 2rem 1.5rem 1.5rem;
		}
	}
</style>
