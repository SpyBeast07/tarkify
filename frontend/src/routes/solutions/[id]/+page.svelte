<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Terminal,
		Globe,
		Zap,
		Cpu,
		ShieldAlert,
		History,
		FolderCode,
		Bug,
		ShieldCheck,
		RefreshCw,
		ArrowLeft,
		ExternalLink,
		Database,
		Calendar,
		CheckCircle,
		Search,
		Shield,
		Network,
		AlertTriangle,
		ListOrdered,
		Link as LinkIcon,
		AlertCircle,
		ShoppingCart
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { solutionsData } from '$lib/data/solutions';
	import { fetchProduct, type ProductFromApi } from '$lib/api/products';
	import PurchaseModal from '$lib/components/PurchaseModal.svelte';
	import Seo from '$lib/components/Seo.svelte';

	const DEVBEASST_MOCKUP = '/assets/devbeast_mockup.webp';
	const WORKFLOW_MOCKUP = '/assets/workflow_mockup.webp';

	function getMockup(id: string): string | undefined {
		switch (id) {
			case 'devbeast':
				return DEVBEASST_MOCKUP;
			case 'workflow-orchestrator':
				return WORKFLOW_MOCKUP;
			default:
				return undefined;
		}
	}

	const DEVBEAST_SLIDES = [
		{ src: '/assets/devbeast/dashboard.png', path: 'dashboard' },
		{ src: '/assets/devbeast/containers.png', path: 'containers' },
		{ src: '/assets/devbeast/images.png', path: 'images' },
		{ src: '/assets/devbeast/volumes.png', path: 'volumes' },
		{ src: '/assets/devbeast/network.png', path: 'network' },
		{ src: '/assets/devbeast/ports.png', path: 'ports' },
		{ src: '/assets/devbeast/graph.png', path: 'graph' },
		{ src: '/assets/devbeast/schema.png', path: 'schema' },
		{ src: '/assets/devbeast/query.png', path: 'query' },
		{ src: '/assets/devbeast/workspae.png', path: 'workspace' },
		{ src: '/assets/devbeast/settings.png', path: 'settings' }
	];

	const iconMap: Record<string, Component<{ size?: number; class?: string }>> = {
		Terminal,
		Globe,
		Zap,
		Cpu,
		ShieldAlert,
		History,
		FolderCode,
		Bug,
		ShieldCheck,
		RefreshCw,
		Database,
		Calendar,
		CheckCircle,
		Search,
		Shield,
		Network,
		AlertTriangle,
		ListOrdered,
		Link: LinkIcon
	};

	let slideIndex = $state(0);
	let showPurchaseModal = $state(false);
	let productFromApi = $state<ProductFromApi | null>(null);

	let id = $derived($page.params.id);
	let solution = $derived(solutionsData.find((s) => s.id === id));
	let mockupImage = $derived(solution ? getMockup(solution.id) : undefined);

	let apiPrice = $derived(productFromApi?.price ?? null);
	let isPurchasable = $derived(!!apiPrice);
	let origin = $derived($page.url.origin);

	// Fetch authoritative price from backend API as soon as the slug is known
	$effect(() => {
		if (id) {
			fetchProduct(id).then((p) => {
				productFromApi = p;
			});
		}
	});

	function formatPrice(paise: number): string {
		const currency = productFromApi?.currency ?? 'INR';
		const value = (paise / 100).toFixed(currency === 'INR' ? 0 : 2);
		if (currency === 'INR') return `₹${value}`;
		return `${currency} ${value}`;
	}

	let breadcrumbLd = $derived(
		solution
			? {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					itemListElement: [
						{ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
						{ '@type': 'ListItem', position: 2, name: 'Solutions', item: origin + '/solutions' },
						{
							'@type': 'ListItem',
							position: 3,
							name: solution.title,
							item: origin + $page.url.pathname
						}
					]
				}
			: undefined
	);

	let seoJsonLd = $derived.by<Record<string, unknown>[] | undefined>(() => {
		if (!solution) return undefined;
		const items: Record<string, unknown>[] = [breadcrumbLd].filter(Boolean) as Record<
			string,
			unknown
		>[];

		if (apiPrice && solution.id === 'devbeast') {
			items.push({
				'@context': 'https://schema.org',
				'@type': 'SoftwareApplication',
				name: solution.title,
				operatingSystem: 'Linux, macOS, Windows',
				applicationCategory: 'DeveloperApplication',
				description: solution.description,
				offers: {
					'@type': 'Offer',
					price: String(apiPrice / 100),
					priceCurrency: productFromApi?.currency ?? 'INR'
				}
			});
			items.push({
				'@context': 'https://schema.org',
				'@type': 'Product',
				name: solution.title,
				description: solution.description,
				offers: {
					'@type': 'Offer',
					price: String(apiPrice / 100),
					priceCurrency: productFromApi?.currency ?? 'INR',
					availability: 'https://schema.org/InStock'
				}
			});
		}
		return items;
	});

	$effect(() => {
		if (id !== 'devbeast') return;
		slideIndex = 0;

		const interval = setInterval(() => {
			slideIndex = (slideIndex + 1) % DEVBEAST_SLIDES.length;
		}, 2000);

		return () => clearInterval(interval);
	});

	function handleGetStarted() {
		if (!solution) return;

		if (isPurchasable) {
			showPurchaseModal = true;
		} else {
			goto(`/contact?service=${encodeURIComponent(solution.title)}`);
		}
	}
</script>

{#if solution}
	<Seo
		title="{solution.title} | Tarkify"
		description={solution.description}
		ogImage="/og-image.svg"
		ogType="website"
		jsonLd={seoJsonLd}
	/>
{:else}
	<Seo
		title="Solution Not Found | Tarkify"
		description="The requested solution does not exist."
		ogImage="/og-image.svg"
	/>
{/if}

{#if !solution || solution.comingSoon}
	<div class="solutions-page pt-32 pb-20 text-center">
		<div class="container">
			<span class="section-badge">404</span>
			<h1>Solution Not Found</h1>
			<p class="section-subtext mb-8">
				The solution you are looking for does not exist or has been relocated.
			</p>
			<a href="/solutions" class="btn btn-primary">Back to Solutions</a>
		</div>
	</div>
{:else}
	<div class="solution-detail-page pt-32 pb-20">
		<div class="container">
			<!-- Back Navigation -->
			<div transition:fly={{ x: -10, duration: 400 }} class="back-nav-container">
				<a href="/solutions" class="back-link flex items-center gap-2">
					<ArrowLeft size={16} /> Back to Solutions
				</a>
			</div>

			<!-- Hero Showcase -->
			<div class="solution-hero-grid">
				<div transition:fly={{ y: 30, duration: 600 }} class="solution-hero-text">
					<span class="section-badge">{solution.badge}</span>
					<h1 class="solution-title">{solution.title}</h1>
					<p class="solution-tagline">{solution.description}</p>

					{#if apiPrice}
						<div class="hero-price-display">
							<span class="hero-price-val">{formatPrice(apiPrice)}</span>
							<span class="hero-price-detail">{solution.priceDetail}</span>
						</div>
					{/if}

					<div class="hero-buttons">
						{#if isPurchasable}
							<button
								onclick={handleGetStarted}
								class="btn btn-primary btn-with-icon"
								id="buy-now-hero"
							>
								Buy Now <ShoppingCart size={18} />
							</button>
						{:else}
							<button onclick={handleGetStarted} class="btn btn-primary btn-with-icon">
								Get Started <Zap size={18} />
							</button>
						{/if}
						{#if solution.githubUrl}
							<a
								href={solution.githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-outline btn-with-icon"
							>
								View Demo <ExternalLink size={18} />
							</a>
						{/if}
					</div>
				</div>

				<!-- Dashboard Mockup Display -->
				{#if mockupImage}
					<div
						transition:scale={{ start: 0.95, duration: 700, delay: 200 }}
						class="solution-mockup-container glass"
					>
						<div class="mockup-header-bar">
							<div class="mockup-dots">
								<span class="mockup-dot dot-red"></span>
								<span class="mockup-dot dot-yellow"></span>
								<span class="mockup-dot dot-green"></span>
							</div>
							<span class="mockup-address-bar">
								{#if solution.id === 'devbeast'}
									localhost:5173/{DEVBEAST_SLIDES[slideIndex]?.path || 'dashboard'}
								{:else}
									{solution.title.toLowerCase()}.tarkify.ai/dashboard
								{/if}
							</span>
						</div>

						{#if solution.id === 'devbeast'}
							<div style="position: relative; overflow: hidden;">
								{#key slideIndex}
									<img
										src={DEVBEAST_SLIDES[slideIndex]?.src || ''}
										alt="DevBeast Interface Slide"
										class="mockup-image"
										style="aspect-ratio: 2940 / 1602; object-fit: cover;"
										width="1200"
										height="654"
										loading="lazy"
										decoding="async"
										onerror={(e) => {
											(e.target as HTMLImageElement).style.display = 'none';
										}}
										in:fade={{ duration: 150 }}
									/>
								{/key}
							</div>
						{:else}
							<img
								src={mockupImage}
								alt="{solution.title} Dashboard Mockup"
								class="mockup-image"
								width="1200"
								height="1125"
								loading="lazy"
								decoding="async"
								onerror={(e) => {
									(e.target as HTMLImageElement).style.display = 'none';
								}}
							/>
						{/if}
					</div>
				{/if}
			</div>

			<!-- About Section -->
			<div transition:fly={{ y: 20, duration: 400, delay: 250 }} class="about-block glass">
				<h2>About the Solution</h2>
				<p>{solution.about}</p>
			</div>

			<!-- Problem vs WhyUs Grid -->
			<div class="problem-solution-grid">
				<!-- Problem -->
				{#if solution.problem}
					<div transition:fly={{ x: -20, duration: 400, delay: 300 }} class="problem-card glass">
						<h3 class="problem-title flex items-center gap-2">
							<AlertCircle size={24} /> The Problem
						</h3>
						<p class="problem-subtitle">{solution.problem.title}</p>
						<ul class="problem-list">
							{#each solution.problem.points as pt, idx (`pt-${idx}`)}
								<li class="problem-item">
									<span class="bullet-point">•</span>
									<span class="bullet-text">{pt}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Why Us -->
				{#if solution.whyUs}
					<div transition:fly={{ x: 20, duration: 400, delay: 350 }} class="why-us-card glass">
						<h3 class="why-us-title flex items-center gap-2">
							<CheckCircle size={24} /> Why {solution.title}?
						</h3>
						<p class="why-us-subtitle">{solution.whyUs.title}</p>
						<ul class="why-us-list">
							{#each solution.whyUs.points as pt, idx (`why-${idx}`)}
								<li class="why-us-item">
									<span class="point-title">{pt.title}</span>
									<span class="point-desc">{pt.description}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<!-- Pillars Grid -->
			{#if solution.pillars}
				<div class="pillars-section">
					<div
						transition:fly={{ y: 20, duration: 400, delay: 400 }}
						class="section-header text-center"
					>
						<span class="section-badge">Structural Design</span>
						<h2>Key Diagnostic Pillars</h2>
					</div>

					<div class="pillars-grid">
						{#each solution.pillars as pillar, idx (pillar.title)}
							{@const IconComp = iconMap[pillar.iconName]}
							<div
								transition:fly={{ y: 15, duration: 400, delay: 450 + idx * 50 }}
								class="pillar-card glass"
							>
								<div class="pillar-header">
									<div class="pillar-icon-box flex items-center justify-center">
										{#if IconComp}
											<IconComp size={22} />
										{:else}
											<Zap size={22} />
										{/if}
									</div>
									<div class="pillar-headings">
										<h3 class="pillar-title-text">{pillar.title}</h3>
										<span class="pillar-subtitle-text">{pillar.subtitle}</span>
									</div>
								</div>
								<p class="pillar-description-text">{pillar.description}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Real-World Workflows at the bottom -->
			{#if solution.workflows}
				<div class="workflows-section">
					<div
						transition:fly={{ y: 20, duration: 400, delay: 500 }}
						class="section-header text-center"
					>
						<span class="section-badge">Usage Scenarios</span>
						<h2>Real-World Workflows</h2>
					</div>

					<div class="workflows-grid">
						{#each solution.workflows as flow, idx (flow.title)}
							{@const IconComp = iconMap[flow.iconName]}
							<div
								transition:fly={{ y: 15, duration: 400, delay: 550 + idx * 60 }}
								class="workflow-card glass"
							>
								<h3 class="workflow-title flex items-center gap-2">
									<span class="workflow-icon flex items-center justify-center">
										{#if IconComp}
											<IconComp size={22} />
										{:else}
											<Zap size={22} />
										{/if}
									</span>
									<span class="workflow-title-text">{flow.title}</span>
								</h3>
								<ul class="workflow-steps">
									{#each flow.steps as step, sIdx (`step-${sIdx}`)}
										<li class="workflow-step-item">
											<span class="step-num-badge">{sIdx + 1}</span>
											<span class="step-text">{step}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Final CTA / Pricing at the Bottom -->
			{#if apiPrice}
				<div transition:fly={{ y: 20, duration: 500 }} class="final-cta-section glass text-center">
					<span class="section-badge">Ready to Start?</span>
					<h2>Deploy {solution.title} for Your Team</h2>
					<p class="final-cta-subtext">
						Empower your development stack with full commercial capability.
					</p>

					<div class="final-price-display">
						<span class="price-val">{formatPrice(apiPrice)}</span>
						<span class="price-detail">{solution.priceDetail}</span>
					</div>

					<div class="final-cta-buttons">
						{#if isPurchasable}
							<button
								onclick={handleGetStarted}
								class="btn btn-primary btn-with-icon"
								id="buy-now-cta"
							>
								Buy Now <ShoppingCart size={18} />
							</button>
						{:else}
							<button onclick={handleGetStarted} class="btn btn-primary btn-with-icon">
								Get Started Now <Zap size={18} />
							</button>
						{/if}
						{#if solution.githubUrl}
							<a
								href={solution.githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-outline btn-with-icon"
							>
								View Demo <ExternalLink size={18} />
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Purchase Modal -->
	{#if solution && isPurchasable}
		<PurchaseModal
			bind:open={showPurchaseModal}
			productSlug={solution.id}
			productName={solution.title}
			onclose={() => (showPurchaseModal = false)}
		/>
	{/if}
{/if}
