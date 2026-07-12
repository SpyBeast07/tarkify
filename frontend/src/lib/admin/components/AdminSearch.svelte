<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Search,
		Loader2,
		AlertCircle,
		Package,
		ShoppingCart,
		Users,
		Mail,
		MessageSquare,
		MessageCircle,
		Send,
		Briefcase,
		Shield
	} from '@lucide/svelte';
	import { searchGlobal } from '$lib/admin/api/search';
	import { SEARCH_MODULES, type SearchResult, type SearchModule } from '$lib/admin/types/search';
	import SearchModuleBadge from './SearchModuleBadge.svelte';

	let { class: className = '' } = $props();

	let open = $state(false);
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let containerEl = $state<HTMLDivElement | null>(null);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let dropdownEl = $state<HTMLDivElement | null>(null);
	let dropdownStyle = $state<Record<string, string>>({});

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) node.parentNode.removeChild(node);
			}
		};
	}

	function reposition() {
		if (!open || !triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		dropdownStyle = {
			top: `${rect.bottom + 8}px`,
			right: `${window.innerWidth - rect.right}px`,
		};
	}

	$effect(() => {
		if (open) {
			reposition();
		}
	});

	const MODULE_ICONS: Record<SearchModule, any> = {
		products: Package,
		orders: ShoppingCart,
		customers: Users,
		emails: Mail,
		contact: MessageSquare,
		feedback: MessageCircle,
		newsletter: Send,
		careers: Briefcase,
		audit: Shield
	};

	const MODULE_LABELS: Record<SearchModule, string> = {
		products: 'Products',
		orders: 'Orders',
		customers: 'Customers',
		emails: 'Emails',
		contact: 'Contact',
		feedback: 'Feedback',
		newsletter: 'Newsletter',
		careers: 'Careers',
		audit: 'Audit Logs'
	};

	// Group results by module type
	const groupedResults = $derived.by(() => {
		const groups: Record<SearchModule, SearchResult[]> = {} as any;
		results.forEach((r) => {
			if (!groups[r.module]) {
				groups[r.module] = [];
			}
			groups[r.module].push(r);
		});
		return groups;
	});

	// Flat list of limited visible results for arrow-key navigation (max 5 per group)
	const flattenedItems = $derived.by(() => {
		const items: SearchResult[] = [];
		SEARCH_MODULES.forEach((mod) => {
			const list = groupedResults[mod] || [];
			list.slice(0, 5).forEach((item) => {
				items.push(item);
			});
		});
		return items;
	});

	// Adjust active index when results list updates
	$effect(() => {
		if (flattenedItems.length > 0) {
			if (activeIndex >= flattenedItems.length) {
				activeIndex = 0;
			}
		} else {
			activeIndex = 0;
		}
	});

	// Trigger debounced search as the user types
	$effect(() => {
		const q = query.trim();
		if (!q) {
			results = [];
			loading = false;
			error = null;
			return;
		}

		loading = true;
		error = null;

		const timer = setTimeout(async () => {
			try {
				const response = await searchGlobal(q, 'all');
				if (query.trim() === q) {
					results = response.results;
				}
			} catch (err: any) {
				if (query.trim() === q) {
					error = err?.message || 'Failed to search';
				}
			} finally {
				if (query.trim() === q) {
					loading = false;
				}
			}
		}, 250);

		return () => clearTimeout(timer);
	});

	// Lock body scroll when search is open
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});

	// Automatically focus the input when popover is toggled open
	$effect(() => {
		if (open && inputEl) {
			inputEl.focus();
		}
	});

	function toggle() {
		open = !open;
		if (open) {
			query = '';
			results = [];
			error = null;
			activeIndex = 0;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			open = false;
			e.preventDefault();
		} else if (e.key === 'ArrowDown') {
			if (flattenedItems.length > 0) {
				activeIndex = (activeIndex + 1) % flattenedItems.length;
				e.preventDefault();
				scrollIntoView(activeIndex);
			}
		} else if (e.key === 'ArrowUp') {
			if (flattenedItems.length > 0) {
				activeIndex = (activeIndex - 1 + flattenedItems.length) % flattenedItems.length;
				e.preventDefault();
				scrollIntoView(activeIndex);
			}
		} else if (e.key === 'Enter') {
			if (activeIndex >= 0 && activeIndex < flattenedItems.length) {
				const item = flattenedItems[activeIndex];
				goto(item.targetUrl);
				open = false;
				e.preventDefault();
			}
		}
	}

	function scrollIntoView(index: number) {
		setTimeout(() => {
			const activeEl = containerEl?.querySelector(`.search-item[data-index="${index}"]`);
			if (activeEl) {
				activeEl.scrollIntoView({ block: 'nearest' });
			}
		}, 10);
	}

	function triggerRetry() {
		const q = query.trim();
		if (q) {
			loading = true;
			error = null;
			searchGlobal(q, 'all')
				.then((response) => {
					results = response.results;
				})
				.catch((err) => {
					error = err?.message || 'Failed to search';
				})
				.finally(() => {
					loading = false;
				});
		}
	}

	function handleOutsideClick(e: MouseEvent) {
		if (open && containerEl && !containerEl.contains(e.target as Node)) {
			open = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleOutsideClick);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleOutsideClick);
		document.body.style.overflow = '';
	});
</script>

<div class="admin-search-wrapper {className}" bind:this={containerEl} role="search">
	<button
		class="search-trigger"
		onclick={toggle}
		aria-label="Toggle search"
		aria-expanded={open}
		bind:this={triggerEl}
	>
		<Search size={18} aria-hidden="true" />
	</button>

	{#if open}
		<div class="search-dropdown" role="dialog" aria-label="Search results" tabindex="-1" style={dropdownStyle.top ? `top:${dropdownStyle.top};right:${dropdownStyle.right}` : ''} use:portal bind:this={dropdownEl}>
			<div class="search-input-wrapper">
				<input
					type="text"
					placeholder="Search products, orders, customers..."
					bind:value={query}
					class="search-input"
					bind:this={inputEl}
					aria-label="Search query"
					onkeydown={handleKeydown}
				/>
				{#if loading}
					<span class="search-spinner">
						<Loader2 size={16} class="spin" />
					</span>
				{/if}
			</div>

			<div class="search-body">
				{#if error}
					<div class="search-error-state">
						<AlertCircle size={24} class="error-icon" />
						<p class="error-msg">{error}</p>
						<button class="retry-btn" onclick={triggerRetry}>Retry</button>
					</div>
				{:else if loading && results.length === 0}
					<div class="search-loading-state">
						<Loader2 size={24} class="spin" />
						<p>Searching Tarkify...</p>
					</div>
				{:else if query.trim() !== '' && results.length === 0 && !loading}
					<div class="search-empty-state">
						<p class="empty-title">No results found</p>
						<p class="empty-subtitle">We couldn't find anything matching "{query}"</p>
					</div>
				{:else if query.trim() === ''}
					<div class="search-hint-state">
						<p>Type to search across the admin portal...</p>
					</div>
				{:else}
					<div class="search-results-list">
						{#each SEARCH_MODULES as mod}
							{#if groupedResults[mod] && groupedResults[mod].length > 0}
								{@const list = groupedResults[mod].slice(0, 5)}
								<div class="search-group">
									<div class="search-group-header">
										{#if MODULE_ICONS[mod]}
											{@const Icon = MODULE_ICONS[mod]}
											<Icon size={13} class="group-icon" />
										{/if}
										<span class="group-name">{MODULE_LABELS[mod] || mod}</span>
									</div>
									<div class="search-group-items">
										{#each list as item}
											{@const globalIndex = flattenedItems.findIndex((x) => x.id === item.id && x.module === item.module)}
											<button
												class="search-item"
												class:active={activeIndex === globalIndex}
												data-index={globalIndex}
												onclick={() => { goto(item.targetUrl); open = false; }}
												onmouseenter={() => { activeIndex = globalIndex; }}
											>
												<div class="item-main">
													<span class="item-title">{item.title}</span>
													{#if item.subtitle}
														<span class="item-subtitle">{item.subtitle}</span>
													{/if}
													{#if item.matchedText && item.matchedText !== item.title && item.matchedText !== item.subtitle}
														<span class="item-preview">
															{#if item.matchedField}
																<strong class="field-label">{item.matchedField}:</strong>
															{/if}
															{item.matchedText}
														</span>
													{/if}
												</div>
												<div class="item-meta">
													<SearchModuleBadge module={item.module} />
												</div>
											</button>
										{/each}
										{#if groupedResults[mod].length > 5}
											<div class="view-all-hint">
												Showing top 5 of {groupedResults[mod].length} items
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-search-wrapper {
		position: relative;
	}

	.search-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		opacity: 0.6;
		transition: all 0.15s ease;
	}

	.search-trigger:hover {
		opacity: 1;
		background: var(--color-glass-bg);
	}

	.search-dropdown {
		position: fixed;
		width: 480px;
		background: var(--color-light-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 16px;
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		max-height: 480px;
	}

	:global([data-theme='dark']) .search-dropdown {
		background: #0d140d;
	}

	.search-input-wrapper {
		position: relative;
		padding: 0.875rem;
		border-bottom: 1px solid var(--color-glass-border);
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		background: var(--color-glass-bg);
		color: var(--color-text);
		font-size: 0.9rem;
		font-family: var(--font-main);
		outline: none;
		transition: border-color 0.15s ease;
	}

	.search-input:focus {
		border-color: var(--color-accent-green);
	}

	.search-spinner {
		position: absolute;
		right: 1.5rem;
		display: flex;
		align-items: center;
		opacity: 0.6;
	}

	.search-body {
		overflow-y: auto;
		flex: 1;
		min-height: 120px;
	}

	.search-hint-state {
		padding: 2rem;
		text-align: center;
		font-size: 0.85rem;
		opacity: 0.55;
	}

	.search-loading-state {
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.85rem;
		opacity: 0.65;
	}

	.search-empty-state {
		padding: 2.5rem;
		text-align: center;
	}

	.empty-title {
		font-weight: 600;
		font-size: 0.95rem;
		margin: 0 0 0.25rem;
	}

	.empty-subtitle {
		font-size: 0.85rem;
		opacity: 0.55;
		margin: 0;
	}

	.search-error-state {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.error-icon {
		color: #ef4444;
		opacity: 0.8;
	}

	.error-msg {
		font-size: 0.85rem;
		color: #ef4444;
		margin: 0;
		text-align: center;
	}

	.retry-btn {
		margin-top: 0.5rem;
		padding: 0.35rem 0.85rem;
		background: var(--color-glass-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
	}

	.retry-btn:hover {
		background: rgba(123, 144, 75, 0.1);
	}

	.search-results-list {
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		gap: 0.75rem;
	}

	.search-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.search-group-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.5rem;
		color: var(--color-text);
		opacity: 0.45;
	}

	.group-icon {
		flex-shrink: 0;
	}

	.group-name {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.search-group-items {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.search-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: all 0.12s ease;
		gap: 1rem;
	}

	.search-item:hover,
	.search-item.active {
		background: rgba(123, 144, 75, 0.08);
		outline: none;
	}

	.item-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.item-title {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-subtitle {
		font-size: 0.78rem;
		opacity: 0.6;
		margin-top: 0.05rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-preview {
		font-size: 0.75rem;
		opacity: 0.5;
		margin-top: 0.1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.field-label {
		text-transform: capitalize;
		font-weight: 600;
	}

	.item-meta {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.view-all-hint {
		padding: 0.25rem 0.5rem;
		font-size: 0.72rem;
		opacity: 0.45;
		font-style: italic;
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 600px) {
		.search-dropdown {
			top: 56px !important;
			left: 1rem;
			right: 1rem;
			width: auto;
			max-height: 80vh;
		}
	}
</style>
