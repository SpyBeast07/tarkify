<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Mail, ArrowLeft, Send } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { sendForgotPassword } from '$lib/api/auth';
	import type { ApiErrorBody } from '$lib/api/auth';

	let email = $state('');
	let error = $state('');
	let sent = $state(false);
	let loading = $state(false);

	async function handleForgotPassword(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const result = await sendForgotPassword(email);
			if ('error' in result) {
				error = (result as ApiErrorBody).error.message || 'Failed to send reset email';
				return;
			}
			sent = true;
		} catch {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
	title="Forgot Password | Tarkify"
	description="Reset your Tarkify account password."
	ogImage="/og-image.svg"
	ogType="website"
/>

<div class="auth-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="auth-hero text-center">
			<span class="section-badge">Account</span>
			<h1>Reset Password</h1>
			<p class="section-subtext">
				Enter your email and we'll send you a reset link.
			</p>
		</div>

		<div transition:fly={{ y: 20, duration: 400, delay: 150 }} class="auth-card glass">
			{#if sent}
				<div class="success-state">
					<div class="success-icon">
						<Send size={32} />
					</div>
					<h2>Check Your Email</h2>
					<p>
						If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
					</p>
					<p class="success-note">
						Didn't receive the email? Check your spam folder or
						<button class="link-button" onclick={() => (sent = false)}>try again</button>.
					</p>
				</div>
			{:else}
				<form onsubmit={handleForgotPassword} novalidate>
					{#if error}
						<div class="form-alert form-alert-error" role="alert">
							{error}
						</div>
					{/if}

					<div class="form-group">
						<label for="email" class="form-label">Email</label>
						<div class="input-container-wrapper input-with-icon">
							<Mail size={20} class="input-icon" />
							<input
								id="email"
								type="email"
								placeholder="you@example.com"
								bind:value={email}
								required
								autocomplete="email"
								disabled={loading}
							/>
						</div>
					</div>

					<button type="submit" class="btn btn-primary btn-full" disabled={loading}>
						{loading ? 'Sending...' : 'Send Reset Link'}
						{#if !loading}
							<Send size={18} />
						{/if}
					</button>
				</form>
			{/if}

			<div class="auth-footer">
				<a href="/account/login" class="back-link">
					<ArrowLeft size={16} />
					Back to login
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		min-height: 70vh;
		display: flex;
		align-items: flex-start;
	}

	.auth-hero {
		margin-bottom: 2.5rem;
	}

	.auth-hero h1 {
		font-size: 2.5rem;
		margin-bottom: 0.75rem;
	}

	.auth-card {
		max-width: 440px;
		margin: 0 auto;
		padding: 2.5rem;
		border-radius: 24px;
	}

	.auth-card :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.success-state {
		text-align: center;
		padding: 1rem 0;
	}

	.success-icon {
		width: 64px;
		height: 64px;
		border-radius: 18px;
		background: linear-gradient(135deg, var(--color-primary-green), var(--color-accent-green));
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		margin: 0 auto 1.5rem;
	}

	.success-state h2 {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.success-state p {
		font-size: 0.95rem;
		opacity: 0.7;
		line-height: 1.7;
	}

	.success-note {
		margin-top: 1rem;
		font-size: 0.85rem;
	}

	.link-button {
		background: none;
		border: none;
		color: var(--color-primary-green);
		font-weight: 500;
		cursor: pointer;
		padding: 0;
		font-size: inherit;
		font-family: inherit;
	}

	.link-button:hover {
		text-decoration: underline;
	}

	.auth-footer {
		text-align: center;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-text);
		opacity: 0.7;
		text-decoration: none;
	}

	.back-link:hover {
		opacity: 1;
	}

	.form-alert {
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-size: 0.9rem;
	}

	.form-alert-error {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.btn-full {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	@media (max-width: 640px) {
		.auth-hero h1 {
			font-size: 2rem;
		}

		.auth-card {
			padding: 1.75rem;
		}
	}
</style>
