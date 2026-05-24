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
</script>

<svelte:window bind:scrollY={y} />

<nav class="navbar" class:is-scrolled={y > 20}>
	<div class="container nav-container">
		<a href="/" class="logo">
			<span class="logo-text">Tarkify</span>
		</a>

		<div class="nav-desktop">
			<ul class="nav-links">
				{#each navLinks as link (link.href)}
					<li>
						{#if link.href.startsWith('/#')}
							<a href={link.href}>{link.name}</a>
						{:else}
							<a href={link.href} class:active-link={$page.url.pathname === link.href}>
								{link.name}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
			<div class="nav-actions">
				<button
					class="theme-toggle"
					onclick={() => themeState?.toggleTheme()}
					aria-label="Toggle Theme"
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
			aria-label="Toggle mobile menu"
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
		<div class="nav-mobile-menu glass" transition:fly={{ y: -20, duration: 300 }}>
			<ul class="nav-links-mobile">
				{#each navLinks as link (link.href)}
					<li>
						{#if link.href.startsWith('/#')}
							<a href={link.href} onclick={() => (isMobileMenuOpen = false)}>
								{link.name}
							</a>
						{:else}
							<a
								href={link.href}
								onclick={() => (isMobileMenuOpen = false)}
								class:active-link={$page.url.pathname === link.href}
							>
								{link.name}
							</a>
						{/if}
					</li>
				{/each}
				<li>
					<a
						href="/contact"
						class="btn btn-primary btn-full"
						onclick={() => (isMobileMenuOpen = false)}
					>
						Contact Us
					</a>
				</li>
			</ul>
		</div>
	{/if}
</nav>
