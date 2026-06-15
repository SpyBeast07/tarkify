<script lang="ts">
	import { setContext, onMount, type Component } from 'svelte';
	import { page } from '$app/stores';
	import { createThemeState } from '$lib/context/theme.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import favicon from '$lib/assets/tarkify_logo.svg';
	import './layout.css';

	let { children } = $props();

	let InteractiveBg = $state<Component | null>(null);

	onMount(async () => {
		try {
			InteractiveBg = (await import('$lib/components/InteractiveBackground.svelte')).default;
		} catch {
			// background is non-critical — skip silently
		}
	});

	const themeState = createThemeState();
	setContext('theme', themeState);

	$effect(() => {
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
		logo: `${origin}/tarkify_logo.svg`,
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
	<link rel="icon" type="image/svg+xml" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />

	<script type="application/ld+json" data-seo="organization">
		{JSON.stringify(organizationJsonLd)}
	</script>
	<script type="application/ld+json" data-seo="website">
		{JSON.stringify(websiteJsonLd)}
	</script>
</svelte:head>

<div class="app">
	{#if InteractiveBg}
		<InteractiveBg />
	{/if}
	<Navbar />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>
