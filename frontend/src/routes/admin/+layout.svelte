<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { signOut } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';
	import AdminLayout from '$lib/admin/components/AdminLayout.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { children } = $props();

	const authState = getContext<AuthState>('auth');

	let ready = $state(false);
	let checking = $state(true);
	let forbidden = $state(false);

	function isLoginPage() {
		return $page.url.pathname === '/admin/login';
	}

	$effect(() => {
		if (authState.loaded) {
			checking = false;

			if (isLoginPage()) {
				if (authState.user?.role === 'admin') {
					goto('/admin');
				}
				return;
			}

			if (!authState.user) {
				const currentPath = $page.url.pathname;
				const search = $page.url.search;
				goto('/admin/login' + (currentPath !== '/admin' ? '?redirect=' + encodeURIComponent(currentPath + search) : ''));
			} else if (authState.user.role !== 'admin') {
				forbidden = true;
				signOut().finally(() => {
					authState.clearUser();
					authState.broadcast();
					goto('/admin/login?error=forbidden');
				});
			} else {
				ready = true;
			}
		}
	});

	function isAdminRoute(): boolean {
		return $page.url.pathname.startsWith('/admin');
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
	title="Admin Portal | Tarkify"
	description="Tarkify Admin Portal"
	ogImage="/og-image.svg"
	ogType="website"
/>

{#if checking}
	<div class="admin-loading-screen" role="status" aria-label="Verifying session">
		<div class="admin-spinner"></div>
	</div>
{:else if forbidden}
	<div class="admin-access-denied">
		<div class="access-denied-card glass">
			<h1 class="access-denied-title">Access Denied</h1>
			<p class="access-denied-message">You do not have permission to access the Admin Portal.</p>
		</div>
	</div>
{:else if isLoginPage()}
	{@render children()}
{:else if ready}
	<AdminLayout>
		{@render children()}
	</AdminLayout>
{/if}

<style>
	.admin-loading-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: var(--color-light-bg);
	}

	.admin-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-glass-border);
		border-top-color: var(--color-accent-green);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.admin-access-denied {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: var(--color-light-bg);
		padding: 2rem;
	}

	.access-denied-card {
		max-width: 400px;
		padding: 2rem;
		border-radius: 24px;
		text-align: center;
	}

	.access-denied-title {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		color: #ef4444;
		margin: 0 0 0.75rem;
	}

	.access-denied-message {
		font-size: 0.95rem;
		opacity: 0.7;
		margin: 0;
		line-height: 1.6;
	}
</style>
