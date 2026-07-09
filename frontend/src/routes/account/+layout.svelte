<script lang="ts">
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { ChevronRight } from '@lucide/svelte';
  import Seo from '$lib/components/Seo.svelte';
  import Sidebar from '$lib/components/account/Sidebar.svelte';
  import type { AuthState } from '$lib/context/auth.svelte';

  let { children } = $props();

  const authState = getContext<AuthState>('auth');

  let ready = $state(false);

  $effect(() => {
    if (authState.loaded) {
      if (authState.user) {
        ready = true;
      } else {
        const currentPath = $page.url.pathname;
        goto('/login?redirect=' + currentPath);
      }
    }
  });

  const breadcrumbLabels: Record<string, string> = {
    profile: 'Profile',
    purchases: 'Purchases',
    downloads: 'Downloads',
    billing: 'Billing',
    settings: 'Settings',
  };

  const breadcrumbs = $derived.by(() => {
    const path = $page.url.pathname;
    const parts = path.replace(/^\/account\/?/, '').split('/').filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [];
    crumbs.push({ label: 'Account', href: '/account' });
    let current = '/account';
    for (const part of parts) {
      current += '/' + part;
      const label = breadcrumbLabels[part] || part;
      crumbs.push({ label, href: current });
    }
    return crumbs;
  });

  const pageTitle = $derived(
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1].label : 'Customer Portal'
  );
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
  title="{pageTitle} | Account | Tarkify"
  description="Manage your Tarkify account, purchases, downloads, and billing."
  ogImage="/og-image.svg"
  ogType="website"
/>

{#if ready}
  <div class="account-page pt-32 pb-20">
    <div class="container">
      <div transition:fly={{ y: 20, duration: 400 }} class="account-hero">
        <span class="section-badge">Account</span>
        <h1>Customer Portal</h1>
      </div>

      <nav class="breadcrumbs" aria-label="Breadcrumb">
        {#each breadcrumbs as crumb, i (crumb.href)}
          {#if i > 0}
            <ChevronRight size={12} class="breadcrumb-sep" aria-hidden="true" />
          {/if}
          {#if i < breadcrumbs.length - 1}
            <a href={crumb.href} class="breadcrumb-link">{crumb.label}</a>
          {:else}
            <span class="breadcrumb-current">{crumb.label}</span>
          {/if}
        {/each}
      </nav>

      <div class="account-layout">
        <Sidebar />
        <main class="account-content" transition:fly={{ y: 12, duration: 250 }}>
          {@render children()}
        </main>
      </div>
    </div>
  </div>
{:else}
  <div class="account-page pt-32 pb-20">
    <div class="container">
      <div class="account-hero">
        <span class="section-badge">Account</span>
        <h1>Customer Portal</h1>
      </div>
      <div class="account-layout">
        <div class="account-sidebar-skeleton"></div>
        <div class="account-content-skeleton">
          <div class="skeleton-block" style="height: 80px"></div>
          <div class="skeleton-block" style="height: 200px; margin-top: 1rem"></div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .account-page {
    min-height: 60vh;
  }

  .account-hero {
    margin-bottom: 1rem;
  }

  .account-hero h1 {
    font-size: 2.5rem;
    margin-bottom: 0.375rem;
  }

  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
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

  .account-layout {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }

  .account-content {
    flex: 1;
    min-width: 0;
    max-width: 720px;
  }

  .account-content :global(input:not([type='checkbox']):not([type='radio'])),
  .account-content :global(select) {
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    color: var(--color-text);
    font-family: var(--font-main);
    backdrop-filter: var(--glass-blur);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    outline: none;
  }

  .account-content :global(input:not([type='checkbox']):not([type='radio']):-webkit-autofill) {
    -webkit-box-shadow: 0 0 0 1000px var(--color-glass-bg) inset !important;
    -webkit-text-fill-color: var(--color-text) !important;
    caret-color: var(--color-text);
  }

  .account-content :global(input:not([type='checkbox']):not([type='radio']):focus),
  .account-content :global(select:focus) {
    border-color: var(--color-accent-green);
    box-shadow: 0 0 0 3px rgba(123, 144, 75, 0.12);
  }

  .account-content :global(input.input-error:not([type='checkbox']):not([type='radio'])),
  .account-content :global(select.input-error) {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .account-content :global(.input-with-icon input:not([type='checkbox']):not([type='radio'])),
  .account-content :global(.input-with-icon select) {
    padding-left: 3rem;
  }

  .account-content :global(.input-readonly input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .account-sidebar-skeleton {
    width: 220px;
    height: 300px;
    border-radius: 20px;
    background: var(--color-glass-bg);
    animation: shimmer 1.5s infinite;
    flex-shrink: 0;
  }

  .account-content-skeleton {
    flex: 1;
    max-width: 720px;
  }

  .skeleton-block {
    border-radius: 20px;
    background: var(--color-glass-bg);
    animation: shimmer 1.5s infinite;
  }

  @media (max-width: 768px) {
    .account-layout {
      flex-direction: column;
      gap: 1rem;
    }

    .account-hero h1 {
      font-size: 2rem;
    }

    .account-content {
      max-width: 100%;
    }

    .account-sidebar-skeleton {
      width: 100%;
      height: 48px;
    }
  }
</style>
