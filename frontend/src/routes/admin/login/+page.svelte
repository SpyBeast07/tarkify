<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, ArrowRight, Eye, EyeOff } from '@lucide/svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { signIn, signOut } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	const authState = getContext<AuthState>('auth');

	$effect(() => {
		const errorParam = $page.url.searchParams.get('error');
		if (errorParam === 'forbidden') {
			error = 'You do not have permission to access the Admin Portal.';
		} else if (errorParam === 'session_expired') {
			error = 'Your session has expired. Please sign in again.';
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

			if (result.user.role !== 'admin') {
				await signOut();
				authState.clearUser();
				authState.broadcast();
				error = 'You do not have permission to access the Admin Portal.';
				return;
			}

			authState.setUser(result.user, result.token);
			authState.broadcast();

			const redirect = $page.url.searchParams.get('redirect') || '/admin';
			goto(redirect);
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

<div class="admin-login-wrapper">
	<AuthLayout title="Admin Login" subtitle="Sign in to the Admin Portal." badge="Admin">
		{#if error}
			<div style="margin-bottom: 1rem;">
				<Alert type="error">
					{error}
				</Alert>
			</div>
		{/if}

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
			</div>

			<div class="form-options">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={rememberMe} disabled={loading} />
					<span>Remember me</span>
				</label>
			</div>

			<button type="submit" class="btn btn-primary btn-full" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign In'}
				{#if !loading}
					<ArrowRight size={18} aria-hidden="true" />
				{/if}
			</button>
		</form>
	</AuthLayout>
</div>

<style>
	.admin-login-wrapper :global(.auth-page) {
		padding-top: 3rem;
	}

	.form-options {
		display: flex;
		justify-content: center;
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
</style>
