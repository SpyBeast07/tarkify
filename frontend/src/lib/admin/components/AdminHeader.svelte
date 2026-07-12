<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { Menu, LogOut, Sun, Moon } from '@lucide/svelte';
	import AdminBreadcrumbs from './AdminBreadcrumbs.svelte';
	import AdminSearch from './AdminSearch.svelte';
	import { signOut } from '$lib/api/auth';
	import type { AuthState } from '$lib/context/auth.svelte';

	interface Props {
		onToggleSidebar?: () => void;
		class?: string;
	}

	let {
		onToggleSidebar = () => {},
		class: className = ''
	}: Props = $props();

	const authState = getContext<AuthState>('auth');
	const themeState = getContext('theme') as { theme: string; toggleTheme: () => void };

	let loggingOut = $state(false);

	async function handleLogout() {
		if (loggingOut) return;
		loggingOut = true;
		try {
			await signOut();
		} catch {
			// proceed even if API fails
		}
		authState.clearUser();
		authState.broadcast();
		goto('/admin/login');
	}

	const adminName = $derived(authState.user?.name || authState.user?.email || 'Admin');

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'A';
	}
</script>

<header class="admin-header {className}">
	<div class="header-left">
		<button class="sidebar-toggle" onclick={() => onToggleSidebar()} aria-label="Toggle sidebar">
			<Menu size={20} />
		</button>
		<AdminBreadcrumbs />
	</div>

	<div class="header-right">
		<AdminSearch />
		<button
			class="header-action theme-btn"
			onclick={(e) => { e.preventDefault(); themeState.toggleTheme(); }}
			aria-label="Toggle theme"
		>
			{#if themeState.theme === 'light'}
				<Moon size={18} aria-hidden="true" />
			{:else}
				<Sun size={18} aria-hidden="true" />
			{/if}
		</button>

		<div class="admin-profile" aria-label="Admin profile">
			<span class="admin-avatar" aria-hidden="true">{getInitials(adminName)}</span>
			<span class="admin-name">{adminName}</span>
		</div>

		<button
			class="header-action logout-btn"
			onclick={handleLogout}
			disabled={loggingOut}
			aria-label="Sign out"
		>
			<LogOut size={18} aria-hidden="true" />
		</button>
	</div>
</header>

<style>
	.admin-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		min-height: 56px;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.sidebar-toggle {
		display: none;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		opacity: 0.6;
	}

	.sidebar-toggle:hover {
		opacity: 1;
		background: var(--color-glass-bg);
	}

	.header-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		opacity: 0.6;
		transition: all 0.15s ease;
	}

	.header-action:hover:not(:disabled) {
		opacity: 1;
		background: var(--color-glass-bg);
	}

	.header-action:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.logout-btn:hover:not(:disabled) {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.theme-btn {
		font-size: 0;
	}

	.admin-profile {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		border-radius: 8px;
		margin-left: 0.25rem;
	}

	.admin-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-accent-green);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.admin-name {
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	@media (max-width: 768px) {
		.admin-header {
			padding: 0.625rem 1rem;
		}

		.sidebar-toggle {
			display: flex;
		}

		.admin-name {
			display: none;
		}
	}
</style>
