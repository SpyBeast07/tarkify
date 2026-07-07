<script lang="ts">
  import { getContext } from 'svelte';
  import { fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import Seo from '$lib/components/Seo.svelte';
  import Sidebar from '$lib/components/account/Sidebar.svelte';
  import type { AuthState } from '$lib/context/auth.svelte';

  let { children } = $props();

  const authState = getContext<AuthState>('auth');

  if (!authState.loaded && !authState.user) {
    authState.checkSession();
  }

  let ready = $state(false);

  $effect(() => {
    if (authState.loaded) {
      if (authState.user) {
        ready = true;
      } else {
        goto('/login?redirect=/account');
      }
    }
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
  title="Account | Tarkify"
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

      <div class="account-layout">
        <Sidebar />
        <main class="account-content" transition:fly={{ y: 12, duration: 250 }}>
          {@render children()}
        </main>
      </div>
    </div>
  </div>
{/if}

<style>
  .account-page {
    min-height: 60vh;
  }

  .account-hero {
    margin-bottom: 1.5rem;
  }

  .account-hero h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .account-layout {
    display: flex;
    gap: 2.5rem;
    align-items: flex-start;
  }

  .account-content {
    flex: 1;
    min-width: 0;
    max-width: 720px;
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
  }
</style>
