<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { Star, Send, User, Mail, AlertCircle, MessageSquare } from '@lucide/svelte';
	import Input from './ui/Input.svelte';
	import Loading from './ui/Loading.svelte';
	import { validateRequired, validateEmail } from '$lib/utils/validation';
	import { submitFeedback } from '$lib/api/client';

	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		product: 'DevBeast',
		feedbackType: 'General Feedback',
		rating: 5,
		message: ''
	});

	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let errors = $state<Record<string, string>>({});
	let hoverRating = $state<number | null>(null);

	const products = ['DevBeast', 'Legal Redline', 'EM SME', 'General Website / Other'];

	const feedbackTypes = ['Bug Report', 'Feature Request', 'General Feedback', 'UI/UX Suggestion'];

	const ratingLabels: Record<number, string> = {
		1: 'Needs Improvement',
		2: 'Below Average',
		3: 'Acceptable',
		4: 'Very Good',
		5: 'Outstanding!'
	};

	function handleRatingSelect(rate: number) {
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

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		status = 'loading';

		try {
			await submitFeedback(formData);
		} catch {
			status = 'error';
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
						/>
						<Input
							label="Last Name"
							name="lastName"
							placeholder="Doe"
							bind:value={formData.lastName}
							error={errors.lastName}
							icon={User}
							required
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
					/>

					<div class="form-row mb-6">
						<Input
							label="Select Product"
							name="product"
							type="select"
							options={products}
							bind:value={formData.product}
							icon={MessageSquare}
						/>
						<Input
							label="Feedback Category"
							name="feedbackType"
							type="select"
							options={feedbackTypes}
							bind:value={formData.feedbackType}
							icon={MessageSquare}
						/>
					</div>

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
					/>

					<button
						type="submit"
						class="btn btn-submit w-full py-4 flex items-center justify-center gap-3"
						disabled={status === 'loading'}
					>
						{#if status === 'loading'}
							<Loading size={20} />
							<span>Submitting Feedback...</span>
						{:else}
							<Send size={18} />
							<span>Submit Feedback</span>
						{/if}
					</button>

					{#if status === 'error'}
						<div
							class="error-banner mt-6 flex items-center gap-2"
							transition:slide
							role="alert"
							aria-live="polite"
						>
							<AlertCircle size={20} />
							<span
								>Submissions are temporarily unavailable. This feature is currently being upgraded.</span
							>
						</div>
					{/if}
				</form>
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
</style>
