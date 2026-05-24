<script lang="ts">
	const integrations = [
		{ name: 'Slack', icon: 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png' },
		{ name: 'HubSpot', icon: 'https://cdn.worldvectorlogo.com/logos/hubspot.svg' },
		{ name: 'Gmail', icon: 'https://cdn.worldvectorlogo.com/logos/gmail-icon.svg' },
		{ name: 'Discord', icon: 'https://cdn.worldvectorlogo.com/logos/discord-6.svg' },
		{ name: 'Notion', icon: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg' },
		{ name: 'Salesforce', icon: 'https://cdn.worldvectorlogo.com/logos/salesforce-2.svg' }
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
						<img src={item.icon} alt={item.name} />
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
</style>
