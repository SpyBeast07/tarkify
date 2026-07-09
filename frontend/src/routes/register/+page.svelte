<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import GoogleSignInButton from '$lib/components/ui/GoogleSignInButton.svelte';
	import OAuthAlerts from '$lib/components/ui/OAuthAlerts.svelte';
	import OrDivider from '$lib/components/ui/OrDivider.svelte';
	import { signUp, signInWithGoogle, parseOAuthErrorFromParams, getOAuthErrorMessage } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
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

	let passwordError = $derived(password.length > 0 && password.length < 8 ? 'Password must be at least 8 characters' : '');
	let confirmError = $derived(confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : '');

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';
		info = '';

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
			const url = await signInWithGoogle(returnUrl, '/register');
			window.location.href = url;
		} catch (e) {
			error = e instanceof Error ? getOAuthErrorMessage(e.message, e.message) : 'Failed to sign in with Google';
			googleLoading = false;
		}
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
	<OAuthAlerts
		{error}
		{info}
		onretry={() => { error = ''; handleGoogleSignIn() }}
		ondismiss={() => { info = '' }}
	/>

	<GoogleSignInButton onclick={handleGoogleSignIn} loading={googleLoading} />

	<OrDivider />

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
					onclick={() => { showPassword = !showPassword }}
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
</style>
