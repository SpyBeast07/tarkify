<script lang="ts">
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import { solutionsData } from '$lib/data/solutions';
	import FeedbackForm from '$lib/components/FeedbackForm.svelte';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
	title="Tarkify - Next-Gen Automation Tools"
	description="Powerful AI agents designed to scale your business operations effortlessly."
	ogImage="/og-image.svg"
/>

<div class="solutions-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="section-header text-center mb-16">
			<span class="section-badge">Solutions</span>
			<h1>Next-Gen Automation Tools</h1>
			<p class="section-subtext">
				Powerful AI agents designed to scale your business operations effortlessly.
			</p>
		</div>

		<div class="products-grid">
			{#each solutionsData as product, index (product.id)}
				<Card
					title={product.title}
					description={product.description}
					features={product.features}
					buttonText="Learn More"
					onButtonClick={() => goto(`/solutions/${product.id}`)}
					delay={index * 0.15}
					comingSoon={product.comingSoon || false}
				/>
			{/each}
		</div>
	</div>

	<FeedbackForm />
</div>
