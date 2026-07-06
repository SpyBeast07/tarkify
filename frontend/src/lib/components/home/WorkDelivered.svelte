<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, BarChart2, MessageSquare } from '@lucide/svelte';
	import { workProjects, type WorkProject } from '$lib/data/work-delivered';

	// ── State ──────────────────────────────────────────────────────────────────
	let currentIndex = $state(0);
	let isAnimating = $state(false);
	let direction = $state<'next' | 'prev'>('next');
	let prefersReducedMotion = $state(false);

	// Active tab per project: 'study' | 'review'
	let activeTab = $state<Record<string, 'study' | 'review'>>({});

	// Per-project live preview image state
	// true = live screenshot loaded successfully, false = show static fallback
	let liveLoaded = $state<Record<string, boolean>>({});

	// Touch / swipe
	let touchStartX = $state(0);
	let touchStartY = $state(0);
	let isDragging = $state(false);

	// Reveal-on-scroll
	let sectionEl: HTMLElement | undefined = $state();
	let revealed = $state(false);

	/** Build a thum.io live screenshot URL for any website */
	function livePreviewSrc(url: string): string {
		return `https://image.thum.io/get/width/1280/crop/800/noanimate/${url}`;
	}

	const projects: WorkProject[] = workProjects;
	const total = projects.length;

	// ── Helpers ────────────────────────────────────────────────────────────────
	function getTab(id: string): 'study' | 'review' {
		return activeTab[id] ?? 'study';
	}

	function setTab(id: string, tab: 'study' | 'review') {
		activeTab = { ...activeTab, [id]: tab };
	}

	function navigate(dir: 'next' | 'prev') {
		if (isAnimating || total <= 1) return;
		direction = dir;
		isAnimating = true;
		setTimeout(
			() => {
				currentIndex =
					dir === 'next' ? (currentIndex + 1) % total : (currentIndex - 1 + total) % total;
				isAnimating = false;
			},
			prefersReducedMotion ? 0 : 380
		);
	}

	function goTo(index: number) {
		if (isAnimating || index === currentIndex) return;
		direction = index > currentIndex ? 'next' : 'prev';
		isAnimating = true;
		setTimeout(
			() => {
				currentIndex = index;
				isAnimating = false;
			},
			prefersReducedMotion ? 0 : 380
		);
	}

	// ── Touch ──────────────────────────────────────────────────────────────────
	function onTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].clientX;
		touchStartY = e.changedTouches[0].clientY;
		isDragging = true;
	}

	function onTouchEnd(e: TouchEvent) {
		if (!isDragging) return;
		isDragging = false;
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
			navigate(dx < 0 ? 'next' : 'prev');
		}
	}

	// ── Live preview image ────────────────────────────────────────────────────
	function handleLiveLoad(id: string) {
		liveLoaded = { ...liveLoaded, [id]: true };
	}

	// ── Keyboard ──────────────────────────────────────────────────────────────
	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') navigate('prev');
		if (e.key === 'ArrowRight') navigate('next');
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────
	onMount(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mq.matches;
		const mqH = (ev: MediaQueryListEvent) => (prefersReducedMotion = ev.matches);
		mq.addEventListener('change', mqH);

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					revealed = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.08 }
		);
		if (sectionEl) observer.observe(sectionEl);

		return () => {
			mq.removeEventListener('change', mqH);
			observer.disconnect();
		};
	});

	const project = $derived(projects[currentIndex]);
</script>

<!-- ───────────────────────────────────────────────────────────────────────── -->
<section
	id="work-delivered"
	class="section work-delivered"
	bind:this={sectionEl}
	aria-roledescription="carousel"
	aria-label="Work We've Delivered"
>
	<div class="container">
		<!-- Header -->
		<div class="section-header text-center reveal" class:active={revealed}>
			<span class="section-badge">Portfolio</span>
			<h2>Work We've Delivered</h2>
			<p class="section-subtext">
				Real projects, real results — a look at what we've built for our clients.
			</p>
		</div>

		<!-- Carousel -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="carousel-wrapper reveal"
			class:active={revealed}
			role="region"
			aria-live="polite"
			aria-atomic="true"
			ontouchstart={onTouchStart}
			ontouchend={onTouchEnd}
			onkeydown={onKeyDown}
		>
			<!-- Card -->
			<article
				class="project-card"
				class:slide-next={isAnimating && direction === 'next'}
				class:slide-prev={isAnimating && direction === 'prev'}
				aria-label="Project {currentIndex + 1} of {total}: {project.clientName}"
			>
				<!-- ═══ LEFT — accent panel + browser mockup ═══ -->
				<div class="visual-panel" style="background-color: {project.accentColor};">
					<div class="browser-mockup">
						<!-- Mac-style chrome with URL bar -->
						<div class="chrome-bar" aria-hidden="true">
							<div class="chrome-dots">
								<span class="cdot red"></span>
								<span class="cdot yellow"></span>
								<span class="cdot green"></span>
							</div>
							<div class="chrome-url-bar">
								<span class="chrome-url-text">{project.websiteUrl.replace(/^https?:\/\//, '')}</span>
							</div>
						</div>

						<!-- Viewport -->
						<div class="mockup-viewport">
							<!-- Static screenshot: always shown as immediate placeholder -->
							<img
								src={project.screenshotUrl}
								alt="{project.clientName} website screenshot"
								class="mockup-screenshot"
								class:screenshot-hidden={liveLoaded[project.id]}
								decoding="async"
							/>
							<!-- Live website preview via screenshot service (bypasses X-Frame-Options) -->
							<img
								src={livePreviewSrc(project.websiteUrl)}
								alt="Live preview of {project.clientName}"
								class="mockup-live"
								class:live-visible={liveLoaded[project.id]}
								onload={() => handleLiveLoad(project.id)}
								decoding="async"
							/>
						</div>
					</div>
				</div>

				<!-- ═══ RIGHT — project details ═══ -->
				<div class="details-panel">
					<!-- Category -->
					<p class="proj-category">{project.category}</p>

					<!-- Client name — big display heading -->
					<h3 class="proj-title">{project.clientName}</h3>

					<!-- Result badge -->
					{#if project.resultBadge}
						<div class="result-badge" aria-label="Result: {project.resultBadge}">
							{project.resultBadge}
						</div>
					{/if}

					<!-- Summary -->
					<p class="proj-summary">{project.summary}</p>

					<!-- ── Toggle tabs ── -->
					<div class="toggle-tabs" role="tablist" aria-label="Project information tabs">
						<button
							class="toggle-btn"
							class:tab-active={getTab(project.id) === 'study'}
							onclick={() => setTab(project.id, 'study')}
							role="tab"
							aria-selected={getTab(project.id) === 'study'}
							id="tab-study-{project.id}"
							aria-controls="panel-study-{project.id}"
						>
							<BarChart2 size={14} aria-hidden="true" />
							Case Study
						</button>
						{#if project.testimonial}
							<button
								class="toggle-btn"
								class:tab-active={getTab(project.id) === 'review'}
								onclick={() => setTab(project.id, 'review')}
								role="tab"
								aria-selected={getTab(project.id) === 'review'}
								id="tab-review-{project.id}"
								aria-controls="panel-review-{project.id}"
							>
								<MessageSquare size={14} aria-hidden="true" />
								Client Review
							</button>
						{/if}
					</div>

					<div class="tab-divider" aria-hidden="true"></div>

					<!-- ── Panels ── -->
					<div class="project-panel-container">
						<!-- Case Study panel -->
						<div
							class="tab-panel"
							class:panel-visible={getTab(project.id) === 'study'}
							role="tabpanel"
							id="panel-study-{project.id}"
							aria-labelledby="tab-study-{project.id}"
							hidden={getTab(project.id) !== 'study'}
						>
							<div class="cs-item">
								<strong>The Challenge</strong>
								<p>{project.challenge}</p>
							</div>
							<div class="cs-item">
								<strong>The Solution</strong>
								<p>{project.solution}</p>
							</div>
						</div>

						<!-- Client Review panel -->
						{#if project.testimonial}
							<div
								class="tab-panel"
								class:panel-visible={getTab(project.id) === 'review'}
								role="tabpanel"
								id="panel-review-{project.id}"
								aria-labelledby="tab-review-{project.id}"
								hidden={getTab(project.id) !== 'review'}
							>
								<blockquote class="testimonial-block">
									<p class="t-quote">"{project.testimonial.quote}"</p>
									<footer class="t-footer">
										<div class="t-avatar" aria-hidden="true">
											{project.clientName.charAt(0)}
										</div>
										<div class="t-meta">
											<cite class="t-author">{project.testimonial.author}</cite>
											<span class="t-role">{project.testimonial.role}</span>
										</div>
									</footer>
								</blockquote>
							</div>
						{/if}
					</div>
				</div>
			</article>

			<!-- Nav (multiple projects only) -->
			{#if total > 1}
				<div class="carousel-nav" aria-label="Carousel navigation">
					<button
						class="nav-btn"
						onclick={() => navigate('prev')}
						aria-label="Previous project"
						disabled={isAnimating}
					>
						<ChevronLeft size={20} aria-hidden="true" />
					</button>

					<div class="dot-row" role="tablist" aria-label="Project indicators">
						{#each projects as p, i (p.id)}
							<button
								class="dot"
								class:dot-active={i === currentIndex}
								onclick={() => goTo(i)}
								role="tab"
								aria-selected={i === currentIndex}
								aria-label="Go to project {i + 1}: {p.clientName}"
							></button>
						{/each}
					</div>

					<button
						class="nav-btn"
						onclick={() => navigate('next')}
						aria-label="Next project"
						disabled={isAnimating}
					>
						<ChevronRight size={20} aria-hidden="true" />
					</button>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	/* ══ Section ════════════════════════════════════════════════════════════════ */
	.work-delivered {
		position: relative;
	}

	/* ══ Carousel wrapper ═══════════════════════════════════════════════════════ */
	.carousel-wrapper {
		position: relative;
	}

	/* ══ Card ═══════════════════════════════════════════════════════════════════ */
	.project-card {
		display: grid;
		grid-template-columns: 42fr 58fr;
		border-radius: 20px;
		overflow: hidden;
		/* Outer card border matching the reference */
		border: 2px solid var(--color-primary-green);
		box-shadow:
			4px 4px 0 0 var(--color-primary-green),
			0 20px 60px rgba(0, 0, 0, 0.12);
		background: var(--color-card-bg);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		transition:
			opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.38s cubic-bezier(0.4, 0, 0.2, 1);
		height: 540px; /* Fixed height on desktop */
	}

	.project-card.slide-next {
		opacity: 0;
		transform: translateX(48px);
	}
	.project-card.slide-prev {
		opacity: 0;
		transform: translateX(-48px);
	}

	/* ══ Visual panel (left) ════════════════════════════════════════════════════ */
	.visual-panel {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		height: 100%;
		position: relative;
	}

	/* ══ Browser mockup ═════════════════════════════════════════════════════════ */
	.browser-mockup {
		width: 100%;
		max-width: 420px;
		aspect-ratio: 16 / 10;
		display: flex;
		flex-direction: column;
		border-radius: 10px;
		overflow: hidden;
		box-shadow:
			0 32px 64px rgba(0, 0, 0, 0.4),
			0 8px 24px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
		background: #fff;
	}

	/* Chrome bar */
	.chrome-bar {
		height: 28px;
		min-height: 28px;
		background: #efefef;
		border-bottom: 1px solid #ddd;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		flex-shrink: 0;
		overflow: hidden;
	}

	.chrome-url-bar {
		flex: 1;
		background: #fff;
		border: 1px solid #d0d0d0;
		border-radius: 4px;
		height: 16px;
		display: flex;
		align-items: center;
		padding: 0 6px;
		overflow: hidden;
	}

	.chrome-url-text {
		font-size: 8px;
		color: #555;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		letter-spacing: 0;
	}

	.chrome-dots {
		display: flex;
		gap: 5px;
	}

	.cdot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.cdot.red {
		background: #ff5f56;
		border: 1px solid #e0443e;
	}
	.cdot.yellow {
		background: #ffbd2e;
		border: 1px solid #dea123;
	}
	.cdot.green {
		background: #27c93f;
		border: 1px solid #1aab29;
	}

	/* Viewport */
	.mockup-viewport {
		flex: 1;
		position: relative;
		overflow: hidden;
		background: #fff;
		container-type: size; /* enables cqh units inside */
	}

	/* Static placeholder screenshot — always rendered beneath the live image */
	.mockup-screenshot {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		z-index: 1;
		transition: opacity 0.5s ease;
	}

	.mockup-screenshot.screenshot-hidden {
		opacity: 0;
	}

	/* Live website preview image from screenshot service */
	.mockup-live {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		z-index: 2;
		opacity: 0;
		transition: opacity 0.5s ease;
	}

	.mockup-live.live-visible {
		opacity: 1;
	}

	/* ══ Details panel (right) ══════════════════════════════════════════════════ */
	.details-panel {
		padding: 2rem 2.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		background: var(--color-card-bg);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		height: 100%;
		box-sizing: border-box;
	}

	/* Category */
	.proj-category {
		font-family: var(--font-accent);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: var(--color-text);
		opacity: 0.5;
		margin: 0;
	}

	/* Client name — large display */
	.proj-title {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 3.5vw, 2.6rem);
		font-weight: 800;
		line-height: 1.05;
		color: var(--color-primary-green);
		margin: 0;
		letter-spacing: -1px;
	}

	/* Result badge — solid green pill */
	.result-badge {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.3rem;
		background: var(--color-accent-green);
		color: #fff;
		font-family: var(--font-accent);
		font-size: 0.78rem;
		font-weight: 700;
		padding: 0.3rem 0.85rem;
		border-radius: 999px;
		letter-spacing: 0.2px;
	}

	:global([data-theme='dark']) .result-badge {
		background: var(--color-secondary-green);
	}

	/* Summary */
	.proj-summary {
		font-size: 0.9rem;
		line-height: 1.6;
		opacity: 0.78;
		margin: 0;
	}

	/* ── Toggle tabs ─────────────────────────────────────────────────────────── */
	.toggle-tabs {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.25rem;
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-accent);
		font-size: 0.84rem;
		font-weight: 600;
		padding: 0.5rem 1.15rem;
		border-radius: 999px;
		cursor: pointer;
		transition: var(--transition-smooth);
		/* Default: outline style */
		background: transparent;
		border: 1.5px solid var(--color-glass-border);
		color: var(--color-text);
		opacity: 0.65;
	}

	.toggle-btn:hover {
		opacity: 1;
		border-color: var(--color-accent-green);
		color: var(--color-accent-green);
	}

	/* Active: filled */
	.toggle-btn.tab-active {
		background: var(--color-accent-green);
		border-color: var(--color-accent-green);
		color: #fff;
		opacity: 1;
	}

	.tab-divider {
		height: 1px;
		background: rgba(39, 59, 9, 0.15);
		margin: 0;
	}

	:global([data-theme='dark']) .tab-divider {
		background: rgba(255, 255, 255, 0.15);
	}

	/* Panel container to lock height and prevent tab-switching from shifting card height */
	.project-panel-container {
		height: 220px;
		min-height: 220px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	/* ── Panels ──────────────────────────────────────────────────────────────── */
	.tab-panel {
		display: none;
		flex-direction: column;
		gap: 0.75rem;
		animation: fadeUp 0.22s ease forwards;
	}

	.tab-panel.panel-visible {
		display: flex;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Case study plain items — no box, just bold label + text */
	.cs-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.cs-item strong {
		font-family: var(--font-accent);
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary-green);
	}

	.cs-item p {
		font-size: 0.88rem;
		line-height: 1.65;
		opacity: 0.75;
		margin: 0;
	}

	/* Testimonial */
	.testimonial-block {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.t-quote {
		font-size: 0.92rem;
		line-height: 1.72;
		font-style: italic;
		opacity: 0.85;
		margin: 0;
	}

	.t-footer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.t-avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--color-accent-green);
		color: #fff;
		font-family: var(--font-heading);
		font-weight: 800;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.t-meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.t-author {
		font-family: var(--font-accent);
		font-size: 0.85rem;
		font-weight: 700;
		font-style: normal;
		color: var(--color-primary-green);
	}

	.t-role {
		font-size: 0.78rem;
		opacity: 0.6;
	}

	/* ══ Navigation ════════════════════════════════════════════════════════════ */
	.carousel-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		margin-top: 2rem;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid var(--color-glass-border);
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
		color: var(--color-primary-green);
		cursor: pointer;
		transition: var(--transition-smooth);
	}

	.nav-btn:hover:not(:disabled) {
		border-color: var(--color-accent-green);
		color: var(--color-accent-green);
		transform: scale(1.08);
		box-shadow: 0 4px 16px rgba(123, 144, 75, 0.2);
	}

	.nav-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dot-row {
		display: flex;
		gap: 0.5rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(123, 144, 75, 0.3);
		border: none;
		cursor: pointer;
		transition: var(--transition-smooth);
		padding: 0;
	}

	.dot.dot-active {
		background: var(--color-accent-green);
		width: 24px;
		border-radius: 4px;
	}

	.dot:hover:not(.dot-active) {
		background: rgba(123, 144, 75, 0.6);
	}

	/* ══ Responsive ════════════════════════════════════════════════════════════ */
	@media (max-width: 1024px) {
		.project-card {
			grid-template-columns: 1fr;
			height: auto; /* Allow auto height on mobile/tablet column flow */
		}

		.visual-panel {
			height: 300px;
			padding: 2rem;
		}

		.details-panel {
			padding: 2rem;
		}
	}

	@media (max-width: 768px) {
		.details-panel {
			padding: 1.5rem;
		}

		.proj-title {
			font-size: 1.85rem;
		}

		.visual-panel {
			padding: 1.5rem;
			height: 240px;
		}
	}

	@media (max-width: 480px) {
		.proj-title {
			font-size: 1.65rem;
		}

		.details-panel {
			padding: 1.25rem;
		}

		.visual-panel {
			padding: 1.25rem;
			height: 200px;
		}
	}

	/* ══ Reduced motion ════════════════════════════════════════════════════════ */
	@media (prefers-reduced-motion: reduce) {
		.project-card {
			transition: none !important;
		}

		.project-card.slide-next,
		.project-card.slide-prev {
			opacity: 1 !important;
			transform: none !important;
		}

		.tab-panel {
			animation: none !important;
		}

		.nav-btn:hover:not(:disabled) {
			transform: none !important;
		}
	}
</style>
