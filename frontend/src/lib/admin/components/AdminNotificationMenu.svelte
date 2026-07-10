<script lang="ts">
	import { Bell } from '@lucide/svelte';

	let { class: className = '' } = $props();

	let open = $state(false);

	function toggle() {
		open = !open;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="admin-notifications {className}">
	<button
		class="notif-trigger"
		onclick={toggle}
		aria-label="Toggle notifications"
		aria-expanded={open}
	>
		<Bell size={18} aria-hidden="true" />
	</button>

	{#if open}
		<div class="notif-dropdown" onkeydown={handleKeydown} role="menu" aria-label="Notifications" tabindex="-1">
			<div class="notif-header">
				<h3 class="notif-title">Notifications</h3>
			</div>
			<div class="notif-list">
				<div class="notif-empty" role="menuitem">
					<p>No notifications yet.</p>
				</div>
			</div>
		</div>
	{/if}

	{#if open}
		<div class="notif-backdrop" onclick={() => (open = false)} role="presentation"></div>
	{/if}
</div>

<style>
	.admin-notifications {
		position: relative;
	}

	.notif-trigger {
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
		position: relative;
	}

	.notif-trigger:hover {
		opacity: 1;
		background: var(--color-glass-bg);
	}

	.notif-dropdown {
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

	.notif-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-glass-border);
	}

	.notif-title {
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
	}

	.notif-list {
		max-height: 300px;
		overflow-y: auto;
	}

	.notif-empty {
		padding: 2rem 1rem;
		text-align: center;
	}

	.notif-empty p {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.5;
	}

	.notif-backdrop {
		position: fixed;
		inset: 0;
		z-index: 199;
	}
</style>
