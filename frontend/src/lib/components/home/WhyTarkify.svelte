<script lang="ts">
	import { Clock, Scissors, Target } from '@lucide/svelte';

	const reasons = [
		{
			title: 'Save Time',
			description: 'Automate repetitive tasks and reclaim hours of your day.',
			icon: Clock
		},
		{
			title: 'Reduce Manual Work',
			description: 'Minimize human error and fatigue with precise AI agents.',
			icon: Scissors
		},
		{
			title: 'Focus on What Matters',
			description: 'Direct your energy towards creativity and high-level strategy.',
			icon: Target
		}
	];
</script>

<section id="why-tarkify" class="section why-tarkify">
	<div class="container">
		<div class="section-header text-center">
			<span class="section-badge">Benefits</span>
			<h2>Why Tarkify</h2>
			<p class="section-subtext">Designed for efficiency, built for the future.</p>
		</div>

		<div class="reasons-grid">
			{#each reasons as reason (reason.title)}
				{@const Icon = reason.icon}
				<div class="reason-card">
					<div class="reason-icon glass">
						<Icon size={32} />
					</div>
					<h3>{reason.title}</h3>
					<p>{reason.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
