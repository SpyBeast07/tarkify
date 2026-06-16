<script lang="ts">
	import { page } from '$app/stores';

	const SITE_NAME = 'Tarkify';

	let {
		title,
		description,
		canonical,
		ogImage,
		ogType = 'website',
		jsonLd
	}: {
		title: string;
		description: string;
		canonical?: string;
		ogImage?: string;
		ogType?: string;
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
	} = $props();

	let origin = $derived($page.url.origin);
	let canonicalUrl = $derived(canonical || $page.url.href);
	let ogImageUrl = $derived(
		ogImage ? (ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`) : undefined
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={SITE_NAME} />
	{#if ogImageUrl}
		<meta property="og:image" content={ogImageUrl} />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if ogImageUrl}
		<meta name="twitter:image" content={ogImageUrl} />
	{/if}

	{#if jsonLd}
		{@const ld = Array.isArray(jsonLd) ? jsonLd : [jsonLd]}
		{#each ld as item, i}
			{@html `<script type="application/ld+json" data-seo="${i}">${JSON.stringify(item)}</script>`}
		{/each}
	{/if}
</svelte:head>
