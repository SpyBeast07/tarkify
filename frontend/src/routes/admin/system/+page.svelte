<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Cpu,
    Database,
    HardDrive,
    Mail,
    CreditCard,
    KeyRound,
    Globe,
    Server,
    Disc,
    MemoryStick,
    TreePine,
    Tag,
    RefreshCw,
  } from '@lucide/svelte';
  import { getSystemOverview } from '$lib/admin/api/system';
  import type { SystemOverview, HealthStatus } from '$lib/admin/types/system';
  import { AdminApiError } from '$lib/admin/api/client';
  import type {
    ApplicationHealth,
    DatabaseHealth,
    StorageHealth,
    EmailHealth,
    PaymentsHealth,
    OAuthHealth,
    ApiHealth,
    DiskHealth,
    MemoryHealth,
    EnvironmentHealth,
    VersionHealth,
  } from '$lib/admin/types/system';
  import AdminPage from '$lib/admin/components/AdminPage.svelte';
  import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
  import HealthBadge from '$lib/admin/components/HealthBadge.svelte';
  import SystemStatusCard from '$lib/admin/components/SystemStatusCard.svelte';
  import ServiceStatusTable, { type ServiceRow } from '$lib/admin/components/ServiceStatusTable.svelte';

  let data = $state<SystemOverview | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let refreshing = $state(false);
  let lastUpdated = $state<string | null>(null);

  const REFRESH_MS = 30_000;
  let timer: ReturnType<typeof setInterval> | null = null;

  function fmtBytes(n: number | null): string {
    if (n === null || n === undefined) return '—';
    if (n < 1024) return `${n} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let v = n / 1024;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(1)} ${units[i]}`;
  }

  function fmtUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    return parts.join(' ') || '<1m';
  }

  function fmtDate(s: string | null): string {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function fmtPct(n: number | null): string {
    return n === null || n === undefined ? '—' : `${n}%`;
  }

  async function load(isAuto = false) {
    if (isAuto) refreshing = true;
    else loading = true;
    error = null;
    try {
      data = await getSystemOverview();
      lastUpdated = new Date().toISOString();
    } catch (err) {
      error = err instanceof AdminApiError ? err.message : 'Failed to load system health';
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => load(true), REFRESH_MS);
  }
  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  onMount(() => {
    load();
    startTimer();
  });
  onDestroy(stopTimer);

  const services = $derived<ServiceRow[]>(
    data
      ? [
          { name: 'Application', status: data.application.status },
          { name: 'Database', status: data.database.status, detail: data.database.connected ? `${data.database.totalTables ?? '?'} tables` : 'disconnected' },
          { name: 'Storage', status: data.storage.status, detail: data.storage.configuredPath },
          { name: 'Email', status: data.email.status, detail: data.email.provider },
          { name: 'Payments', status: data.payments.status, detail: data.payments.provider },
          { name: 'OAuth', status: data.oauth.status, detail: data.oauth.googleEnabled ? 'Google' : 'disabled' },
          { name: 'API', status: data.api.status },
          { name: 'Disk', status: data.disk.status, detail: data.disk.usedPercentage !== null ? `${data.disk.usedPercentage}% used` : undefined },
          { name: 'Memory', status: data.memory.status, detail: data.memory.usagePercentage !== null ? `${data.memory.usagePercentage}% used` : undefined },
          { name: 'Environment', status: data.environment.status },
          { name: 'Version', status: data.version.status },
        ]
      : [],
  );

  function appMetrics(a: ApplicationHealth): { label: string; value: string }[] {
    return [
      { label: 'Uptime', value: fmtUptime(a.uptimeSeconds) },
      { label: 'Started', value: fmtDate(a.startedAt) },
      { label: 'Runtime', value: `${a.runtime} ${a.bunVersion ? a.bunVersion : a.nodeVersion}` },
      { label: 'Process ID', value: String(a.processId) },
      { label: 'Environment', value: a.environment },
      { label: 'Build', value: a.buildVersion },
      { label: 'Current Time', value: fmtDate(a.currentTime) },
      { label: 'Timezone', value: a.timezone },
    ];
  }
  function dbMetrics(d: DatabaseHealth): { label: string; value: string }[] {
    return [
      { label: 'Connected', value: d.connected ? 'Yes' : 'No' },
      { label: 'Pool', value: `${d.pool.total} total / ${d.pool.idle} idle / ${d.pool.waiting} waiting` },
      { label: 'Version', value: d.version ? d.version.split(' ').slice(0, 2).join(' ') : '—' },
      { label: 'Migrations', value: d.migrationCount !== null ? String(d.migrationCount) : '—' },
      { label: 'Latest Migration', value: d.latestMigration ?? '—' },
      { label: 'Tables', value: d.totalTables !== null ? String(d.totalTables) : '—' },
      { label: 'Response Time', value: d.responseTimeMs !== null ? `${d.responseTimeMs} ms` : '—' },
    ];
  }
  function storageMetrics(s: StorageHealth): { label: string; value: string }[] {
    return [
      { label: 'Path', value: s.configuredPath },
      { label: 'Readable', value: s.readable ? 'Yes' : 'No' },
      { label: 'Writable', value: s.writable ? 'Yes' : 'No' },
      { label: 'Total', value: fmtBytes(s.totalBytes) },
      { label: 'Used', value: fmtBytes(s.usedBytes) },
      { label: 'Free', value: fmtBytes(s.freeBytes) },
    ];
  }
  function emailMetrics(e: EmailHealth): { label: string; value: string }[] {
    return [
      { label: 'Provider', value: e.provider },
      { label: 'Configured', value: e.configured ? 'Yes' : 'No' },
      { label: 'Default From', value: e.defaultFrom },
      { label: 'Reply-To', value: e.replyTo },
      { label: 'Last Successful', value: fmtDate(e.lastSuccessfulAt) },
      { label: 'Last Failed', value: fmtDate(e.lastFailedAt) },
      { label: 'Total Sent', value: String(e.totalSent) },
      { label: 'Total Failed', value: String(e.totalFailed) },
    ];
  }
  function paymentsMetrics(p: PaymentsHealth): { label: string; value: string }[] {
    return [
      { label: 'Provider', value: p.provider },
      { label: 'Configured', value: p.configured ? 'Yes' : 'No' },
      { label: 'Webhook', value: p.webhookConfigured ? 'Configured' : 'Missing' },
      { label: 'Environment', value: p.environment },
      { label: 'Last Payment', value: fmtDate(p.lastPaymentAt) },
      { label: 'Last Webhook', value: fmtDate(p.lastWebhookAt) },
    ];
  }
  function oauthMetrics(o: OAuthHealth): { label: string; value: string }[] {
    return [
      { label: 'Google Enabled', value: o.googleEnabled ? 'Yes' : 'No' },
      { label: 'Configured', value: o.googleConfigured ? 'Yes' : 'No' },
      { label: 'Callback URL', value: o.callbackUrl ?? '—' },
    ];
  }
  function apiMetrics(a: ApiHealth): { label: string; value: string }[] {
    return [
      { label: 'Health Endpoint', value: a.healthEndpoint },
      { label: 'Ready Endpoint', value: a.readyEndpoint },
      { label: 'Health Reachable', value: a.healthReachable ? 'Yes' : 'No' },
      { label: 'Ready Reachable', value: a.readyReachable ? 'Yes' : 'No' },
      { label: 'Avg Response', value: a.averageResponseTimeMs !== null ? `${a.averageResponseTimeMs} ms` : '—' },
    ];
  }
  function diskMetrics(d: DiskHealth): { label: string; value: string }[] {
    return [
      { label: 'Path', value: d.path },
      { label: 'Total', value: fmtBytes(d.totalBytes) },
      { label: 'Used', value: fmtBytes(d.usedBytes) },
      { label: 'Free', value: fmtBytes(d.freeBytes) },
      { label: 'Used %', value: fmtPct(d.usedPercentage) },
    ];
  }
  function memoryMetrics(m: MemoryHealth): { label: string; value: string }[] {
    return [
      { label: 'Heap Used', value: fmtBytes(m.heapUsedBytes) },
      { label: 'Heap Total', value: fmtBytes(m.heapTotalBytes) },
      { label: 'RSS', value: fmtBytes(m.rssBytes) },
      { label: 'External', value: fmtBytes(m.externalBytes) },
      { label: 'Usage %', value: fmtPct(m.usagePercentage) },
    ];
  }
  function envMetrics(e: EnvironmentHealth): { label: string; value: string }[] {
    return [
      { label: 'Node Env', value: e.nodeEnvironment },
      { label: 'Frontend URL', value: e.frontendUrl },
      { label: 'Backend URL', value: e.backendUrl },
      { label: 'Storage Path', value: e.storagePath },
      { label: 'Email Provider', value: e.emailProvider },
      { label: 'Payment Provider', value: e.paymentProvider },
      { label: 'OAuth Enabled', value: e.oauthEnabled ? 'Yes' : 'No' },
      { label: 'App Version', value: e.applicationVersion },
    ];
  }
  function versionMetrics(v: VersionHealth): { label: string; value: string }[] {
    return [
      { label: 'App Version', value: v.applicationVersion },
      { label: 'Git Commit', value: v.gitCommit ?? '—' },
      { label: 'Build Time', value: v.buildTime ?? '—' },
      { label: 'Schema Version', value: v.schemaVersion ?? '—' },
      { label: 'Latest Migration', value: v.latestMigration ?? '—' },
      { label: 'Docker Image', value: v.dockerImage ?? '—' },
    ];
  }
</script>

<AdminPageHeader title="System Health" description="Operational monitoring across application, database, storage, and connected services">
  {#if data}
    <div class="header-status">
      <HealthBadge status={data.overall} label="Overall" />
      {#if lastUpdated}
        <span class="updated">Updated {new Date(lastUpdated).toLocaleTimeString('en-IN')}</span>
      {/if}
      <button class="refresh-btn" onclick={() => load()} disabled={loading || refreshing} aria-label="Refresh system health">
        <RefreshCw size={15} class={refreshing ? 'spin' : ''} />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  {/if}
</AdminPageHeader>

<AdminPage {loading} {error} onRetry={() => load()}>
  {#if data}
    <div class="overview-table">
      <ServiceStatusTable {services} />
    </div>

    <div class="cards-grid">
      <SystemStatusCard title="Application" status={data.application.status} icon={Cpu} metrics={appMetrics(data.application)} note={data.application.message} />
      <SystemStatusCard title="Database" status={data.database.status} icon={Database} metrics={dbMetrics(data.database)} note={data.database.message} />
      <SystemStatusCard title="Storage" status={data.storage.status} icon={HardDrive} metrics={storageMetrics(data.storage)} note={data.storage.message} />
      <SystemStatusCard title="Email" status={data.email.status} icon={Mail} metrics={emailMetrics(data.email)} note={data.email.message} />
      <SystemStatusCard title="Payments" status={data.payments.status} icon={CreditCard} metrics={paymentsMetrics(data.payments)} note={data.payments.message} />
      <SystemStatusCard title="OAuth" status={data.oauth.status} icon={KeyRound} metrics={oauthMetrics(data.oauth)} note={data.oauth.message} />
      <SystemStatusCard title="API" status={data.api.status} icon={Globe} metrics={apiMetrics(data.api)} note={data.api.message} />
      <SystemStatusCard title="Disk" status={data.disk.status} icon={Disc} metrics={diskMetrics(data.disk)} note={data.disk.message} />
      <SystemStatusCard title="Memory" status={data.memory.status} icon={MemoryStick} metrics={memoryMetrics(data.memory)} note={data.memory.message} />
      <SystemStatusCard title="Environment" status={data.environment.status} icon={Server} metrics={envMetrics(data.environment)} note={data.environment.message} />
      <SystemStatusCard title="Version" status={data.version.status} icon={Tag} metrics={versionMetrics(data.version)} note={data.version.message} />
    </div>
  {/if}
</AdminPage>

<style>
  .header-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .updated {
    font-size: 0.78rem;
    opacity: 0.55;
  }
  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.8rem;
    border-radius: 10px;
    border: 1px solid var(--color-glass-border);
    background: var(--color-glass-bg);
    color: var(--color-text);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }
  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .overview-table {
    margin-bottom: 1.5rem;
  }
.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.1rem;
	}
	:global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.spin) {
			animation: none;
		}
	}
</style>
