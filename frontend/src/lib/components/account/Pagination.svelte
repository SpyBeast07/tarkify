<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';

  let {
    page = $bindable(1),
    totalPages = 1,
    disabled = false,
  }: {
    page: number;
    totalPages: number;
    disabled?: boolean;
  } = $props();
</script>

{#if totalPages > 1}
  <nav class="pagination" aria-label="Pagination">
    <button
      class="pagination-btn"
      onclick={() => { if (page > 1) page = Math.max(1, page - 1); }}
      disabled={page <= 1 || disabled}
      aria-label="Previous page"
    >
      <ChevronLeft size={16} />
    </button>

    {#each { length: Math.min(totalPages, 7) } as _, i}
      {@const p = totalPages <= 7
        ? i + 1
        : page <= 4
          ? i + 1
          : page >= totalPages - 3
            ? totalPages - 6 + i
            : page - 3 + i}
      {#if p >= 1 && p <= totalPages}
        <button
          class="pagination-btn"
          class:active={p === page}
          onclick={() => (page = p)}
          disabled={disabled}
        >
          {p}
        </button>
      {/if}
    {/each}

    <button
      class="pagination-btn"
      onclick={() => { if (page < totalPages) page = Math.min(totalPages, page + 1); }}
      disabled={page >= totalPages || disabled}
      aria-label="Next page"
    >
      <ChevronRight size={16} />
    </button>
  </nav>
{/if}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    margin-top: 1.5rem;
  }

  .pagination-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    padding: 0 0.5rem;
    border: 1px solid var(--color-glass-border);
    border-radius: 10px;
    background: var(--color-glass-bg);
    color: var(--color-text);
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .pagination-btn:hover:not(:disabled) {
    background: var(--color-card-bg);
    border-color: var(--color-accent-green);
  }

  .pagination-btn.active {
    background: var(--color-primary-green);
    border-color: var(--color-primary-green);
    color: #fff;
    font-weight: 600;
  }

  .pagination-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
