<script lang="ts">
  import type { Component } from 'svelte';

  export interface ChartDatum {
    label: string;
    value: number;
  }

  interface Props {
    type: 'line' | 'bar' | 'pie';
    data: ChartDatum[];
    height?: number;
    color?: string;
    ariaLabel?: string;
    loading?: boolean;
    icon?: Component<{ size?: number; class?: string }>;
    valueFormatter?: (n: number) => string;
  }

  let {
    type,
    data,
    height = 240,
    color = '#5a7a1a',
    ariaLabel = 'Analytics chart',
    loading = false,
    icon,
    valueFormatter = (n: number) => String(n),
  }: Props = $props();

  const PALETTE = ['#5a7a1a', '#3b82f6', '#d97706', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#64748b'];

  const W = 640;
  const padX = 40;
  const padTop = 16;
  const padBottom = 28;

  const maxVal = $derived(Math.max(1, ...data.map((d) => d.value)));
  const innerW = $derived(W - padX * 2);
  const innerH = $derived(height - padTop - padBottom);

  const points = $derived(
    data.map((d, i) => {
      const x = data.length <= 1 ? W / 2 : padX + (i * innerW) / (data.length - 1);
      const y = padTop + innerH - (d.value / maxVal) * innerH;
      return { x, y, ...d };
    }),
  );

  const linePath = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  const areaPath = $derived(
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : '',
  );

  const barWidth = $derived(data.length > 0 ? Math.max(2, (innerW / data.length) * 0.7) : 0);

  const total = $derived(data.reduce((s, d) => s + d.value, 0));
  const slices = $derived(buildPie(data, total));

  function buildPie(items: ChartDatum[], sum: number) {
    if (sum <= 0) return [];
    let acc = 0;
    const cx = 110;
    const cy = 110;
    const r = 90;
    return items.map((d, i) => {
      const start = (acc / sum) * Math.PI * 2 - Math.PI / 2;
      acc += d.value;
      const end = (acc / sum) * Math.PI * 2 - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      return {
        path: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
        color: PALETTE[i % PALETTE.length],
        label: d.label,
        value: d.value,
      };
    });
  }

  const ariaSummary = $derived(
    `${ariaLabel}. ${data.map((d) => `${d.label}: ${valueFormatter(d.value)}`).join(', ')}`,
  );

  const yTicks = $derived(Array.from({ length: 4 }, (_, i) => Math.round((maxVal / 4) * (i + 1))));
</script>

{#if loading}
  <div class="chart-skeleton" style="height:{height}px" aria-hidden="true"></div>
{:else if data.length === 0}
  <div class="chart-empty" style="height:{height}px">No data for this range</div>
{:else if type === 'pie'}
  <div class="pie-wrap" role="img" aria-label={ariaSummary}>
    <svg viewBox="0 0 220 220" class="pie-svg" aria-hidden="true">
      {#each slices as s}
        <path d={s.path} fill={s.color} stroke="var(--color-glass-bg)" stroke-width="1.5" />
      {/each}
    </svg>
    <ul class="pie-legend">
      {#each data as d, i}
        <li>
          <span class="legend-dot" style="background:{PALETTE[i % PALETTE.length]}"></span>
          <span class="legend-label">{d.label}</span>
          <span class="legend-value">{valueFormatter(d.value)}</span>
        </li>
      {/each}
    </ul>
  </div>
{:else}
  <svg
    viewBox="0 0 {W} {height}"
    class="chart-svg"
    role="img"
    aria-label={ariaSummary}
    preserveAspectRatio="none"
  >
    {#each yTicks as t}
      <line x1={padX} x2={W - padX} y1={padTop + innerH - (t / maxVal) * innerH} y2={padTop + innerH - (t / maxVal) * innerH} class="grid-line" />
      <text x={padX - 6} y={padTop + innerH - (t / maxVal) * innerH + 3} class="axis-label" text-anchor="end">{valueFormatter(t)}</text>
    {/each}

    {#if type === 'bar'}
      {#each points as p, i}
        <rect
          x={p.x - barWidth / 2}
          y={p.y}
          width={barWidth}
          height={Math.max(0, padTop + innerH - p.y)}
          rx="3"
          fill={color}
          class="bar"
        >
          <title>{p.label}: {valueFormatter(p.value)}</title>
        </rect>
      {/each}
    {:else}
      <path d={areaPath} fill={color} opacity="0.12" />
      <path d={linePath} fill="none" stroke={color} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      {#each points as p}
        <circle cx={p.x} cy={p.y} r="3" fill={color}>
          <title>{p.label}: {valueFormatter(p.value)}</title>
        </circle>
      {/each}
    {/if}

    {#each points as p, i}
      {#if i === 0 || i === points.length - 1 || points.length <= 8}
        <text x={p.x} y={height - 8} class="axis-label" text-anchor="middle">{p.label}</text>
      {/if}
    {/each}
  </svg>
{/if}

<style>
  .chart-svg,
  .pie-svg {
    width: 100%;
    display: block;
  }
  .chart-svg {
    height: auto;
  }
  .grid-line {
    stroke: var(--color-glass-border);
    stroke-width: 1;
    opacity: 0.5;
  }
  .axis-label {
    font-size: 11px;
    fill: var(--color-text);
    opacity: 0.55;
  }
  .bar {
    transition: opacity 0.15s ease;
  }
  .bar:hover {
    opacity: 0.8;
  }
  .pie-wrap {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .pie-svg {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
  }
  .pie-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 160px;
  }
  .pie-legend li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .legend-label {
    flex: 1;
    opacity: 0.8;
  }
  .legend-value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .chart-skeleton,
  .chart-empty {
    border-radius: 12px;
    width: 100%;
  }
  .chart-skeleton {
    background: linear-gradient(90deg, var(--color-glass-bg) 25%, rgba(255, 255, 255, 0.06) 50%, var(--color-glass-bg) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  .chart-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    opacity: 0.5;
    background: var(--color-glass-bg);
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .chart-skeleton { animation: none; }
  }
</style>
