<script lang="ts">
	import { page } from '$app/stores';
	import { ChevronRight } from '@lucide/svelte';
	import type { AdminBreadcrumb } from '$lib/admin/types';

	let { class: className = '' } = $props();

	const breadcrumbLabels: Record<string, string> = {
		admin: 'Admin',
		dashboard: 'Dashboard',
		products: 'Products',
		orders: 'Orders',
		payments: 'Payments',
		downloads: 'Downloads',
		customers: 'Customers',
		contact: 'Contact',
		feedback: 'Feedback',
		newsletter: 'Newsletter',
		careers: 'Careers',
		emails: 'Emails',
		analytics: 'Analytics',
		system: 'System',
		settings: 'Platform Settings',
		audit: 'Audit Logs',
		login: 'Login'
	};

	const breadcrumbs = $derived.by<AdminBreadcrumb[]>(() => {
		const path = $page.url.pathname;
		const parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
		const crumbs: AdminBreadcrumb[] = [];
		crumbs.push({ label: 'Admin', href: '/admin' });
		let current = '';
		for (const part of parts) {
			current += '/' + part;
			if (part === 'admin') continue;
			const label = breadcrumbLabels[part] || part;
			crumbs.push({ label, href: current });
		}
		return crumbs;
	});
</script>

<nav class="admin-breadcrumbs {className}" aria-label="Breadcrumb">
	{#each breadcrumbs as crumb, i (crumb.href)}
		{#if i > 0}
			<ChevronRight size={12} class="breadcrumb-sep" aria-hidden="true" />
		{/if}
		{#if i < breadcrumbs.length - 1}
			<a href={crumb.href} class="breadcrumb-link">{crumb.label}</a>
		{:else}
			<span class="breadcrumb-current" aria-current="page">{crumb.label}</span>
		{/if}
	{/each}
</nav>

<style>
	.admin-breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8rem;
	}

	:global(.breadcrumb-sep) {
		opacity: 0.35;
		flex-shrink: 0;
	}

	.breadcrumb-link {
		color: var(--color-text);
		opacity: 0.5;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.breadcrumb-link:hover {
		opacity: 0.8;
		text-decoration: underline;
	}

	.breadcrumb-current {
		opacity: 0.8;
		font-weight: 500;
	}
</style>
