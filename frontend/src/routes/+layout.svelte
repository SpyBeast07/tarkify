<script lang="ts">
	import { setContext } from 'svelte';
	import { page } from '$app/stores';
	import { createThemeState } from '$lib/context/theme.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import favicon from '$lib/assets/favicon.webp';
	import InteractiveBackground from '$lib/components/InteractiveBackground.svelte';
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

	let origin = $derived($page.url.origin);

	let organizationJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Tarkify',
		url: origin,
		logo: `${origin}/favicon.webp`,
		description:
			'We build AI agents that automate work and make life easier. Reclaim hours of manual work and scale your team.',
		email: 'tarkify.ai@gmail.com',
		foundingDate: '2025',
		founder: [
			{
				'@type': 'Person',
				name: 'Kushagra'
			},
			{
				'@type': 'Person',
				name: 'Ishita'
			}
		]
	});

	let websiteJsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Tarkify',
		url: origin,
		description: 'AI-Powered Automation — Build, deploy, and scale intelligent AI agents.'
	});
</script>

<svelte:head>
	<link rel="icon" type="image/webp" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
	<link rel="mask-icon" href="/favicon.svg" color="#002400" />

	<script type="application/ld+json" data-seo="organization">
		{JSON.stringify(organizationJsonLd)}
	</script>
	<script type="application/ld+json" data-seo="website">
		{JSON.stringify(websiteJsonLd)}
	</script>
</svelte:head>

<div class="app">
	<InteractiveBackground />
	<Navbar />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>
