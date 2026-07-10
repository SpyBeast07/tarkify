<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import { createSidebarState, type SidebarState } from '$lib/admin/stores/sidebar.svelte';
	import AdminSidebar from './AdminSidebar.svelte';
	import AdminHeader from './AdminHeader.svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	const sidebar = createSidebarState();
	setContext<SidebarState>('sidebar', sidebar);

	function handleToggleSidebar() {
		sidebar.toggleMobile();
	}
</script>

<div class="admin-shell">
	<AdminSidebar bind:mobileOpen={sidebar.mobileOpen} onClose={sidebar.closeMobile} />

	<div class="admin-main">
		<AdminHeader onToggleSidebar={handleToggleSidebar} />

		<main class="admin-content" id="admin-main-content" tabindex="-1">
			{#if children}
				{@render children()}
			{/if}
		</main>
	</div>
</div>

<style>
	.admin-shell {
		display: flex;
		min-height: 100vh;
		background: var(--color-light-bg);
	}

	.admin-main {
		flex: 1;
		margin-left: var(--admin-sidebar-width, 240px);
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.admin-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	@media (max-width: 768px) {
		.admin-main {
			margin-left: 0;
		}

		.admin-content {
			padding: 1rem;
		}
	}
</style>
