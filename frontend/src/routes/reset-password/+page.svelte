<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import { resetPassword, type ApiErrorBody } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	const authState = getContext<AuthState>('auth');

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

	function describeResetError(
		statusCode: number,
		err: { code?: string; message?: string } | undefined
	): string {
		const code = err?.code ?? '';
		const msg = (err?.message ?? '').toLowerCase();
		if (code === 'INVALID_TOKEN' || msg.includes('invalid') || msg.includes('token')) {
			return 'This password reset link is invalid or has expired. Please request a new one.';
		}
		if (code === 'PASSWORD_TOO_SHORT') return 'Password is too short. Please choose a password with at least 8 characters.';
		if (code === 'PASSWORD_TOO_LONG') return 'Password is too long. Please choose a shorter password.';
		if (statusCode === 0) {
			if (code === 'TIMEOUT') return 'The request timed out. Please try again.';
			if (code === 'NETWORK_ERROR') return 'Network error. Please check your connection and try again.';
			return 'Something went wrong. Please try again.';
		}
		return 'We could not reset your password. Please try again or request a new link.';
	}

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
				error = describeResetError((result as ApiErrorBody).status, (result as ApiErrorBody).error);
				return;
			}
			success = true;

			try {
				await authState.checkSession();
			} catch {
				// Non-critical — proceed to redirect based on current state.
			}

			const target = authState.user ? '/account' : '/login';
			setTimeout(() => {
				goto(target);
			}, 2500);
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

<AuthLayout title="Set New Password" subtitle="Choose a strong password for your account.">
	{#if !token}
		<div class="error-state">
			<h2>Invalid Reset Link</h2>
			<p>This password reset link is invalid or has expired.</p>
			<a href="/forgot-password" class="btn btn-primary">
				Request New Reset Link
			</a>
		</div>
	{:else if success}
		<div class="success-state" role="status">
			<div class="success-icon">
				<ShieldCheck size={32} aria-hidden="true" />
			</div>
			<h2>Password updated successfully</h2>
			<p>Redirecting you to sign in…</p>
			<a href="/login" class="btn btn-primary">
				Sign In
			</a>
		</div>
	{:else}
		<form onsubmit={handleReset} novalidate>
			{#if error}
				<Alert type="error">{error}</Alert>
			{/if}

			<div class="form-group">
				<label for="password" class="form-label">New Password</label>
				<div class="input-container-wrapper input-with-icon">
					<Lock size={20} class="input-icon" aria-hidden="true" />
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
							<EyeOff size={20} aria-hidden="true" />
						{:else}
							<Eye size={20} aria-hidden="true" />
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
					<Lock size={20} class="input-icon" aria-hidden="true" />
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

	{#snippet footer()}
		<a href="/login" class="back-link">
			<ArrowLeft size={16} aria-hidden="true" />
			Back to login
		</a>
	{/snippet}
</AuthLayout>

<style>
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

	.error-text {
		color: #ef4444;
		font-size: 0.85rem;
		margin-top: 0.25rem;
		display: block;
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
