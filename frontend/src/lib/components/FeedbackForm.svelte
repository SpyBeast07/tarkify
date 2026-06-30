<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { Star, Send, User, Mail, AlertCircle, MessageSquare, CheckCircle } from '@lucide/svelte';
	import Input from './ui/Input.svelte';
	import Loading from './ui/Loading.svelte';
	import { validateRequired, validateEmail } from '$lib/utils/validation';
	import { submitFeedback, ApiResponseError, TimeoutError, NetworkError } from '$lib/api/client';
	import { tick, getContext } from 'svelte';

	const toastState = getContext<{ addToast: (msg: string, type: string) => void }>('toast');

	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		product: 'DevBeast',
		rating: 5,
		message: ''
	});

	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errors = $state<Record<string, string>>({});
	let hoverRating = $state<number | null>(null);
	let errorMessage = $state('');
	let errorBanner: HTMLDivElement | undefined = $state(undefined);

	const products = [
		'DevBeast',
		'Legal Redline',
		'Integrate Business Operating System',
		'General Website / Other'
	];

	const ratingLabels: Record<number, string> = {
		1: 'Needs Improvement',
		2: 'Below Average',
		3: 'Acceptable',
		4: 'Very Good',
		5: 'Outstanding!'
	};

	function handleRatingSelect(rate: number) {
		if (status === 'submitting') return;
		formData.rating = rate;
		if (errors.rating) {
			errors.rating = '';
		}
	}

	function validate() {
		const newErrors: Record<string, string> = {};
		if (!validateRequired(formData.firstName)) newErrors.firstName = 'Required';
		if (!validateRequired(formData.lastName)) newErrors.lastName = 'Required';

		if (!validateRequired(formData.email)) {
			newErrors.email = 'Required';
		} else if (!validateEmail(formData.email)) {
			newErrors.email = 'Invalid email';
		}

		if (!validateRequired(formData.message)) newErrors.message = 'Required';
		if (formData.rating < 1 || formData.rating > 5) newErrors.rating = 'Please select a rating';

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function resetForm() {
		formData = {
			firstName: '',
			lastName: '',
			email: '',
			product: 'DevBeast',
			rating: 5,
			message: ''
		};
		errors = {};
		errorMessage = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'submitting') return;
		if (!validate()) return;

		status = 'submitting';
		errorMessage = '';

		try {
			const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
			await submitFeedback({
				name: name || undefined,
				email: formData.email.trim() || undefined,
				product: formData.product,
				rating: formData.rating,
				message: formData.message.trim()
			});

			status = 'success';
			toastState?.addToast('Thank you for your feedback! It helps us improve.', 'success');
			resetForm();
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

<div class="feedback-section pt-10 pb-20">
	<div class="container" style="max-width: 900px;">
		<div class="section-header text-center mb-12">
			<span class="section-badge">Product Feedback</span>
			<h1>Help Us <span class="text-accent-green">Optimize</span> Tarkify</h1>
			<p class="section-subtext" style="max-width: 600px; margin: 0 auto;">
				Encountered a bug, have a feature request, or want to suggest UI improvements? Share your
				feedback to help us build a better platform.
			</p>
		</div>

		<div class="feedback-container">
			<div class="contact-form-card feedback-form-card" style="padding: 3rem; border-radius: 3rem;">
				{#if status === 'success'}
					<div
						class="success-state text-center py-8"
						transition:fade={{ duration: 300 }}
						role="status"
						aria-live="polite"
					>
						<CheckCircle size={48} class="text-accent-green mx-auto mb-4" />
						<h3 class="text-xl font-bold mb-2">Feedback Received!</h3>
						<p class="opacity-70">Thank you for your feedback! It helps us improve.</p>
						<button
							class="btn btn-submit mt-6"
							onclick={() => {
								status = 'idle';
								resetForm();
							}}
						>
							Submit Another Response
						</button>
					</div>
				{:else}
					<form onsubmit={handleSubmit} novalidate>
						<div class="form-row mb-6">
							<Input
								label="First Name"
								name="firstName"
								placeholder="John"
								bind:value={formData.firstName}
								error={errors.firstName}
								icon={User}
								required
								disabled={status === 'submitting'}
							/>
							<Input
								label="Last Name"
								name="lastName"
								placeholder="Doe"
								bind:value={formData.lastName}
								error={errors.lastName}
								icon={User}
								required
								disabled={status === 'submitting'}
							/>
						</div>

						<Input
							label="Email Address"
							name="email"
							type="email"
							placeholder="john@example.com"
							bind:value={formData.email}
							error={errors.email}
							icon={Mail}
							class="mb-6"
							required
							disabled={status === 'submitting'}
						/>

						<Input
							label="Select Product"
							name="product"
							type="select"
							options={products}
							bind:value={formData.product}
							icon={MessageSquare}
							disabled={status === 'submitting'}
						/>

						<div class="form-group mb-8">
							<label class="form-label" for="star-rating">Rating</label>
							<div
								id="star-rating"
								class="feedback-rating-container flex flex-col sm:flex-row sm:items-center gap-4"
							>
								<div class="flex items-center gap-2 feedback-stars">
									{#each [1, 2, 3, 4, 5] as index (index)}
										{@const isFilled =
											hoverRating !== null ? index <= hoverRating : index <= formData.rating}
										<button
											type="button"
											onclick={() => handleRatingSelect(index)}
											onmouseenter={() => (hoverRating = index)}
											onmouseleave={() => (hoverRating = null)}
											class="rating-star-btn"
											style="background: none; border: none; padding: 0.25rem; cursor: pointer;"
											aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
											aria-pressed={index <= formData.rating}
											disabled={status === 'submitting'}
										>
											<Star
												size={32}
												class="transition-all duration-200 {isFilled
													? 'text-accent-green fill-accent-green star-filled-glow'
													: 'text-gray-400 opacity-40'}"
											/>
										</button>
									{/each}
								</div>
								<span class="rating-label text-sm font-semibold text-accent-green">
									{ratingLabels[hoverRating || formData.rating]}
								</span>
							</div>
							{#if errors.rating}
								<span class="error-text">{errors.rating}</span>
							{/if}
						</div>

						<Input
							label="How can we improve?"
							name="message"
							type="textarea"
							placeholder="Provide detailed feedback..."
							rows={5}
							bind:value={formData.message}
							error={errors.message}
							icon={MessageSquare}
							class="mb-8"
							required
							disabled={status === 'submitting'}
						/>

						<button
							type="submit"
							class="btn btn-submit w-full py-4 flex items-center justify-center gap-3"
							disabled={status === 'submitting'}
						>
							{#if status === 'submitting'}
								<Loading size={20} />
								<span>Submitting Feedback...</span>
							{:else}
								<Send size={18} />
								<span>Submit Feedback</span>
							{/if}
						</button>

						{#if status === 'error' && errorMessage}
							<div
								bind:this={errorBanner}
								tabindex="-1"
								class="error-banner mt-6 flex items-center gap-2"
								transition:slide
								role="alert"
								aria-live="polite"
							>
								<AlertCircle size={20} />
								<span>{errorMessage}</span>
							</div>
						{/if}
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.error-text {
		color: #ef4444;
		font-size: 0.85rem;
		margin-top: 0.25rem;
		display: block;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #ef4444;
		padding: 1rem;
		border-radius: 12px;
		font-size: 0.9rem;
	}

	.success-state :global(.text-accent-green) {
		color: var(--color-accent-green);
	}
</style>
