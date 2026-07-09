<script lang="ts">
	import { getContext } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { CheckCircle, AlertCircle } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
	import AuthLayout from '$lib/components/ui/AuthLayout.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import { verifyEmail, type ApiErrorBody } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	const authState = getContext<AuthState>('auth');

	let token = $derived($page.url.searchParams.get('token') || '');
	let status = $state<'loading' | 'success' | 'error'>('loading');
	let errorMessage = $state('');
	let started = false;

	function describeVerifyError(
		statusCode: number,
		err: { code?: string; message?: string } | undefined
	): string {
		const code = err?.code ?? '';
		const msg = (err?.message ?? '').toLowerCase();
		if (code === 'TOKEN_EXPIRED' || msg.includes('expired')) {
			return 'This verification link has expired. Please request a new one from your account settings.';
		}
		if (
			code === 'INVALID_TOKEN' ||
			code === 'USER_NOT_FOUND' ||
			msg.includes('invalid') ||
			msg.includes('not found')
		) {
			return 'This verification link is invalid or has already been used.';
		}
		if (statusCode === 0) {
			if (code === 'TIMEOUT') return 'The request timed out. Please try again.';
			if (code === 'NETWORK_ERROR') return 'Network error. Please check your connection and try again.';
			return 'Something went wrong while verifying your email.';
		}
		return 'We could not verify your email. Please try again or request a new link.';
	}

	async function verify() {
		if (started) return;
		started = true;

		if (!token) {
			status = 'error';
			errorMessage = 'This verification link is missing a token.';
			return;
		}

		try {
			const res = await verifyEmail(token);

			if ('error' in res) {
				const e = res as ApiErrorBody;
				status = 'error';
				errorMessage = describeVerifyError(e.status, e.error);
				return;
			}

			status = 'success';

			try {
				await authState.checkSession();
			} catch {
				// Non-critical — proceed to redirect based on current state.
			}

			const target = authState.user ? '/account' : '/account/login';
			setTimeout(() => {
				goto(target);
			}, 2500);
		} catch {
			status = 'error';
			errorMessage = 'Something went wrong while verifying your email. Please try again.';
		}
	}

	onMount(() => {
		verify();
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
	title="Verify Email | Tarkify"
	description="Confirm your email address to activate your Tarkify account."
	ogImage="/og-image.svg"
	ogType="website"
/>

<AuthLayout title="Verify your email" subtitle="Confirming your email address to secure your account.">
	{#if status === 'loading'}
		<div class="verify-state" role="status" aria-live="polite">
			<Loading size={28} />
			<p>Verifying your email address…</p>
		</div>
	{:else if status === 'success'}
		<div class="verify-state" role="status" aria-live="polite">
			<CheckCircle size={48} class="text-accent-green" aria-hidden="true" />
			<h3>Email verified successfully</h3>
			<p>Redirecting you to your account…</p>
		</div>
	{:else}
		<div class="verify-state" role="alert" aria-live="polite">
			<Alert type="error">{errorMessage}</Alert>
			<a href="/account/login" class="btn btn-primary btn-full">Back to Login</a>
		</div>
	{/if}
</AuthLayout>

<style>
	.verify-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.875rem;
		text-align: center;
		padding: 0.5rem 0;
	}

	.verify-state :global(.text-accent-green) {
		color: var(--color-accent-green);
	}

	.verify-state h3 {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.verify-state p {
		font-size: 0.9rem;
		opacity: 0.7;
		margin: 0;
		line-height: 1.6;
	}

	.verify-state :global(.btn-full) {
		margin-top: 0.5rem;
	}
</style>
