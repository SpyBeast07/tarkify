<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		ArrowLeft,
		Edit,
		Package,
		DollarSign,
		Eye,
		Search,
		Tag,
		FileText,
		BarChart3,
		Archive,
		RotateCcw,
		Send
	} from '@lucide/svelte';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import AdminEmptyState from '$lib/admin/components/AdminEmptyState.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ProductStatusBadge from '$lib/admin/components/ProductStatusBadge.svelte';

	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';
	import AdminCard from '$lib/admin/components/AdminCard.svelte';
	import AdminGrid from '$lib/admin/components/AdminGrid.svelte';
	import AdminStack from '$lib/admin/components/AdminStack.svelte';
	import AdminTable from '$lib/admin/components/AdminTable.svelte';
	import AdminDialog from '$lib/admin/components/AdminDialog.svelte';
	import AdminSectionHeader from '$lib/admin/components/AdminSectionHeader.svelte';
	import AdminButtonGroup from '$lib/admin/components/AdminButtonGroup.svelte';

	let productId = $derived($page.params.id ?? '');

	interface ProductDetail {
		id: string;
		slug: string;
		name: string;
		description: string | null;
		short_description: string | null;
		type: string;
		price: number;
		currency: string;
		download_key: string | null;
		status: string;
		visibility: string;
		category: string;
		tags: string[];
		seo_title: string | null;
		seo_description: string | null;
		og_image: string | null;
		version: string;
		release_date: string | null;
		release_notes: string | null;
		active: boolean;
		created_at: string;
		updated_at: string;
	}

	interface AuditEntry {
		id: string;
		event: string;
		user_id: string | null;
		user_name: string | null;
		metadata: Record<string, unknown>;
		created_at: string;
	}

	let product = $state<ProductDetail | null>(null);
	let audit = $state<AuditEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let actionSuccess = $state<string | null>(null);

	let showArchiveDialog = $state(false);
	let showPublishDialog = $state(false);
	let showUnpublishDialog = $state(false);
	let showRestoreDialog = $state(false);
	let actionLoading = $state(false);

	async function loadProduct() {
		loading = true;
		error = null;
		try {
			const result = await adminFetch<{ product: ProductDetail; audit: AuditEntry[] }>(`/products/${productId}`);
			product = result.product;
			audit = result.audit;
		} catch (err) {
			if (err instanceof AdminApiError) {
				error = err.message;
			} else {
				error = 'Failed to load product';
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadProduct);

	async function performAction(action: string) {
		actionLoading = true;
		actionError = null;
		actionSuccess = null;
		try {
			const result = await adminFetch<{ product: ProductDetail }>(`/products/${productId}/${action}`, {
				method: 'POST'
			});
			product = result.product;
			actionSuccess = `Product ${action.replace('-', ' ')}d successfully`;
			showArchiveDialog = false;
			showPublishDialog = false;
			showUnpublishDialog = false;
			showRestoreDialog = false;
			await loadProduct();
		} catch (err) {
			if (err instanceof AdminApiError) {
				actionError = err.message;
			} else {
				actionError = `Failed to ${action} product`;
			}
		} finally {
			actionLoading = false;
		}
	}

	function formatPrice(price: number, currency: string): string {
		try {
			return new Intl.NumberFormat('en-IN', {
				style: 'currency',
				currency: currency || 'INR',
				maximumFractionDigits: 0
			}).format(price);
		} catch {
			return `${currency} ${price}`;
		}
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function formatAuditEvent(event: string): string {
		return event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
	}
</script>

<AdminPageContainer>
	<AdminPage {loading} {error} onRetry={loadProduct}>
		{#if product}
			<AdminPageHeader title={product.name} description={product.short_description || `Slug: ${product.slug}`}>
				<AdminButtonGroup align="right">
					<Button variant="ghost" href="/admin/products" size="sm" class="btn-with-icon">
						<ArrowLeft size={16} />
						Back
					</Button>
					<Button variant="secondary" href={`/admin/products/${product.id}/edit`} size="sm" class="btn-with-icon">
						<Edit size={16} />
						Edit
					</Button>
					{#if product.status === 'draft'}
						<Button variant="primary" onclick={() => (showPublishDialog = true)} size="sm" class="btn-with-icon">
							<Send size={16} />
							Publish
						</Button>
					{/if}
					{#if product.status === 'published'}
						<Button variant="secondary" onclick={() => (showUnpublishDialog = true)} size="sm" class="btn-with-icon">
							<RotateCcw size={16} />
							Unpublish
						</Button>
					{/if}
					{#if product.status === 'archived'}
						<Button variant="secondary" onclick={() => (showRestoreDialog = true)} size="sm" class="btn-with-icon">
							<RotateCcw size={16} />
							Restore
						</Button>
					{/if}
					{#if product.status !== 'archived'}
						<Button variant="danger" onclick={() => (showArchiveDialog = true)} size="sm" class="btn-with-icon">
							<Archive size={16} />
							Archive
						</Button>
					{/if}
				</AdminButtonGroup>
			</AdminPageHeader>

			{#if actionError}
				<div class="alert alert-error" role="alert" style="margin-bottom: 1rem;">
					{actionError}
				</div>
			{/if}

			{#if actionSuccess}
				<div class="alert alert-success" role="alert" style="margin-bottom: 1rem;">
					{actionSuccess}
				</div>
			{/if}

			<AdminGrid cols={{ default: 1, md: 3 }} gap="md">
				<div class="span-two-columns">
					<AdminStack gap="md">
						<AdminCard>
							<AdminSectionHeader title="Overview" />
							<div class="detail-list">
								<div class="detail-item">
									<span class="detail-label">Name</span>
									<span class="detail-value">{product.name}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Slug</span>
									<span class="detail-value"><code>{product.slug}</code></span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Description</span>
									<span class="detail-value">{product.description || '—'}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Short Description</span>
									<span class="detail-value">{product.short_description || '—'}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Category</span>
									<span class="detail-value"><span class="category-tag">{product.category}</span></span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Tags</span>
									<span class="detail-value">
										{#if product.tags && product.tags.length > 0}
											<div class="tags-list">
												{#each product.tags as tag}
													<Badge><span>{tag}</span></Badge>
												{/each}
											</div>
										{:else}
											—
										{/if}
									</span>
								</div>
							</div>
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="Pricing" />
							<div class="detail-list">
								<div class="detail-item">
									<span class="detail-label">Price</span>
									<span class="detail-value price-value">{formatPrice(product.price, product.currency)}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Type</span>
									<span class="detail-value">{product.type}</span>
								</div>
							</div>
						</AdminCard>

						<AdminCard>
							<AdminSectionHeader title="SEO" />
							<div class="detail-list">
								<div class="detail-item">
									<span class="detail-label">SEO Title</span>
									<span class="detail-value">{product.seo_title || '—'}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">SEO Description</span>
									<span class="detail-value">{product.seo_description || '—'}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">OG Image</span>
									<span class="detail-value">{product.og_image || '—'}</span>
								</div>
							</div>
						</AdminCard>

						<AdminSection title="Audit Summary">
							{#if audit.length === 0}
								<AdminEmptyState title="No audit entries" message="No activity recorded for this product." />
							{:else}
								<AdminTable>
									<thead>
										<tr>
											<th>Event</th>
											<th>User</th>
											<th>Date</th>
										</tr>
									</thead>
									<tbody>
										{#each audit.slice(0, 10) as entry}
											<tr>
												<td>{formatAuditEvent(entry.event)}</td>
												<td>{entry.user_name || entry.user_id || 'System'}</td>
												<td>{formatDate(entry.created_at)}</td>
											</tr>
										{/each}
									</tbody>
								</AdminTable>
							{/if}
						</AdminSection>
					</AdminStack>
				</div>

				<AdminStack gap="md">
					<AdminCard>
						<AdminSectionHeader title="Status & Visibility" />
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Status</span>
								<span class="detail-value"><ProductStatusBadge status={product.status} /></span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Visibility</span>
								<span class="detail-value">{product.visibility}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Created</span>
								<span class="detail-value">{formatDate(product.created_at)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Updated</span>
								<span class="detail-value">{formatDate(product.updated_at)}</span>
							</div>
						</div>
					</AdminCard>

					<AdminCard>
						<AdminSectionHeader title="Versions" />
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Current Version</span>
								<span class="detail-value version-value">v{product.version}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">Release Date</span>
								<span class="detail-value">{product.release_date ? formatDate(product.release_date) : '—'}</span>
							</div>
						</div>
					</AdminCard>

					{#if product.release_notes}
						<AdminCard>
							<AdminSectionHeader title="Release Notes" />
							<div class="release-notes">
								{product.release_notes}
							</div>
						</AdminCard>
					{/if}

					<AdminCard>
						<AdminSectionHeader title="Statistics" />
						<div class="detail-list">
							<div class="detail-item">
								<span class="detail-label">Download Key</span>
								<span class="detail-value">{product.download_key || '—'}</span>
							</div>
						</div>
					</AdminCard>
				</AdminStack>
			</AdminGrid>
		{/if}
	</AdminPage>
</AdminPageContainer>

<AdminDialog
	bind:open={showPublishDialog}
	title="Publish Product"
	message="Are you sure you want to publish this product? It will become visible to customers."
	confirmText="Publish"
	disabled={actionLoading}
	onconfirm={() => performAction('publish')}
	variant="primary"
/>

<AdminDialog
	bind:open={showUnpublishDialog}
	title="Unpublish Product"
	message="This will set the product back to draft. Customers will no longer see it in the catalog."
	confirmText="Unpublish"
	disabled={actionLoading}
	onconfirm={() => performAction('unpublish')}
	variant="danger"
/>

<AdminDialog
	bind:open={showArchiveDialog}
	title="Archive Product"
	message="This will archive the product. It will remain in history but won't be visible to customers. You can restore it later."
	confirmText="Archive"
	disabled={actionLoading}
	onconfirm={() => performAction('archive')}
	variant="danger"
/>

<AdminDialog
	bind:open={showRestoreDialog}
	title="Restore Product"
	message="This will restore the product as a draft. You can publish it when ready."
	confirmText="Restore"
	disabled={actionLoading}
	onconfirm={() => performAction('restore')}
	variant="primary"
/>

<style>
	.span-two-columns {
		grid-column: span 2;
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.detail-label {
		font-size: 0.8rem;
		opacity: 0.5;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.detail-value {
		font-size: 0.95rem;
		line-height: 1.5;
		word-break: break-word;
	}

	.detail-value code {
		font-size: 0.85rem;
		opacity: 0.7;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
	}

	.price-value {
		font-size: 1.2rem;
		font-weight: 700;
	}

	.version-value {
		font-family: var(--font-accent);
		font-weight: 600;
	}

	.category-tag {
		font-size: 0.85rem;
		padding: 0.2rem 0.6rem;
		background: rgba(39, 59, 9, 0.08);
		border-radius: 6px;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.release-notes {
		font-size: 0.9rem;
		line-height: 1.6;
		white-space: pre-wrap;
		margin-top: 0.5rem;
		opacity: 0.85;
	}

	@media (max-width: 900px) {
		.span-two-columns {
			grid-column: span 1;
		}
	}
</style>
