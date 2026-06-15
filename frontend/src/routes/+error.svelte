<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import logo from '$lib/assets/tarkify_logo.svg';

	let status = $derived($page.status);
</script>

<div class="error-page pt-32">
	<div class="container">
		<div class="error-card">
			<img src={logo} alt="Tarkify" class="error-logo" loading="lazy" decoding="async" />

			{#if status === 404}
				<div class="illustration" role="img" aria-label="Compass illustration indicating page not found">
					<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="100" cy="100" r="88" stroke="var(--color-primary-green)" stroke-width="2" opacity="0.15" fill="none" />
						<circle cx="100" cy="100" r="78" stroke="var(--color-accent-green)" stroke-width="1.5" opacity="0.2" fill="none" />
						<circle cx="100" cy="100" r="68" stroke="var(--color-primary-green)" stroke-width="1" opacity="0.1" fill="none" stroke-dasharray="4 4" />
						<!-- Tick marks -->
						<g stroke="var(--color-primary-green)" stroke-width="2" opacity="0.3">
							<line x1="100" y1="14" x2="100" y2="24" />
							<line x1="100" y1="176" x2="100" y2="186" />
							<line x1="14" y1="100" x2="24" y2="100" />
							<line x1="176" y1="100" x2="186" y2="100" />
							<line x1="39.2" y1="39.2" x2="46.2" y2="46.2" />
							<line x1="153.8" y1="153.8" x2="160.8" y2="160.8" />
							<line x1="39.2" y1="160.8" x2="46.2" y2="153.8" />
							<line x1="160.8" y1="39.2" x2="153.8" y2="46.2" />
						</g>
						<!-- Direction letters -->
						<text x="100" y="34" text-anchor="middle" fill="var(--color-accent-green)" font-family="var(--font-accent)" font-size="10" font-weight="700">N</text>
						<text x="100" y="178" text-anchor="middle" fill="var(--color-primary-green)" font-family="var(--font-accent)" font-size="10" font-weight="600" opacity="0.5">S</text>
						<text x="32" y="104" text-anchor="middle" fill="var(--color-primary-green)" font-family="var(--font-accent)" font-size="10" font-weight="600" opacity="0.5">W</text>
						<text x="168" y="104" text-anchor="middle" fill="var(--color-primary-green)" font-family="var(--font-accent)" font-size="10" font-weight="600" opacity="0.5">E</text>
						<!-- Needle -->
						<g transform="rotate(-35 100 100)">
							<polygon points="100,32 94,100 100,168 106,100" fill="var(--color-accent-green)" opacity="0.9" />
							<polygon points="100,168 94,100 100,108 106,100" fill="var(--color-accent-green)" opacity="0.4" />
							<circle cx="100" cy="100" r="6" fill="var(--color-primary-green)" />
						</g>
					</svg>
				</div>

				<h1 class="error-code">404</h1>
				<p class="error-title">Oops. We couldn't find that page.</p>

				<div class="error-actions">
					<Button href="/" variant="primary">Go Home</Button>
					<Button href="/contact" variant="outline">Contact Us</Button>
				</div>
			{:else}
				<div class="illustration" role="img" aria-label="Broken gear illustration indicating server error">
					<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
						<!-- Gear teeth -->
						<g fill="var(--color-accent-green)" opacity="0.85">
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(0 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(30 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(60 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(120 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(150 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(180 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(210 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(240 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(270 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(300 100 100)" />
							<rect x="92" y="12" width="16" height="28" rx="3" transform="rotate(330 100 100)" />
						</g>
						<!-- Missing/broken tooth -->
						<rect x="92" y="12" width="16" height="20" rx="3" transform="rotate(90 100 100)" fill="var(--color-light-bg)" />
						<path d="M96 88 L100 84 L104 88 L108 82 L104 78" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="rotate(90 100 100)" />
						<!-- Gear inner body -->
						<circle cx="100" cy="100" r="42" fill="var(--color-accent-green)" opacity="0.95" />
						<circle cx="100" cy="100" r="30" fill="var(--color-light-bg)" />
						<circle cx="100" cy="100" r="24" fill="var(--color-accent-green)" opacity="0.95" />
						<!-- Center hole -->
						<circle cx="100" cy="100" r="10" fill="var(--color-light-bg)" />
						<!-- Crack -->
						<path d="M100 90 L102 72 L98 60 L106 44" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8" />
						<path d="M102 72 L112 68" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6" />
						<!-- Small debris -->
						<circle cx="108" cy="44" r="2" fill="var(--color-accent-green)" opacity="0.6" />
						<circle cx="114" cy="52" r="1.5" fill="var(--color-accent-green)" opacity="0.4" />
						<circle cx="94" cy="38" r="1.5" fill="var(--color-accent-green)" opacity="0.5" />
					</svg>
				</div>

				<h1 class="error-code">{status}</h1>
				<p class="error-title">Something went wrong.</p>
				<p class="error-subtitle">Please try again later.</p>

				<div class="error-actions">
					<Button href="/" variant="primary">Go Home</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 480px;
		margin: 0 auto;
		padding: var(--spacing-lg);
	}

	.error-logo {
		width: 100px;
		height: 100px;
		border-radius: 24px;
		margin-bottom: var(--spacing-lg);
	}

	.illustration {
		width: 160px;
		height: 160px;
		margin-bottom: var(--spacing-md);
	}

	.error-code {
		font-family: var(--font-heading);
		font-size: 6rem;
		font-weight: 800;
		line-height: 1;
		color: var(--color-accent-green);
		margin-bottom: var(--spacing-sm);
	}

	.error-title {
		font-size: 1.25rem;
		color: var(--color-primary-green);
		margin-bottom: var(--spacing-xs);
		opacity: 0.9;
	}

	.error-subtitle {
		font-size: 1rem;
		opacity: 0.6;
		margin-bottom: var(--spacing-sm);
	}

	.error-actions {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		flex-wrap: wrap;
		justify-content: center;
	}
</style>
