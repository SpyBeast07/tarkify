<script lang="ts">
	import { type Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { ChevronDown } from '@lucide/svelte';

	interface DropdownItem {
		label: string;
		onclick?: (event: MouseEvent) => void;
		href?: string;
	}

	interface Props {
		label?: string;
		items?: DropdownItem[];
		align?: 'left' | 'right';
		class?: string;
		trigger?: Snippet;
		children?: Snippet;
	}

	let {
		label = 'Options',
		items = [],
		align = 'right',
		class: className = '',
		trigger,
		children
	}: Props = $props();

	let isOpen = $state(false);
	let dropdownContainer: HTMLDivElement | undefined = $state();

	function toggle() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}

	function handleWindowClick(e: MouseEvent) {
		if (isOpen && dropdownContainer && !dropdownContainer.contains(e.target as Node)) {
			close();
		}
	}
</script>

<svelte:window
	onclick={handleWindowClick}
	onkeydown={(e) => {
		if (isOpen && e.key === 'Escape') {
			close();
		}
	}}
/>

<div bind:this={dropdownContainer} class="dropdown-wrapper {className}">
	{#if trigger}
		<button
			onclick={toggle}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggle();
				}
			}}
			aria-haspopup="true"
			aria-expanded={isOpen}
			style="background: none; border: none; padding: 0; margin: 0; cursor: pointer; text-align: left; display: block; font: inherit; color: inherit;"
		>
			{@render trigger()}
		</button>
	{:else}
		<button
			class="dropdown-trigger-btn btn btn-secondary btn-sm"
			onclick={toggle}
			aria-haspopup="true"
			aria-expanded={isOpen}
		>
			<span>{label}</span>
			<ChevronDown size={16} class="chevron {isOpen ? 'rotated' : ''}" />
		</button>
	{/if}

	{#if isOpen}
		<div class="dropdown-menu glass menu-align-{align}" transition:fly={{ y: -10, duration: 200 }}>
			{#if children}
				{@render children()}
			{:else}
				<ul class="dropdown-list">
					{#each items as item, index (`${item.label}-${index}`)}
						<li>
							{#if item.href}
								<a
									href={item.href}
									class="dropdown-item"
									onclick={(e) => {
										close();
										item.onclick?.(e);
									}}
								>
									{item.label}
								</a>
							{:else}
								<button
									class="dropdown-item"
									onclick={(e) => {
										close();
										item.onclick?.(e);
									}}
								>
									{item.label}
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.dropdown-wrapper {
		position: relative;
		display: inline-block;
	}

	.dropdown-trigger-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.chevron {
		transition: transform 0.2s ease;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		margin-top: 0.5rem;
		min-width: 180px;
		border-radius: 12px;
		z-index: 1000;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		padding: 0.35rem 0;
	}

	.menu-align-right {
		right: 0;
	}

	.menu-align-left {
		left: 0;
	}

	.dropdown-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.6rem 1.25rem;
		font-size: 0.9rem;
		color: var(--color-text);
		background: transparent;
		border: none;
		cursor: pointer;
		text-decoration: none;
		font-family: var(--font-main);
		transition: background-color 0.2s ease;
	}

	.dropdown-item:hover {
		background-color: var(--color-glass-bg);
	}
</style>
