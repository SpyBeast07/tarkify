<script lang="ts">
	import { Mail, Send, AlertCircle } from '@lucide/svelte';
	import { submitNewsletter } from '$lib/api/client';
	import { slide } from 'svelte/transition';

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = 'loading';
		try {
			const response = await submitNewsletter(email);
			if (response.ok) {
				status = 'success';
				email = '';
			} else {
				status = 'error';
			}
		} catch (err) {
			console.error('Newsletter subscription error:', err);
			status = 'error';
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

			<form class="newsletter-form" onsubmit={handleSubmit}>
				<div class="input-wrapper">
					<input
						type="email"
						placeholder="Enter your work email"
						required
						bind:value={email}
						disabled={status === 'loading' || status === 'success'}
						aria-label="Work email address for newsletter"
					/>
					<button
						type="submit"
						class="btn btn-submit newsletter-btn"
						disabled={status === 'loading'}
					>
						<span>
							{status === 'success' ? 'Joined!' : status === 'loading' ? 'Joining...' : 'Subscribe'}
						</span>
						<Send size={15} />
					</button>
				</div>

				{#if status === 'error'}
					<div
						transition:slide
						class="newsletter-error-message mt-2 flex items-center justify-center gap-1 text-xs font-semibold"
						style="color: #ef4444;"
					>
						<AlertCircle size={14} />
						<span>Newsletter service is temporarily unavailable. Please try again later.</span>
					</div>
				{/if}

				<p class="privacy-note">Zero spam. Just pure automation value.</p>
			</form>
		</div>
	</div>
</section>
