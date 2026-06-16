<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Search, ArrowRight, Clock, Calendar } from '@lucide/svelte';
	import { discoverData } from '$lib/data/discover';
	import type { DiscoverArticle } from '$lib/data/discover';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import Seo from '$lib/components/Seo.svelte';

	const CATEGORIES = [
		'All',
		'Company',
		'Product Updates',
		'AI Automation',
		'Engineering',
		'Legal Tech'
	];

	let searchQuery = $state('');
	let activeCategory = $state('All');

	let filteredArticles = $derived(
		discoverData.filter((article: DiscoverArticle) => {
			const matchesSearch =
				article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
			return matchesSearch && matchesCategory;
		})
	);

	let featuredArticle = $derived(discoverData.find((a) => a.featured) || discoverData[0]);
	let isDefaultView = $derived(searchQuery === '' && activeCategory === 'All');
	let gridArticles = $derived(
		isDefaultView
			? filteredArticles.filter((a) => a.slug !== featuredArticle.slug)
			: filteredArticles
	);
</script>

<Seo
	title="Discover | Tarkify"
	description="Explore the latest insights, product updates, and knowledge on AI automation from the Tarkify team."
	ogImage="/og-image.svg"
/>

<div class="discover-page pt-32 pb-20">
	<div class="container">
		<!-- Hero -->
		<div transition:fly={{ y: 20, duration: 400 }} class="discover-hero mb-16">
			<span class="section-badge">Insights & Updates</span>
			<h1>Discover <span class="text-accent-green">Tarkify</span>.</h1>
			<p>Explore our latest thinking on AI, engineering automation, and the future of work.</p>
		</div>

		<!-- Controls: Filters + Search -->
		<div transition:fly={{ y: 10, duration: 400, delay: 100 }} class="discover-controls">
			<div class="category-tabs">
				{#each CATEGORIES as category (category)}
					<button
						onclick={() => (activeCategory = category)}
						class="filter-btn"
						class:active={activeCategory === category}
						aria-pressed={activeCategory === category}
					>
						{category}
					</button>
				{/each}
			</div>

			<div class="discover-search">
				<Search size={16} />
				<input type="text" placeholder="Search articles..." bind:value={searchQuery} />
			</div>
		</div>

		<!-- Featured Article -->
		{#if isDefaultView && featuredArticle}
			<div transition:fly={{ y: 20, duration: 400, delay: 200 }}>
				<a href="/discover/{featuredArticle.slug}" class="featured-article-card">
					<div class="featured-glow"></div>
					<span class="featured-label">Featured · {featuredArticle.category}</span>
					<h2>{featuredArticle.title}</h2>
					<p>{featuredArticle.excerpt}</p>
					<div class="article-meta">
						<span class="flex items-center gap-1"
							><Calendar size={14} /> {featuredArticle.date}</span
						>
						<span class="flex items-center gap-1"
							><Clock size={14} /> {featuredArticle.readTime}</span
						>
					</div>
				</a>
			</div>
		{/if}

		<!-- Articles Grid -->
		<div class="articles-grid">
			{#each gridArticles as article, idx (article.slug)}
				<div transition:fly={{ y: 20, duration: 350, delay: idx * 50 }}>
					<a href="/discover/{article.slug}" class="article-card">
						<span class="article-category-tag">{article.category}</span>
						<h3>{article.title}</h3>
						<p>{article.excerpt}</p>
						<div class="article-card-footer">
							<div class="article-meta">
								<span class="flex items-center gap-1"><Calendar size={13} /> {article.date}</span>
								<span class="flex items-center gap-1"><Clock size={13} /> {article.readTime}</span>
							</div>
							<div class="article-read-btn">
								<ArrowRight size={16} />
							</div>
						</div>
					</a>
				</div>
			{/each}
		</div>

		{#if filteredArticles.length === 0}
			<div class="discover-empty">
				<p>No articles found matching your criteria.</p>
			</div>
		{/if}

		<Newsletter />
	</div>
</div>
