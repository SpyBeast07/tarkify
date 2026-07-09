<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import { signUp, signInWithGoogle, parseOAuthErrorFromParams, getOAuthErrorMessage } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);
	let googleLoading = $state(false);

	const authState = getContext<AuthState>('auth');

	$effect(() => {
		if (authState.loaded && authState.user) {
			goto('/account');
		}
	});

	$effect(() => {
		const oauthMessage = parseOAuthErrorFromParams($page.url.searchParams);
		if (oauthMessage && error === '') {
			error = oauthMessage;
		}
	});

	let passwordError = $derived(password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters' : '');
	let confirmError = $derived(confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : '');

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';

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
			const result = await signUp(name, email, password);
			if ('error' in result) {
				error = result.error.message || 'Registration failed';
				return;
			}
			authState.setUser(result.user, result.token);
			authState.broadcast();
			await goto('/account');
		} catch {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		error = '';
		googleLoading = true;
		try {
			const url = await signInWithGoogle('/account', '/register');
			window.location.href = url;
		} catch (e) {
			error = e instanceof Error ? getOAuthErrorMessage(e.message, e.message) : 'Failed to sign in with Google';
			googleLoading = false;
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
	title="Create Account | Tarkify"
	description="Create a Tarkify account to manage your purchases and downloads."
	ogImage="/og-image.svg"
	ogType="website"
/>

<AuthLayout title="Create Account" subtitle="Sign up to manage your purchases and downloads.">
	{#if error}
		<Alert type="error">{error}</Alert>
	{/if}

	<button
		type="button"
		class="btn btn-outline btn-full btn-google"
		onclick={handleGoogleSignIn}
		disabled={googleLoading}
	>
		{#if googleLoading}
			Continue with Google...
		{:else}
			<svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Continue with Google
		{/if}
	</button>

	<div class="divider">
		<span>or</span>
	</div>

	<form onsubmit={handleRegister} novalidate>
		<div class="form-group">
			<label for="name" class="form-label">Name</label>
			<div class="input-container-wrapper input-with-icon">
				<User size={20} class="input-icon" aria-hidden="true" />
				<input
					id="name"
					type="text"
					placeholder="Your name"
					bind:value={name}
					required
					autocomplete="name"
					disabled={loading}
				/>
			</div>
		</div>

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

		<div class="form-group">
			<label for="password" class="form-label">Password</label>
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
			<label for="confirmPassword" class="form-label">Confirm Password</label>
			<div class="input-container-wrapper input-with-icon">
				<Lock size={20} class="input-icon" aria-hidden="true" />
				<input
					id="confirmPassword"
					type={showPassword ? 'text' : 'password'}
					placeholder="Repeat your password"
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

		<button type="submit" class="btn btn-primary btn-full" disabled={loading || !!passwordError || !!confirmError}>
			{loading ? 'Creating account...' : 'Create Account'}
			{#if !loading}
				<ArrowRight size={18} aria-hidden="true" />
			{/if}
		</button>
	</form>

	{#snippet footer()}
		<p>
			Already have an account?
			<a href="/login">Sign in</a>
		</p>
	{/snippet}
</AuthLayout>

<style>
	.error-text {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: #ef4444;
		font-size: 0.8rem;
		margin-top: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: rgba(239, 68, 68, 0.06);
		border-radius: 6px;
	}

	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 2rem;
		border-radius: 50px;
		font-family: var(--font-accent);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: var(--transition-smooth);
		border: 2px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		color: var(--color-text);
		backdrop-filter: var(--glass-blur);
	}

	.btn-google:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.45);
		border-color: var(--color-accent-green);
		transform: translateY(-2px);
	}

	.btn-google:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.google-icon {
		flex-shrink: 0;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 1rem 0;
		color: var(--color-text);
		opacity: 0.4;
		font-size: 0.85rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-glass-border);
	}
</style>
