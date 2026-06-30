<script lang="ts">
	import { trustedCompanies } from '$lib/data/trusted-companies';

	const companies = trustedCompanies;
	// Duplicate lists for seamless marquee track looping (only used when length > 2)
	const duplicates = [...companies, ...companies];
	const useMarquee = companies.length > 2;
</script>

<section id="trusted-by" class="section trusted-by">
	<div class="container">
		<div class="section-header text-center">
			<span class="section-badge">Collaborations</span>
			<h2>Trusted by Our Clients</h2>
			<p class="section-subtext">
				We help forward-thinking organizations automate workflows, scale operations, and build
				intelligent AI agents.
			</p>
		</div>

		{#if useMarquee}
			<!-- Scrolling Marquee for 3+ companies -->
			<div class="marquee-container">
				<div class="marquee-track">
					<!-- First set: Accessible & Interactive (Originals) -->
					{#each companies as company (company.name)}
						<div class="company-card-wrapper">
							{#if company.website}
								<a
									href={company.website}
									target="_blank"
									rel="noopener noreferrer"
									class="company-card glass"
									title={`${company.name} - ${company.description || 'Visit website'}`}
									aria-label={`Visit ${company.name} website. ${company.description || ''}`}
								>
									<div class="logo-wrapper">
										<img
											src={company.logo}
											alt={`${company.name} logo`}
											width="140"
											height="50"
											loading="lazy"
											decoding="async"
											class="company-logo"
										/>
									</div>
									<span class="sr-only">{company.name}</span>
								</a>
							{:else}
								<div class="company-card glass" title={company.description || company.name}>
									<div class="logo-wrapper">
										<img
											src={company.logo}
											alt={`${company.name} logo`}
											width="140"
											height="50"
											loading="lazy"
											decoding="async"
											class="company-logo"
										/>
									</div>
									<span class="sr-only">{company.name}</span>
								</div>
							{/if}
						</div>
					{/each}

					<!-- Second and third sets: Purely decorative (Duplicates) -->
					{#each duplicates as company, i (i)}
						<div class="company-card-wrapper" aria-hidden="true">
							{#if company.website}
								<a
									href={company.website}
									target="_blank"
									rel="noopener noreferrer"
									class="company-card glass"
									tabindex="-1"
								>
									<div class="logo-wrapper">
										<img
											src={company.logo}
											alt=""
											width="140"
											height="50"
											loading="lazy"
											decoding="async"
											class="company-logo"
										/>
									</div>
								</a>
							{:else}
								<div class="company-card glass">
									<div class="logo-wrapper">
										<img
											src={company.logo}
											alt=""
											width="140"
											height="50"
											loading="lazy"
											decoding="async"
											class="company-logo"
										/>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Premium Static Grid Layout for 1 or 2 companies -->
			<div class="premium-grid">
				{#each companies as company (company.name)}
					{#if company.website}
						<a
							href={company.website}
							target="_blank"
							rel="noopener noreferrer"
							class="premium-card glass"
							aria-label={`Visit ${company.name} website. ${company.description || ''}`}
						>
							<div class="logo-container">
								<img
									src={company.logo}
									alt={`${company.name} logo`}
									width="160"
									height="60"
									loading="lazy"
									decoding="async"
									class="premium-logo"
								/>
							</div>
							<div class="premium-info">
								<h3>{company.name}</h3>
								{#if company.description}
									<p>{company.description}</p>
								{/if}
								<span class="visit-link">
									Visit Website <span class="arrow">→</span>
								</span>
							</div>
						</a>
					{:else}
						<div class="premium-card glass">
							<div class="logo-container">
								<img
									src={company.logo}
									alt={`${company.name} logo`}
									width="160"
									height="60"
									loading="lazy"
									decoding="async"
									class="premium-logo"
								/>
							</div>
							<div class="premium-info">
								<h3>{company.name}</h3>
								{#if company.description}
									<p>{company.description}</p>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.trusted-by {
		position: relative;
		overflow: hidden;
	}

	/* PREMIUM STATIC GRID (for <= 2 companies) */
	.premium-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 2rem;
		margin-top: 2rem;
	}

	.premium-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
		max-width: 380px;
		padding: 2.5rem 2rem;
		border-radius: 20px;
		transition: var(--transition-smooth);
		color: var(--color-text);
		text-decoration: none;
		box-sizing: border-box;
	}

	a.premium-card:hover,
	a.premium-card:focus {
		transform: translateY(-6px);
		border-color: var(--color-accent-green);
		box-shadow: 0 12px 30px rgba(123, 144, 75, 0.2);
		outline: none;
	}

	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 90px;
		width: 100%;
		margin-bottom: 1.5rem;
	}

	.premium-logo {
		max-height: 70px;
		max-width: 220px;
		width: auto;
		height: auto;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
	}

	.premium-info h3 {
		font-size: 1.5rem;
		margin-bottom: 0.75rem;
		color: var(--color-primary-green);
	}

	.premium-info p {
		font-size: 0.95rem;
		line-height: 1.5;
		opacity: 0.8;
		margin-bottom: 1.5rem;
		min-height: 48px;
	}

	.visit-link {
		font-family: var(--font-accent);
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color-accent-green);
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		transition: var(--transition-smooth);
	}

	.visit-link .arrow {
		transition: transform 0.3s ease;
	}

	a.premium-card:hover .visit-link {
		color: var(--color-primary-green);
	}

	a.premium-card:hover .visit-link .arrow {
		transform: translateX(4px);
	}

	/* MARQUEE STYLE (for 3+ companies) */
	.marquee-container {
		position: relative;
		width: 100%;
		overflow: hidden;
		padding: 1.5rem 0;
	}

	/* Fade mask overlay on sides */
	.marquee-container::before,
	.marquee-container::after {
		content: '';
		position: absolute;
		top: 0;
		width: 100px;
		height: 100%;
		z-index: 2;
		pointer-events: none;
	}

	.marquee-container::before {
		left: 0;
		background: linear-gradient(to right, var(--color-light-bg), transparent);
	}

	.marquee-container::after {
		right: 0;
		background: linear-gradient(to left, var(--color-light-bg), transparent);
	}

	.marquee-track {
		display: flex;
		gap: 2rem;
		width: max-content;
		animation: scroll 40s linear infinite;
	}

	.marquee-track:hover,
	.marquee-track:focus-within {
		animation-play-state: paused;
	}

	.company-card-wrapper {
		flex-shrink: 0;
	}

	.company-card {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 180px;
		height: 80px;
		border-radius: 12px;
		padding: 1rem;
		cursor: default;
		transition: var(--transition-smooth);
		color: var(--color-text);
		opacity: 0.75;
	}

	a.company-card {
		cursor: pointer;
	}

	a.company-card:hover,
	a.company-card:focus {
		opacity: 1;
		transform: translateY(-4px);
		color: var(--color-accent-green);
		border-color: var(--color-accent-green);
		box-shadow: 0 8px 16px rgba(123, 144, 75, 0.15);
		outline: none;
	}

	div.company-card:hover {
		opacity: 1;
		color: var(--color-primary-green);
	}

	.logo-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.company-logo {
		width: 100%;
		max-width: 140px;
		height: auto;
		max-height: 40px;
		object-fit: contain;
	}

	/* Screen Reader Only Utility */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
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
		.marquee-container::before,
		.marquee-container::after {
			display: none;
		}

		.marquee-track {
			animation: none !important;
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
			justify-content: center;
			align-items: center;
			gap: 1.5rem;
			width: 100%;
			max-width: var(--container-width);
			margin: 0 auto;
			padding: 0;
		}

		.company-card-wrapper[aria-hidden='true'] {
			display: none !important;
		}

		.company-card {
			width: 100%;
		}

		a.premium-card:hover,
		a.premium-card:focus {
			transform: none !important;
		}
	}
</style>
