<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HealthStatus } from '$lib/admin/types/system';
  import AdminSection from './AdminSection.svelte';
  import HealthBadge from './HealthBadge.svelte';

  interface Props {
    title: string;
    status: HealthStatus;
    children?: Snippet;
  }

  let { title, status, children }: Props = $props();
</script>

<AdminSection {title}>
  <div class="hs-badge"><HealthBadge {status} /></div>
  {@render children?.()}
</AdminSection>

<style>
  .hs-badge {
    margin-bottom: 0.85rem;
  }
</style>
