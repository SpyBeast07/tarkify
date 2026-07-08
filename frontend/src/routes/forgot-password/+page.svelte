<script lang="ts">
	import { Mail, ArrowLeft, Send } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import { sendForgotPassword, mapEmailError } from '$lib/api/auth';
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
				error = mapEmailError(result as ApiErrorBody, 'password_reset');
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

<AuthLayout title="Reset Password" subtitle="Enter your email and we'll send you a reset link.">
	{#if sent}
		<div class="success-state" role="status">
			<div class="success-icon">
				<Send size={32} aria-hidden="true" />
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
				<Alert type="error">{error}</Alert>
			{/if}

			<div class="form-group">
				<label for="email" class="form-label">Email</label>
				<div class="input-container-wrapper input-with-icon">
					<Mail size={20} class="input-icon" aria-hidden="true" />
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
					<Send size={18} aria-hidden="true" />
				{/if}
			</button>
		</form>
	{/if}

	{#snippet footer()}
		<a href="/login" class="back-link">
			<ArrowLeft size={16} aria-hidden="true" />
			Back to login
		</a>
	{/snippet}
</AuthLayout>

<style>
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
</style>
