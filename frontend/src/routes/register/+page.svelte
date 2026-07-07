<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { signUp } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	const authState = getContext<AuthState>('auth');

	$effect(() => {
		if (authState.loaded && authState.user) {
			goto('/account');
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

<div class="auth-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="auth-hero text-center">
			<span class="section-badge">Account</span>
			<h1>Create Account</h1>
			<p class="section-subtext">
				Sign up to manage your purchases and downloads.
			</p>
		</div>

		<div transition:fly={{ y: 20, duration: 400, delay: 150 }} class="auth-card glass">
			<form onsubmit={handleRegister} novalidate>
				{#if error}
					<div class="form-alert form-alert-error" role="alert">
						{error}
					</div>
				{/if}

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

			<div class="auth-footer">
				<p>
					Already have an account?
					<a href="/login">Sign in</a>
				</p>
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

	.auth-footer {
		text-align: center;
		margin-top: 0.5rem;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.auth-footer a {
		color: var(--color-primary-green);
		text-decoration: none;
		font-weight: 500;
	}

	.auth-footer a:hover {
		text-decoration: underline;
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
