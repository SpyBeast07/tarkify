<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Menu, X, Sun, Moon, User, LogOut } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getSession, signOut } from '$lib/api/auth';

	let y = $state(0);
	let isMobileMenuOpen = $state(false);
	let isDropdownOpen = $state(false);
	let user = $state<{ name: string; email: string } | null>(null);
	let authLoaded = $state(false);

	const themeState = getContext<{ theme: 'light' | 'dark'; toggleTheme: () => void }>('theme');

	const navLinks = [
		{ name: 'Home', href: '/' },
		{ name: 'Solutions', href: '/solutions' },
		{ name: 'Discover', href: '/discover' },
		{ name: 'Careers', href: '/careers' }
	];

	async function checkSession() {
		try {
			const session = await getSession();
			user = session?.user ?? null;
		} catch {
			user = null;
		} finally {
			authLoaded = true;
		}
	}

	async function handleLogout() {
		try {
			await signOut();
		} catch {
			// ignore
		}
		user = null;
		isDropdownOpen = false;
		await goto('/');
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isMobileMenuOpen) {
			closeMobileMenu();
		}
		if (e.key === 'Escape' && isDropdownOpen) {
			isDropdownOpen = false;
		}
	}

	$effect(() => {
		checkSession();
	});
</script>

<svelte:window bind:scrollY={y} onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:body
	onclick={() => {
		if (isDropdownOpen) isDropdownOpen = false;
	}}
/>

<nav class="navbar" class:is-scrolled={y > 20} aria-label="Main navigation">
	<div class="container nav-container">
		<a href="/" class="logo" aria-label="Tarkify home">
			<span class="logo-text">Tarkify</span>
		</a>

		<div class="nav-desktop">
			<ul class="nav-links" role="list">
				{#each navLinks as link (link.href)}
					<li>
						<a
							href={link.href}
							class:active-link={$page.url.pathname === link.href}
							aria-current={$page.url.pathname === link.href ? 'page' : undefined}
						>
							{link.name}
						</a>
					</li>
				{/each}
			</ul>
			<div class="nav-actions">
				<button
					class="theme-toggle"
					onclick={() => themeState?.toggleTheme()}
					aria-label={themeState?.theme === 'light'
						? 'Switch to dark mode'
						: 'Switch to light mode'}
					aria-pressed={themeState?.theme === 'dark'}
				>
					{#if themeState?.theme === 'light'}
						<Moon size={20} />
					{:else}
						<Sun size={20} />
					{/if}
				</button>

				{#if !authLoaded}
					<div class="auth-placeholder" style="width: 80px; height: 36px;"></div>
				{:else if user}
					<div class="user-menu">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<button
							class="user-button"
							onclick={(e) => {
								e.stopPropagation();
								isDropdownOpen = !isDropdownOpen;
							}}
							aria-label="Account menu"
							aria-expanded={isDropdownOpen}
						>
							<User size={20} />
							<span class="user-name">{user.name || user.email}</span>
						</button>
						{#if isDropdownOpen}
							<div class="user-dropdown glass" transition:fly={{ y: -8, duration: 150 }}>
								<a href="/account" class="dropdown-item" onclick={() => (isDropdownOpen = false)}>
									<User size={16} />
									Account
								</a>
								<hr class="dropdown-divider" />
								<button class="dropdown-item dropdown-item-danger" onclick={handleLogout}>
									<LogOut size={16} />
									Sign Out
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<a href="/account/login" class="btn btn-primary btn-sm">Sign In</a>
				{/if}

				<a href="/contact" class="btn btn-primary btn-sm" style="display: none;">Contact Us</a>
			</div>
		</div>

		<button
			class="nav-mobile-toggle"
			onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
			aria-label={isMobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
			aria-expanded={isMobileMenuOpen}
			style="background: none; border: none;"
		>
			{#if isMobileMenuOpen}
				<X size={24} />
			{:else}
				<Menu size={24} />
			{/if}
		</button>
	</div>

	{#if isMobileMenuOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="nav-mobile-menu glass" transition:fly={{ y: -20, duration: 300 }}>
			<ul class="nav-links-mobile" role="list">
				{#each navLinks as link (link.href)}
					<li>
						<a
							href={link.href}
							onclick={closeMobileMenu}
							class:active-link={$page.url.pathname === link.href}
							aria-current={$page.url.pathname === link.href ? 'page' : undefined}
						>
							{link.name}
						</a>
					</li>
				{/each}
				<li class="mobile-auth">
					{#if user}
						<a href="/account" class="btn btn-primary btn-full" onclick={closeMobileMenu}>
							<User size={18} />
							Account
						</a>
					{:else}
						<a href="/account/login" class="btn btn-primary btn-full" onclick={closeMobileMenu}>
							Sign In
						</a>
					{/if}
				</li>
				<li>
					<a href="/contact" class="btn btn-primary btn-full" onclick={closeMobileMenu}>
						Contact Us
					</a>
				</li>
			</ul>
		</div>
	{/if}
</nav>

<style>
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-menu {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		white-space: nowrap;
		max-width: 160px;
	}

	.user-button:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.user-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 180px;
		padding: 0.5rem;
		border-radius: 12px;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		text-decoration: none;
		color: var(--color-text);
		font-size: 0.9rem;
		font-family: inherit;
		background: none;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.dropdown-item-danger {
		color: #ef4444;
	}

	.dropdown-item-danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.dropdown-divider {
		border: none;
		border-top: 1px solid var(--color-glass-border);
		margin: 0.25rem 0;
	}

	.mobile-auth {
		margin-top: 0.5rem;
	}

	.auth-placeholder {
		display: inline-block;
	}
</style>
