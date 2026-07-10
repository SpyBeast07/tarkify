<script lang="ts">
	import { Search } from '@lucide/svelte';

	let { class: className = '' } = $props();

	let open = $state(false);
	let query = $state('');

	function toggle() {
		open = !open;
		if (open) {
			query = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="admin-search {className}" role="search">
	<button
		class="search-trigger"
		onclick={toggle}
		aria-label="Toggle search"
		aria-expanded={open}
	>
		<Search size={18} aria-hidden="true" />
	</button>

	{#if open}
		<div class="search-dropdown" onkeydown={handleKeydown} role="dialog" aria-label="Search" tabindex="-1">
			<div class="search-input-wrapper">
				<Search size={18} class="search-input-icon" aria-hidden="true" />
				<input
					type="text"
					placeholder="Search..."
					bind:value={query}
					class="search-input"
					autofocus
					aria-label="Search query"
				/>
			</div>
			<div class="search-results">
				<p class="search-hint">Type to search across the admin panel.</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-search {
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
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		width: 320px;
		background: var(--color-light-bg);
		border: 1px solid var(--color-glass-border);
		border-radius: 14px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		z-index: 200;
	}

	.search-input-wrapper {
		position: relative;
		padding: 0.75rem;
	}

	.search-input-icon {
		position: absolute;
		left: 1.25rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text);
		opacity: 0.4;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 0.75rem 0.625rem 2.5rem;
		border: 1px solid var(--color-glass-border);
		border-radius: 10px;
		background: var(--color-glass-bg);
		color: var(--color-text);
		font-size: 0.9rem;
		font-family: var(--font-main);
		outline: none;
	}

	.search-input:focus {
		border-color: var(--color-accent-green);
	}

	.search-results {
		padding: 0.75rem;
		border-top: 1px solid var(--color-glass-border);
	}

	.search-hint {
		font-size: 0.8rem;
		opacity: 0.5;
		text-align: center;
		margin: 0;
	}
</style>
