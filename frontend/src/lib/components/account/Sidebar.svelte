<script lang="ts">
  import { page } from '$app/stores';
  import {
    LayoutDashboard, User, Receipt, Download, CreditCard, Settings
  } from '@lucide/svelte';

  const navItems = [
    { href: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/account/profile', label: 'Profile', icon: User, exact: false },
    { href: '/account/purchases', label: 'Purchases', icon: Receipt, exact: false },
    { href: '/account/downloads', label: 'Downloads', icon: Download, exact: false },
    { href: '/account/billing', label: 'Billing', icon: CreditCard, exact: false },
    { href: '/account/settings', label: 'Settings', icon: Settings, exact: false },
  ];

  let mobileOpen = $state(false);
</script>

<nav class="account-sidebar" class:mobile-open={mobileOpen}>
  <button class="sidebar-toggle" onclick={() => (mobileOpen = !mobileOpen)} aria-label="Toggle navigation">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      {#if mobileOpen}
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      {:else}
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      {/if}
    </svg>
  </button>

  <ul class="sidebar-nav">
    {#each navItems as item}
      {@const active = item.exact
        ? $page.url.pathname === item.href
        : $page.url.pathname.startsWith(item.href)}
      <li>
        <a
          href={item.href}
          class="sidebar-link"
          class:active
          onclick={() => (mobileOpen = false)}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

{#if mobileOpen}
  <div class="sidebar-overlay" onclick={() => (mobileOpen = false)} role="presentation"></div>
{/if}

<style>
  .account-sidebar {
    position: sticky;
    top: calc(var(--header-height) + 2rem);
    width: 220px;
    flex-shrink: 0;
  }

  .sidebar-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .sidebar-nav {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text);
    text-decoration: none;
    transition: var(--transition-smooth);
    opacity: 0.6;
  }

  .sidebar-link:hover {
    background: var(--color-glass-bg);
    opacity: 0.85;
  }

  .sidebar-link.active {
    background: rgba(123, 144, 75, 0.1);
    color: var(--color-primary-green);
    opacity: 1;
    font-weight: 600;
    border: 1px solid rgba(123, 144, 75, 0.15);
  }

  .sidebar-overlay {
    display: none;
  }

  @media (max-width: 768px) {
    .account-sidebar {
      position: static;
      width: 100%;
    }

    .sidebar-toggle {
      display: block;
    }

    .sidebar-nav {
      display: none;
    }

    .account-sidebar.mobile-open .sidebar-nav {
      display: flex;
    }

    .sidebar-overlay {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9;
    }
  }
</style>
