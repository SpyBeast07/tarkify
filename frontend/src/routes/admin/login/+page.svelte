<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, ArrowRight } from '@lucide/svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { signIn, signOut } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	import AdminInput from '$lib/admin/components/AdminInput.svelte';
	import AdminCheckbox from '$lib/admin/components/AdminCheckbox.svelte';

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
	<title>Admin Login | Tarkify</title>
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

		<form onsubmit={handleLogin} novalidate class="login-form">
			<AdminInput
				id="email"
				type="email"
				label="Email Address"
				placeholder="you@example.com"
				bind:value={email}
				icon={Mail}
				required
				autocomplete="email"
				disabled={loading}
			/>

			<AdminInput
				id="password"
				type={showPassword ? 'text' : 'password'}
				label="Password"
				placeholder="Enter your password"
				bind:value={password}
				icon={Lock}
				required
				autocomplete="current-password"
				disabled={loading}
			/>

			<div class="form-options">
				<AdminCheckbox bind:checked={rememberMe} label="Remember me" disabled={loading} />
				<AdminCheckbox bind:checked={showPassword} label="Show password" disabled={loading} />
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

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
