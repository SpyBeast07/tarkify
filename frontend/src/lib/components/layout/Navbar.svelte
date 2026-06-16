<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Menu, X, Sun, Moon } from '@lucide/svelte';
	import { page } from '$app/stores';

	let y = $state(0);
	let isMobileMenuOpen = $state(false);

	const themeState = getContext<{ theme: 'light' | 'dark'; toggleTheme: () => void }>('theme');

	const navLinks = [
		{ name: 'Home', href: '/' },
		{ name: 'Solutions', href: '/solutions' },
		{ name: 'Discover', href: '/discover' },
		{ name: 'Careers', href: '/careers' }
	];

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isMobileMenuOpen) {
			closeMobileMenu();
		}
	}
</script>

<svelte:window bind:scrollY={y} onkeydown={handleKeydown} />

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
				<a href="/contact" class="btn btn-primary btn-sm">Contact Us</a>
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
				<li>
					<a href="/contact" class="btn btn-primary btn-full" onclick={closeMobileMenu}>
						Contact Us
					</a>
				</li>
			</ul>
		</div>
	{/if}
</nav>
