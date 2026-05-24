<script lang="ts">
	import { Search, Code, CheckCircle } from '@lucide/svelte';

	const steps = [
		{
			number: '01',
			title: 'We study your workflow',
			description:
				'We analyze your current processes to identify bottlenecks and automation opportunities.',
			icon: Search
		},
		{
			number: '02',
			title: 'We build AI agents',
			description:
				'Our engineers design and develop specialized AI agents tailored to your requirements.',
			icon: Code
		},
		{
			number: '03',
			title: 'Your work gets automated',
			description:
				'Deploy agents that work 24/7, allowing you to focus on high-impact strategic work.',
			icon: CheckCircle
		}
	];
</script>

<section id="how-it-works" class="section how-it-works">
	<div class="container">
		<div class="section-header text-center">
			<span class="section-badge">Process</span>
			<h2>How It Works</h2>
		</div>

		<div class="steps-container">
			{#each steps as step, index (step.number)}
				{@const Icon = step.icon}
				<div class="step-item">
					<div class="step-content">
						<div class="step-number">{step.number}</div>
						<div class="step-icon-wrapper">
							<Icon size={40} />
						</div>
						<h3>{step.title}</h3>
						<p>{step.description}</p>
					</div>
					{#if index < steps.length - 1}
						<div class="step-connector"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
