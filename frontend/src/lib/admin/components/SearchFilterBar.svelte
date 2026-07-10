<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { SearchModule } from '$lib/admin/types/search';

  interface Props {
    module: SearchModule | 'all';
    sort: 'relevance' | 'newest';
    modules: { value: SearchModule; label: string }[];
    onModuleChange?: (value: SearchModule | 'all') => void;
    onSortChange?: (value: 'relevance' | 'newest') => void;
  }

  let {
    module = $bindable(),
    sort = $bindable(),
    modules,
    onModuleChange,
    onSortChange
  }: Props = $props();

  const moduleOptions = $derived([
    { value: 'all', label: 'All Modules' },
    ...modules.map((m) => ({ value: m.value, label: m.label }))
  ]);

  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'newest', label: 'Newest' }
  ];

  function handleModule(e: Event) {
    const v = (e.target as HTMLSelectElement).value as SearchModule | 'all';
    module = v;
    onModuleChange?.(v);
  }

  function handleSort(e: Event) {
    const v = (e.target as HTMLSelectElement).value as 'relevance' | 'newest';
    sort = v;
    onSortChange?.(v);
  }
</script>

<div class="search-filter-bar glass">
  <div class="filter-grid">
    <Input
      type="select"
      bind:value={module}
      options={moduleOptions}
      onchange={handleModule}
      aria-label="Filter by module"
    />
    <Input
      type="select"
      bind:value={sort}
      options={sortOptions}
      onchange={handleSort}
      aria-label="Sort results"
    />
  </div>
</div>

<style>
  .search-filter-bar {
    padding: 0.85rem;
    border-radius: 14px;
    margin-bottom: 1rem;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }
</style>
