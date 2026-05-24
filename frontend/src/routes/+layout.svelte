<script lang="ts">
	import { setContext } from 'svelte';
	import { page } from '$app/stores';
	import { createThemeState } from '$lib/context/theme.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import './layout.css';

	let { children } = $props();

	// Initialize theme state and register under context
	const themeState = createThemeState();
	setContext('theme', themeState);

	// Page route transition scroll-reset (equivalent to React's App.tsx scrollTo)
	$effect(() => {
		// Read page store to track pathname changes
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const pathname = $page.url.pathname;
		if (typeof window !== 'undefined') {
			window.scrollTo(0, 0);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<Navbar />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>
