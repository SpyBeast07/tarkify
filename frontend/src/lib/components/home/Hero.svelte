<script lang="ts">
	import { ArrowRight, Zap } from '@lucide/svelte';
	import Button from '../ui/Button.svelte';
	import AgentSimulator from './AgentSimulator.svelte';
</script>

<section class="hero">
	<div class="container hero-container">
		<div class="hero-content">
			<div class="hero-badge">
				<Zap size={14} />
				<span>AI-Powered Automation</span>
			</div>
			<h1>Let AI Handle It.</h1>
			<p class="hero-subtext">
				We build AI agents that automate work and make life easier. So you can focus on what
				matters.
			</p>
			<div class="hero-actions">
				<Button href="/contact" class="btn-with-icon">
					<span>Book a Call</span>
					<ArrowRight size={18} />
				</Button>
				<Button href="/solutions" variant="outline">Explore Solutions</Button>
			</div>
		</div>

		<div class="hero-visual">
			<AgentSimulator />
		</div>
	</div>
</section>
