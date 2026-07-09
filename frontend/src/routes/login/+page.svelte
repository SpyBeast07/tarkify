<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, ArrowRight, Eye, EyeOff, RefreshCw, X } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import { signIn, signInWithGoogle, parseOAuthErrorFromParams, getOAuthErrorMessage } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);
	let error = $state('');
	let info = $state('');
	let loading = $state(false);
	let googleLoading = $state(false);

	const authState = getContext<AuthState>('auth');

	let returnUrl = $derived($page.url.searchParams.get('redirect') || '/account');

	$effect(() => {
		if (authState.loaded && authState.user) {
			goto(returnUrl);
		}
	});

	$effect(() => {
		const oauthMessage = parseOAuthErrorFromParams($page.url.searchParams);
		if (oauthMessage) {
			const isCancel = $page.url.searchParams.get('error') === 'access_denied';
			if (isCancel) {
				info = oauthMessage;
			} else if (error === '') {
				error = oauthMessage;
			}
		}
	});

	function dismissInfo() {
		info = '';
	}

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		info = '';
		loading = true;

		try {
			const result = await signIn(email, password, rememberMe);
			if ('error' in result) {
				error = result.error.message || 'Invalid email or password';
				return;
			}
			authState.setUser(result.user, result.token);
			authState.broadcast();
			await goto(returnUrl);
		} catch {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		error = '';
		info = '';
		googleLoading = true;
		try {
			const url = await signInWithGoogle(returnUrl, '/login');
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
	title="Login | Tarkify"
	description="Sign in to your Tarkify account to access your purchases and downloads."
	ogImage="/og-image.svg"
	ogType="website"
/>

<AuthLayout title="Welcome Back" subtitle="Sign in to access your purchases and downloads.">
	{#if error}
		<Alert type="error">{error}</Alert>
		<button class="retry-btn" onclick={() => { error = ''; handleGoogleSignIn() }}>
			<RefreshCw size={14} aria-hidden="true" />
			Try again
		</button>
	{/if}

	{#if info}
		<Alert type="info">
			<div class="info-content">
				<span>{info}</span>
				<button class="dismiss-btn" onclick={dismissInfo} aria-label="Dismiss">
					<X size={14} />
				</button>
			</div>
		</Alert>
	{/if}

	<button
		type="button"
		class="btn btn-outline btn-full btn-google"
		onclick={handleGoogleSignIn}
		disabled={googleLoading}
	>
		{#if googleLoading}
			<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
				<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
			</svg>
			Redirecting to Google...
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

	<form onsubmit={handleLogin} novalidate>
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
					placeholder="Enter your password"
					bind:value={password}
					required
					autocomplete="current-password"
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
		</div>

		<div class="form-options">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={rememberMe} disabled={loading} />
				<span>Remember me</span>
			</label>
			<a href="/forgot-password" class="forgot-link">Forgot password?</a>
		</div>

		<button type="submit" class="btn btn-primary btn-full" disabled={loading}>
			{loading ? 'Signing in...' : 'Sign In'}
			{#if !loading}
				<ArrowRight size={18} aria-hidden="true" />
			{/if}
		</button>
	</form>

	{#snippet footer()}
		<p>
			Don't have an account?
			<a href="/register">Create one</a>
		</p>
	{/snippet}
</AuthLayout>

<style>
	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		opacity: 0.8;
	}

	.checkbox-label :global(input[type='checkbox']) {
		width: 1rem;
		height: 1rem;
		accent-color: var(--color-primary-green);
	}

	.forgot-link {
		color: var(--color-primary-green);
		text-decoration: none;
		font-weight: 500;
	}

	.forgot-link:hover {
		text-decoration: underline;
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

	.info-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}

	.dismiss-btn:hover {
		opacity: 1;
	}

	.retry-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		color: var(--color-text);
		backdrop-filter: var(--glass-blur);
		transition: var(--transition-smooth);
	}

	.retry-btn:hover {
		border-color: var(--color-accent-green);
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
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
