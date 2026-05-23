<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { Component } from 'svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		title: string;
		description: string;
		features?: string[];
		icon?: Component<{ size?: number; class?: string }>;
		iconSnippet?: Snippet;
		buttonText?: string;
		onButtonClick?: () => void;
		delay?: number;
		comingSoon?: boolean;
	}

	let {
		title,
		description,
		features = [],
		icon,
		iconSnippet,
		buttonText = 'Learn More',
		onButtonClick,
		delay = 0,
		comingSoon = false
	}: Props = $props();
</script>

<div
	transition:fly={{ y: 20, duration: 400, delay: delay * 1000 }}
	class="product-card glass {comingSoon ? 'card-coming-soon' : ''}"
>
	{#if icon || iconSnippet}
		<div class="product-icon-wrapper">
			{#if iconSnippet}
				{@render iconSnippet()}
			{:else if icon}
				{@const IconComp = icon}
				<IconComp size={24} />
			{/if}
		</div>
	{/if}
	
	<h3>
		{title}
		{#if comingSoon}
			<span class="coming-soon-badge">Soon</span>
		{/if}
	</h3>
	
	<p class="product-description">{description}</p>
	
	{#if features && features.length > 0}
		<ul class="product-features">
			{#each features as feature}
				<li class="product-feature-item">
					<span class="feature-dot"></span>
					<span>{feature}</span>
				</li>
			{/each}
		</ul>
	{/if}
	
	<button 
		class="btn product-btn {comingSoon ? 'btn-secondary btn-disabled' : 'btn-primary'}" 
		onclick={comingSoon ? undefined : onButtonClick}
		disabled={comingSoon}
	>
		{comingSoon ? 'Coming Soon' : buttonText}
	</button>
</div>
