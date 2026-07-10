<script lang="ts">
  import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from '@lucide/svelte';
  import type { HealthStatus } from '$lib/admin/types/system';

  interface Props {
    status: HealthStatus;
    label?: string;
  }

  let { status, label }: Props = $props();

  const map = {
    healthy: { text: 'Healthy', Icon: CheckCircle2, cls: 'healthy' },
    warning: { text: 'Warning', Icon: AlertTriangle, cls: 'warning' },
    error: { text: 'Error', Icon: XCircle, cls: 'error' },
    unknown: { text: 'Unknown', Icon: HelpCircle, cls: 'unknown' },
  };

  const cfg = $derived(map[status] ?? map.unknown);
  const Icon = $derived(cfg.Icon);
</script>

<span class="health-badge {cfg.cls}" role="status" aria-label={label ?? cfg.text}>
  <Icon size={14} aria-hidden="true" />
  {label ?? cfg.text}
</span>

<style>
  .health-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .healthy { background: rgba(39, 59, 9, 0.15); color: #5a7a1a; }
  .warning { background: rgba(217, 119, 6, 0.15); color: #d97706; }
  .error { background: rgba(220, 38, 38, 0.12); color: #ef4444; }
  .unknown { background: rgba(100, 116, 139, 0.15); color: #64748b; }
</style>
