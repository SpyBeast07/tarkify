<script lang="ts">
	const integrations = [
		{ name: 'Slack', icon: '/assets/logos/slack.png' },
		{ name: 'HubSpot', icon: '/assets/logos/hubspot.svg' },
		{ name: 'Gmail', icon: '/assets/logos/gmail.svg' },
		{ name: 'Discord', icon: '/assets/logos/discord.svg' },
		{ name: 'Notion', icon: '/assets/logos/notion.svg' },
		{ name: 'Salesforce', icon: '/assets/logos/salesforce.svg' }
	];

	const loopedIntegrations = [...integrations, ...integrations, ...integrations];
</script>

<section class="section integrations">
	<div class="container">
		<div class="text-center mb-12">
			<p class="section-badge">Integrations</p>
			<h2 class="text-2xl font-bold opacity-80">Works with your favorite tools</h2>
		</div>

		<div class="integration-wrapper">
			<div class="integration-track">
				{#each loopedIntegrations as item, i (`${item.name}-${i}`)}
					<div class="integration-item glass">
						<img
							src={item.icon}
							alt={`${item.name} logo`}
							width="24"
							height="24"
							loading="lazy"
							decoding="async"
						/>
						<span>{item.name}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.integration-track {
		display: flex;
		gap: 2rem;
		width: max-content;
		animation: scroll 30s linear infinite;
	}

	@keyframes scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(calc(-100% / 3));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.integration-track {
			animation: none !important;
			flex-wrap: wrap;
			justify-content: center;
			width: 100%;
		}
	}
</style>
