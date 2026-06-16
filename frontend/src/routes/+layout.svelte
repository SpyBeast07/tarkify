<script lang="ts">
	import { setContext, onMount, type Component } from 'svelte';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { createThemeState } from '$lib/context/theme.svelte';
	import { createToastState } from '$lib/context/toast.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import './layout.css';

	let { children } = $props();

	let InteractiveBg = $state<Component | null>(null);
	let isNavigating = $state(false);

	onMount(async () => {
		try {
			InteractiveBg = (await import('$lib/components/InteractiveBackground.svelte')).default;
		} catch {
			// background is non-critical — skip silently
		}
	});

	const themeState = createThemeState();
	setContext('theme', themeState);

	const toastState = createToastState();
	setContext('toast', toastState);

	$effect(() => {
		const unsub = navigating.subscribe((nav) => {
			if (nav) {
				isNavigating = true;
			} else {
				isNavigating = false;
			}
		});
		return () => unsub();
	});

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
	{@html `<script type="application/ld+json" data-seo="organization">${JSON.stringify(organizationJsonLd)}</script>`}
	{@html `<script type="application/ld+json" data-seo="website">${JSON.stringify(websiteJsonLd)}</script>`}
</svelte:head>

<!-- Skip to content link -->
<a href="#main-content" class="skip-link"> Skip to content </a>

<!-- Navigation progress bar -->
{#if isNavigating}
	<div class="progress-bar"></div>
{/if}

<div class="app">
	{#if InteractiveBg}
		<InteractiveBg />
	{/if}
	<Navbar />
	<main id="main-content" tabindex="-1">
		{@render children()}
	</main>
	<Footer />
</div>

<Toast />
