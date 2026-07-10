<script lang="ts">
	import { page } from '$app/stores';
	import {
		LayoutDashboard,
		Package,
		ShoppingCart,
		CreditCard,
		Download,
		Users,
		MessageSquare,
		Mail,
		BarChart3,
		Settings,
		Shield,
		Activity,
		ChevronDown,
		X
	} from '@lucide/svelte';

	let { mobileOpen = $bindable(false), onClose = () => {} } = $props();

	let expandedGroup = $state<string | null>(null);

	function toggleGroup(label: string) {
		expandedGroup = expandedGroup === label ? null : label;
	}

	const navGroups = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
		{ href: '/admin/products', label: 'Products', icon: Package },
		{ href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
		{ href: '/admin/payments', label: 'Payments', icon: CreditCard },
		{ href: '/admin/downloads', label: 'Downloads', icon: Download },
		{ href: '/admin/customers', label: 'Customers', icon: Users },
		{
			label: 'Communication',
			icon: MessageSquare,
			children: [
				{ href: '/admin/communication/contact', label: 'Contact' },
				{ href: '/admin/communication/feedback', label: 'Feedback' },
				{ href: '/admin/communication/newsletter', label: 'Newsletter' },
				{ href: '/admin/communication/careers', label: 'Careers' }
			]
		},
		{ href: '/admin/email', label: 'Email Center', icon: Mail },
		{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
		{ href: '/admin/system', label: 'System', icon: Activity },
		{ href: '/admin/settings', label: 'Settings', icon: Settings },
		{ href: '/admin/audit', label: 'Audit Logs', icon: Shield }
	];

	function isActive(item: { href?: string; exact?: boolean }): boolean {
		if (!item.href) return false;
		if (item.exact) return $page.url.pathname === item.href;
		return $page.url.pathname.startsWith(item.href);
	}

	function isChildActive(children: Array<{ href: string }>): boolean {
		return children.some((c) => $page.url.pathname.startsWith(c.href));
	}

	function handleNav() {
		onClose();
	}
</script>

<nav class="admin-sidebar" class:open={mobileOpen} aria-label="Admin navigation">
	<div class="sidebar-header">
		<a href="/admin" class="sidebar-logo">
			<span class="sidebar-logo-text">Tarkify</span>
			<span class="sidebar-logo-badge">Admin</span>
		</a>
		<button class="sidebar-close" onclick={() => onClose()} aria-label="Close sidebar">
			<X size={20} />
		</button>
	</div>

	<div class="sidebar-nav">
		{#each navGroups as item}
			{#if item.children}
				<div class="nav-group">
					<button
						class="nav-group-toggle"
						class:active={isChildActive(item.children)}
						class:expanded={expandedGroup === item.label}
						onclick={() => toggleGroup(item.label)}
						aria-expanded={expandedGroup === item.label}
					>
						<span class="nav-item-content">
							<item.icon size={18} aria-hidden="true" />
							<span>{item.label}</span>
						</span>
						<span class="chevron-wrapper" class:rotated={expandedGroup === item.label}>
							<ChevronDown size={14} aria-hidden="true" />
						</span>
					</button>
					{#if expandedGroup === item.label}
						<div class="nav-children">
							{#each item.children as child}
								<a
									href={child.href}
									class="nav-child-link"
									class:active={isActive({ href: child.href })}
									onclick={handleNav}
								>
									{child.label}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<a
					href={item.href}
					class="nav-link"
					class:active={isActive(item)}
					onclick={handleNav}
				>
					<item.icon size={18} aria-hidden="true" />
					<span>{item.label}</span>
				</a>
			{/if}
		{/each}
	</div>
</nav>

{#if mobileOpen}
	<div class="sidebar-overlay" onclick={() => onClose()} role="presentation"></div>
{/if}

<style>
	.admin-sidebar {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: var(--admin-sidebar-width, 240px);
		background: var(--color-glass-bg);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border-right: 1px solid var(--color-glass-border);
		display: flex;
		flex-direction: column;
		z-index: 100;
		overflow: hidden;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.25rem 0.75rem;
		flex-shrink: 0;
	}

	.sidebar-logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
	}

	.sidebar-logo-text {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--color-primary-green);
	}

	.sidebar-logo-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: var(--color-accent-green);
		color: #fff;
	}

	.sidebar-close {
		display: none;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 6px;
	}

	.sidebar-close:hover {
		background: var(--color-glass-bg);
	}

	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0.75rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.nav-link,
	.nav-group-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		transition: all 0.15s ease;
		cursor: pointer;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		opacity: 0.65;
	}

	.nav-link:hover,
	.nav-group-toggle:hover {
		background: var(--color-glass-bg);
		opacity: 0.85;
	}

	.nav-link.active,
	.nav-group-toggle.active {
		background: rgba(123, 144, 75, 0.1);
		color: var(--color-accent-green);
		opacity: 1;
		font-weight: 600;
	}

	.nav-item-content {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.chevron-wrapper {
		display: flex;
		align-items: center;
		transition: transform 0.2s ease;
		opacity: 0.5;
	}

	.chevron-wrapper.rotated {
		transform: rotate(180deg);
	}

	.nav-children {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		padding-left: 1.75rem;
		margin-top: 0.125rem;
	}

	.nav-child-link {
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		transition: all 0.15s ease;
		opacity: 0.6;
	}

	.nav-child-link:hover {
		background: var(--color-glass-bg);
		opacity: 0.85;
	}

	.nav-child-link.active {
		color: var(--color-accent-green);
		opacity: 1;
		font-weight: 600;
	}

	.sidebar-overlay {
		display: none;
	}

	@media (max-width: 768px) {
		.admin-sidebar {
			transform: translateX(-100%);
			transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.admin-sidebar.open {
			transform: translateX(0);
		}

		.sidebar-close {
			display: block;
		}

		.sidebar-overlay {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.3);
			z-index: 99;
		}
	}
</style>
