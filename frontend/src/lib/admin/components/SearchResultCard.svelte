<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowUpRight, Clock } from '@lucide/svelte';
  import type { SearchResult } from '$lib/admin/types/search';
  import SearchModuleBadge from './SearchModuleBadge.svelte';

  interface Props {
    result: SearchResult;
  }

  let { result }: Props = $props();

  function open() {
    goto(result.targetUrl);
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const matchedLabel = $derived(
    result.matchedField ? `${result.matchedField}: ${result.matchedText}` : result.matchedText
  );
</script>

<article class="search-result-card glass" role="listitem">
  <div class="card-top">
    <SearchModuleBadge module={result.module} />
    <span class="card-time"><Clock size={13} aria-hidden="true" /> {formatTime(result.timestamp)}</span>
  </div>

  <h3 class="card-title">{result.title}</h3>
  {#if result.subtitle}
    <p class="card-subtitle">{result.subtitle}</p>
  {/if}
  {#if matchedLabel}
    <p class="card-matched">
      <span class="matched-tag">Matched</span> {matchedLabel}
    </p>
  {/if}

  <div class="card-actions">
    <button class="open-btn" onclick={open} aria-label="Open {result.title}">
      Open <ArrowUpRight size={14} aria-hidden="true" />
    </button>
  </div>
</article>

<style>
  .search-result-card {
    padding: 1rem 1.1rem;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .card-time {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    opacity: 0.55;
  }

  .card-title {
    font-size: 0.98rem;
    font-weight: 600;
    margin: 0.1rem 0 0;
    color: var(--color-text);
  }

  .card-subtitle {
    font-size: 0.85rem;
    opacity: 0.7;
    margin: 0;
  }

  .card-matched {
    font-size: 0.8rem;
    opacity: 0.65;
    margin: 0.1rem 0 0;
    word-break: break-word;
  }

  .matched-tag {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(123, 144, 75, 0.14);
    color: var(--color-accent-green);
    border-radius: 6px;
    padding: 0.05rem 0.35rem;
    margin-right: 0.25rem;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.3rem;
  }

  .open-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--color-glass-bg);
    border: 1px solid var(--color-glass-border);
    border-radius: 9px;
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--color-text);
    cursor: pointer;
  }

  .open-btn:hover {
    background: rgba(123, 144, 75, 0.12);
    color: var(--color-accent-green);
  }
</style>
