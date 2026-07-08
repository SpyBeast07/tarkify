<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, ArrowRight, Eye, EyeOff } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import { signIn } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	const authState = getContext<AuthState>('auth');

	let returnUrl = $derived($page.url.searchParams.get('redirect') || '/account');

	$effect(() => {
		if (authState.loaded && authState.user) {
			goto('/account');
		}
	});

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
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
	<form onsubmit={handleLogin} novalidate>
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
</style>
