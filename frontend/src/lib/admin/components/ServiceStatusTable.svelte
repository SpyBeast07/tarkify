<script lang="ts">
  import type { HealthStatus } from '$lib/admin/types/system';
  import HealthBadge from './HealthBadge.svelte';
  import AdminTableContainer from './AdminTableContainer.svelte';

  export interface ServiceRow {
    name: string;
    status: HealthStatus;
    detail?: string;
  }

  interface Props {
    services: ServiceRow[];
  }

  let { services }: Props = $props();
</script>

<div class="service-table">
  <AdminTableContainer>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Status</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>
        {#each services as s (s.name)}
          <tr>
            <td class="svc-name">{s.name}</td>
            <td><HealthBadge status={s.status} /></td>
            <td class="svc-detail">{s.detail ?? '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </AdminTableContainer>
</div>

<style>
  .svc-name {
    font-weight: 600;
  }
  .svc-detail {
    font-size: 0.82rem;
    opacity: 0.7;
    word-break: break-word;
  }
</style>
