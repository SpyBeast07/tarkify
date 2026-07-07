<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { resetPassword } from '$lib/api/auth';
	import type { ApiErrorBody } from '$lib/api/auth';

	let token = $derived($page.url.searchParams.get('token') || '');

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	let passwordError = $derived(
		password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters' : ''
	);
	let confirmError = $derived(confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : '');

	async function handleReset(e: Event) {
		e.preventDefault();
		error = '';

		if (!token) {
			error = 'Invalid or missing reset token';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;

		try {
			const result = await resetPassword(token, password);
			if ('error' in result) {
				error = (result as ApiErrorBody).error.message || 'Failed to reset password';
				return;
			}
			success = true;
		} catch {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
	title="Reset Password | Tarkify"
	description="Set a new password for your Tarkify account."
	ogImage="/og-image.svg"
	ogType="website"
/>

<div class="auth-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="auth-hero text-center">
			<span class="section-badge">Account</span>
			<h1>Set New Password</h1>
			<p class="section-subtext">
				Choose a strong password for your account.
			</p>
		</div>

		<div transition:fly={{ y: 20, duration: 400, delay: 150 }} class="auth-card glass">
			{#if !token}
				<div class="error-state">
					<h2>Invalid Reset Link</h2>
					<p>This password reset link is invalid or has expired.</p>
					<a href="/forgot-password" class="btn btn-primary">
						Request New Reset Link
					</a>
				</div>
			{:else if success}
				<div class="success-state">
					<div class="success-icon">
						<ShieldCheck size={32} />
					</div>
					<h2>Password Reset</h2>
					<p>Your password has been successfully updated.</p>
					<a href="/login" class="btn btn-primary">
						Sign In
					</a>
				</div>
			{:else}
				<form onsubmit={handleReset} novalidate>
					{#if error}
						<div class="form-alert form-alert-error" role="alert">
							{error}
						</div>
					{/if}

					<div class="form-group">
						<label for="password" class="form-label">New Password</label>
						<div class="input-container-wrapper input-with-icon">
							<Lock size={20} class="input-icon" />
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="At least 8 characters"
								bind:value={password}
								required
								autocomplete="new-password"
								disabled={loading}
							/>
							<button
								type="button"
								class="input-toggle"
								onclick={togglePassword}
								aria-label={showPassword ? 'Hide password' : 'Show password'}
								disabled={loading}
							>
								{#if showPassword}
									<EyeOff size={20} />
								{:else}
									<Eye size={20} />
								{/if}
							</button>
						</div>
						{#if passwordError}
							<span class="error-text">{passwordError}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="confirmPassword" class="form-label">Confirm New Password</label>
						<div class="input-container-wrapper input-with-icon">
							<Lock size={20} class="input-icon" />
							<input
								id="confirmPassword"
								type={showPassword ? 'text' : 'password'}
								placeholder="Repeat your new password"
								bind:value={confirmPassword}
								required
								autocomplete="new-password"
								disabled={loading}
							/>
						</div>
						{#if confirmError}
							<span class="error-text">{confirmError}</span>
						{/if}
					</div>

					<button
						type="submit"
						class="btn btn-primary btn-full"
						disabled={loading || !!passwordError || !!confirmError}
					>
						{loading ? 'Resetting...' : 'Reset Password'}
					</button>
				</form>
			{/if}

			<div class="auth-footer">
				<a href="/login" class="back-link">
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

	.success-state,
	.error-state {
		text-align: center;
		padding: 1rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
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
		margin: 0 auto;
	}

	.success-state h2,
	.error-state h2 {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.success-state p,
	.error-state p {
		font-size: 0.95rem;
		opacity: 0.7;
		line-height: 1.7;
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

	.error-text {
		color: #ef4444;
		font-size: 0.85rem;
		margin-top: 0.25rem;
		display: block;
	}

	.input-toggle {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--color-text);
		opacity: 0.5;
		cursor: pointer;
		padding: 0;
	}

	.input-toggle:hover {
		opacity: 1;
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
