<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Mail, Lock, ArrowRight, Eye, EyeOff } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { signIn, getSession } from '$lib/api/auth';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(true);
	let showPassword = $state(false);
	let error = $state('');
	let loading = $state(false);

	let returnUrl = $derived($page.url.searchParams.get('redirect') || '/account');

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const result = await signIn(email, password, rememberMe);
			if (result.error) {
				error = result.error.message || 'Invalid email or password';
				return;
			}
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

<div class="auth-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="auth-hero text-center">
			<span class="section-badge">Account</span>
			<h1>Welcome Back</h1>
			<p class="section-subtext">
				Sign in to access your purchases and downloads.
			</p>
		</div>

		<div transition:fly={{ y: 20, duration: 400, delay: 150 }} class="auth-card glass">
			<form onsubmit={handleLogin} novalidate>
				{#if error}
					<div class="form-alert form-alert-error" role="alert">
						{error}
					</div>
				{/if}

				<div class="form-group">
					<label for="email" class="form-label">Email</label>
					<div class="input-container-wrapper input-with-icon">
						<Mail size={20} class="input-icon" />
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
						<Lock size={20} class="input-icon" />
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
								<EyeOff size={20} />
							{:else}
								<Eye size={20} />
							{/if}
						</button>
					</div>
				</div>

				<div class="form-options">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={rememberMe} />
						<span>Remember me</span>
					</label>
					<a href="/account/forgot-password" class="forgot-link">Forgot password?</a>
				</div>

				<button type="submit" class="btn btn-primary btn-full" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
					{#if !loading}
						<ArrowRight size={18} />
					{/if}
				</button>
			</form>

			<div class="auth-footer">
				<p>
					Don't have an account?
					<a href="/account/register">Create one</a>
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
		width: 16px;
		height: 16px;
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
