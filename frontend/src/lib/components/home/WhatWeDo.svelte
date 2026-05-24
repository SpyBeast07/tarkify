<script lang="ts">
	import { Bot, Cpu, Settings } from '@lucide/svelte';

	const services = [
		{
			title: 'AI Agents',
			description:
				'Custom-built intelligent agents that handle complex tasks, from customer support to data analysis.',
			icon: Bot
		},
		{
			title: 'Workflow Automation',
			description:
				'Streamline your business processes with seamless integrations and automated logic.',
			icon: Settings
		},
		{
			title: 'Custom AI Solutions',
			description:
				'Bespoke AI development tailored to your specific business needs and challenges.',
			icon: Cpu
		}
	];
</script>

<section id="what-we-do" class="section what-we-do">
	<div class="container">
		<div class="section-header text-center">
			<span class="section-badge">Our Services</span>
			<h2>Intelligent Solutions for a <br /> Modern World.</h2>
		</div>

		<div class="services-grid">
			{#each services as service (service.title)}
				{@const Icon = service.icon}
				<div class="service-card glass">
					<div class="service-icon">
						<Icon class="accent-icon" />
					</div>
					<h3>{service.title}</h3>
					<p>{service.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
