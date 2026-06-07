<script lang="ts">
	interface Orb {
		left: string;
		top: string;
		width: string;
		height: string;
		backgroundColor: string;
		animationDuration: string;
		animationDelay: string;
		floatX: string;
		floatY: string;
	}

	const orbs: Orb[] = Array.from({ length: 6 }).map((_, i) => {
		const size = 300 + Math.random() * 300;
		return {
			left: `${Math.random() * 100}%`,
			top: `${Math.random() * 100}%`,
			width: `${size}px`,
			height: `${size}px`,
			backgroundColor: i % 2 === 0 ? 'var(--color-accent-green)' : 'var(--color-secondary-green)',
			animationDuration: `${10 + Math.random() * 10}s`,
			animationDelay: `${-Math.random() * 10}s`,
			floatX: `${Math.round(Math.random() * 100 - 50)}px`,
			floatY: `${Math.round(Math.random() * 100 - 50)}px`
		};
	});
</script>

<div class="dynamic-background">
	<div class="noise-overlay"></div>
	{#each orbs as orb, i (`orb-${i}`)}
		<div
			class="bg-orb"
			style:left={orb.left}
			style:top={orb.top}
			style:width={orb.width}
			style:height={orb.height}
			style:background-color={orb.backgroundColor}
			style:animation-duration={orb.animationDuration}
			style:animation-delay={orb.animationDelay}
			style="--float-x: {orb.floatX}; --float-y: {orb.floatY};"
		></div>
	{/each}
</div>

<style>
	.dynamic-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -1;
		overflow: hidden;
		background-color: var(--color-light-bg);
		pointer-events: none;
	}

	:global([data-theme='dark']) .dynamic-background {
		background-color: var(--color-dark-green);
	}

	.noise-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
		opacity: 0.15;
		z-index: 1;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		mix-blend-mode: multiply;
		opacity: 0.3;
		animation: float-orb infinite ease-in-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.bg-orb {
			animation: none !important;
		}
	}

	:global([data-theme='dark']) .bg-orb {
		mix-blend-mode: screen;
		opacity: 0.15;
	}

	@keyframes float-orb {
		0% {
			transform: translate(0, 0) scale(1);
			opacity: 0.3;
		}
		50% {
			transform: translate(var(--float-x), var(--float-y)) scale(1.2);
			opacity: 0.5;
		}
		100% {
			transform: translate(0, 0) scale(1);
			opacity: 0.3;
		}
	}
</style>
