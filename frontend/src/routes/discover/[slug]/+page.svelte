<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { ArrowLeft, Clock, Calendar, Share2, ChevronRight } from '@lucide/svelte';
	import { discoverData } from '$lib/data/discover';
	import { parseMarkdown } from '$lib/utils/markdown';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let slug = $derived($page.params.slug);
	let article = $derived(discoverData.find((a) => a.slug === slug));
	let origin = $derived($page.url.origin);

	let articleJsonLd = $derived(
		article
			? {
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: article.title,
					description: article.excerpt,
					datePublished: article.date,
					author: {
						'@type': 'Organization',
						name: 'Tarkify'
					},
					publisher: {
						'@type': 'Organization',
						name: 'Tarkify'
					}
				}
			: undefined
	);

	let breadcrumbLd = $derived(
		article
			? {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					itemListElement: [
						{ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
						{ '@type': 'ListItem', position: 2, name: 'Discover', item: origin + '/discover' },
						{ '@type': 'ListItem', position: 3, name: article.title, item: origin + $page.url.pathname }
					]
				}
			: undefined
	);

	let jsonLd = $derived(
		article
			? [articleJsonLd, breadcrumbLd].filter(Boolean) as Record<string, unknown>[]
			: undefined
	);

	function handleShare() {
		if (typeof window !== 'undefined') {
			navigator.clipboard.writeText(window.location.href).then(() => {
				alert('Link copied!');
			});
		}
	}
</script>

{#if article}
	<Seo
		title="{article.title} | Tarkify"
		description={article.excerpt}
		ogImage="/og-image.svg"
		ogType="article"
		jsonLd={jsonLd}
	/>
{:else}
	<Seo title="Article Not Found | Tarkify" description="The requested article does not exist." ogImage="/og-image.svg" />
{/if}

{#if !article}
	<div class="pt-32 pb-20 text-center">
		<div class="container">
			<span class="section-badge">404</span>
			<h1>Article Not Found</h1>
			<p class="opacity-70 mt-4 mb-8">The article you are looking for does not exist.</p>
			<a href="/discover" class="btn btn-primary">Back to Discover</a>
		</div>
	</div>
{:else}
	<div class="discover-detail-page">
		<div class="container max-w-[800px]">
			<!-- Breadcrumb -->
			<div transition:fly={{ x: -10, duration: 400 }} class="discover-breadcrumb">
				<a href="/discover" class="flex items-center gap-1">
					<ArrowLeft size={15} /> Discover
				</a>
				<ChevronRight size={13} />
				<span>{article.category}</span>
			</div>

			<!-- Article Header -->
			<div transition:fly={{ y: 20, duration: 400, delay: 100 }} class="article-header">
				<span class="article-category-pill">{article.category}</span>
				<h1>{article.title}</h1>
				<p class="article-excerpt">{article.excerpt}</p>

				<div class="article-meta-bar">
					<div class="article-meta">
						<span class="flex items-center gap-1"><Calendar size={15} /> {article.date}</span>
						<span class="flex items-center gap-1"><Clock size={15} /> {article.readTime}</span>
					</div>
					<button class="share-btn flex items-center gap-1" onclick={handleShare}>
						<Share2 size={15} /> Share
					</button>
				</div>
			</div>

			<article transition:fly={{ duration: 800, delay: 250 }} class="prose mb-20">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html parseMarkdown(article.content)}
			</article>
		</div>

		<div class="container border-t border-glass-border pt-16">
			<Newsletter />
		</div>
	</div>
{/if}
