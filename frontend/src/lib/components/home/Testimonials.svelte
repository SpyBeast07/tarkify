<script lang="ts">
	import { onMount } from 'svelte';
	import { Quote } from '@lucide/svelte';

	const testimonialsData = [
		{
			name: 'Sarah Jenkins',
			role: 'Startup Founder',
			company: 'Nexus AI',
			text: "Tarkify's automation suite saved us from hiring a full ops team. We're scaling 3x faster with the exact same headcount."
		},
		{
			name: 'David Chen',
			role: 'Chief Technology Officer',
			company: 'FinStream',
			text: "DevBeast is the control plane we didn't know we needed. The visibility it provides into our development stack and database topologies is unmatched."
		},
		{
			name: 'Marcus Rodriguez',
			role: 'Engineering Manager',
			company: 'ScaleTech',
			text: 'Integrate Business Operating System unified our entire workflow. The cross-system integration has transformed how we measure and improve our operational efficiency.'
		},
		{
			name: 'Elena Rostova',
			role: 'Operations Lead',
			company: 'Global Logistics Inc.',
			text: 'Workflow Orchestrator has entirely eliminated our manual data entry across legacy systems. Flawless, idempotent execution every single time.'
		},
		{
			name: 'James Sterling',
			role: 'Senior Legal Counsel',
			company: 'Sterling & Partners',
			text: 'Legal Redline acts as my tireless associate. It flags compliance risks in dense SaaS agreements instantly, cutting our review time by 60%.'
		},
		{
			name: 'Priya Patel',
			role: 'VP of Product',
			company: 'DataSense',
			text: "AutoScrape Engine feeds our proprietary models with perfect data streams. It's hands-down the most reliable extraction tool we've integrated."
		}
	];

	const loopedData = [...testimonialsData, ...testimonialsData];

	let trackEl: HTMLDivElement | undefined = $state();

	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;
		const handler = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};
		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	});

	function handleMouseEnter() {
		if (trackEl && !prefersReducedMotion) {
			trackEl.style.animationPlayState = 'paused';
		}
	}

	function handleMouseLeave() {
		if (trackEl && !prefersReducedMotion) {
			trackEl.style.animationPlayState = 'running';
		}
	}
</script>

<section class="testimonials-section">
	<div class="container">
		<div style="text-align: center; margin-bottom: 4rem;">
			<span class="section-badge">Trusted Worldwide</span>
			<h2 style="margin-bottom: 1rem;">Don't just take our word for it</h2>
			<p class="section-subtext">
				See how teams across the globe are using Tarkify's AI agents to transform their operations
				and scale effortlessly.
			</p>
		</div>
	</div>

	<!-- Full-width carousel -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="testimonials-carousel-outer"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<div class="testimonials-track" bind:this={trackEl}>
			{#each loopedData as t, idx (`${t.name}-${idx}`)}
				<div class="testimonial-card">
					<Quote class="quote-icon" size={26} />
					<p class="testimonial-text">"{t.text}"</p>
					<div class="testimonial-author">
						<p class="author-name">{t.name}</p>
						<p class="author-role">{t.role}, {t.company}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
