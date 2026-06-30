<script lang="ts">
	import { Mail, Send, AlertCircle, CheckCircle } from '@lucide/svelte';
	import { submitNewsletter, ApiResponseError, TimeoutError, NetworkError } from '$lib/api/client';
	import { validateEmail } from '$lib/utils/validation';
	import { slide, fade } from 'svelte/transition';
	import { tick, getContext } from 'svelte';

	const toastState = getContext<{ addToast: (msg: string, type: string) => void }>('toast');

	let email = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let emailError = $state('');
	let errorBanner: HTMLDivElement | undefined = $state(undefined);

	function validate(): boolean {
		if (!email.trim()) {
			emailError = 'Email is required';
			return false;
		}
		if (!validateEmail(email.trim())) {
			emailError = 'Please enter a valid email address';
			return false;
		}
		emailError = '';
		return true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'submitting') return;
		if (!validate()) return;

		status = 'submitting';
		errorMessage = '';

		try {
			await submitNewsletter(email.trim());
			status = 'success';
			toastState?.addToast('Thank you for subscribing to our newsletter!', 'success');
			email = '';
		} catch (err) {
			status = 'error';
			if (err instanceof ApiResponseError) {
				errorMessage = err.message;
			} else if (err instanceof TimeoutError || err instanceof NetworkError) {
				errorMessage = err.message;
			} else {
				errorMessage = 'Something went wrong. Please try again later.';
			}
			await tick();
			errorBanner?.focus();
			toastState?.addToast(errorMessage, 'error');
		}
	}
</script>

<section class="section newsletter" id="newsletter">
	<div class="container">
		<div class="newsletter-card glass">
			<div class="newsletter-content">
				<div class="mail-icon">
					<Mail size={32} />
				</div>
				<h2>Stay Ahead of Automation</h2>
				<p>Get weekly insights on how to leverage AI for your business scaling.</p>
			</div>

			{#if status === 'success'}
				<div
					class="newsletter-success mt-4"
					transition:fade={{ duration: 300 }}
					role="status"
					aria-live="polite"
				>
					<div class="flex items-center justify-center gap-2 text-accent-green font-semibold">
						<CheckCircle size={20} />
						<span>You're subscribed! Check your inbox for updates.</span>
					</div>
				</div>
			{:else}
				<form class="newsletter-form" onsubmit={handleSubmit} novalidate>
					<div class="input-wrapper">
						<input
							type="email"
							placeholder="Enter your work email"
							required
							bind:value={email}
							disabled={status === 'submitting'}
							aria-label="Work email address for newsletter"
							aria-invalid={emailError ? 'true' : 'false'}
							aria-describedby={emailError ? 'newsletter-email-error' : undefined}
							autocomplete="email"
							maxlength={100}
						/>
						<button
							type="submit"
							class="btn btn-submit newsletter-btn"
							disabled={status === 'submitting'}
						>
							<span>
								{status === 'submitting' ? 'Joining...' : 'Subscribe'}
							</span>
							<Send size={15} />
						</button>
					</div>

					{#if emailError}
						<p
							id="newsletter-email-error"
							class="newsletter-error-message mt-1 text-xs font-semibold"
							style="color: #ef4444;"
							role="alert"
						>
							{emailError}
						</p>
					{/if}

					{#if status === 'error' && errorMessage}
						<div
							bind:this={errorBanner}
							tabindex="-1"
							transition:slide
							class="newsletter-error-message mt-2 flex items-center justify-center gap-1 text-xs font-semibold"
							style="color: #ef4444;"
							role="alert"
							aria-live="polite"
						>
							<AlertCircle size={14} />
							<span>{errorMessage}</span>
						</div>
					{/if}

					<p class="privacy-note">Zero spam. Just pure automation value.</p>
				</form>
			{/if}
		</div>
	</div>
</section>
