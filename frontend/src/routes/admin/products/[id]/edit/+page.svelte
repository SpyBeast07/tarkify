<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import ProductForm from '$lib/admin/components/ProductForm.svelte';

	let productId = $derived($page.params.id ?? '');

	let data = $state({
		name: '',
		slug: '',
		short_description: '',
		description: '',
		price: 0,
		currency: 'INR',
		category: 'General',
		tags: [] as string[],
		visibility: 'public' as 'public' | 'hidden',
		status: 'draft' as 'draft' | 'published' | 'archived',
		seo_title: '',
		seo_description: '',
		og_image: '',
		download_key: '',
		version: '1.0.0',
		release_date: '',
		release_notes: ''
	});

	let errors = $state<Record<string, string>>({});
	let loading = $state(true);
	let loadingError = $state<string | null>(null);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);
	let categories = $state<string[]>(['General']);

	onMount(async () => {
		await Promise.all([loadProduct(), loadCategories()]);
	});

	async function loadProduct() {
		loading = true;
		loadingError = null;
		try {
			const result = await adminFetch<{ product: ProductDetail }>(`/products/${productId}`);
			const p = result.product;
			data = {
				name: p.name,
				slug: p.slug,
				short_description: p.short_description || '',
				description: p.description || '',
				price: p.price,
				currency: p.currency,
				category: p.category,
				tags: p.tags || [],
				visibility: p.visibility as 'public' | 'hidden',
				status: p.status as 'draft' | 'published' | 'archived',
				seo_title: p.seo_title || '',
				seo_description: p.seo_description || '',
				og_image: p.og_image || '',
				download_key: p.download_key || '',
				version: p.version,
				release_date: p.release_date || '',
				release_notes: p.release_notes || ''
			};
		} catch (err) {
			if (err instanceof AdminApiError) {
				loadingError = err.message;
			} else {
				loadingError = 'Failed to load product';
			}
		} finally {
			loading = false;
		}
	}

	async function loadCategories() {
		try {
			const result = await adminFetch<{ categories: string[] }>('/products/categories');
			categories = ['General', ...result.categories.filter((c: string) => c !== 'General')];
		} catch {
			// non-critical
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		error = null;
		success = null;
		errors = {};

		try {
			await adminFetch<{ product: { id: string } }>(`/products/${productId}`, {
				method: 'PUT',
				body: JSON.stringify({
					...data,
					price: Number(data.price),
					tags: data.tags,
					release_date: data.release_date || undefined,
					short_description: data.short_description || undefined,
					description: data.description || undefined,
					seo_title: data.seo_title || undefined,
					seo_description: data.seo_description || undefined,
					og_image: data.og_image || undefined,
					download_key: data.download_key || undefined,
					release_notes: data.release_notes || undefined,
				}),
			});
			success = 'Product updated successfully!';
			setTimeout(() => goto(`/admin/products/${productId}`), 1000);
		} catch (err) {
			if (err instanceof AdminApiError) {
				if (err.code === 'VALIDATION_ERROR') {
					const msg = err.message;
					const colonIdx = msg.indexOf(':');
					if (colonIdx > 0) {
						const field = msg.substring(0, colonIdx);
						errors = { [field]: msg.substring(colonIdx + 2) };
					} else {
						errors = { form: msg };
					}
				} else if (err.code === 'SLUG_EXISTS') {
					errors = { slug: err.message };
				} else {
					error = err.message;
				}
			} else {
				error = 'Failed to update product';
			}
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto(`/admin/products/${productId}`);
	}

	interface ProductDetail {
		name: string;
		slug: string;
		short_description: string | null;
		description: string | null;
		price: number;
		currency: string;
		category: string;
		tags: string[];
		visibility: string;
		status: string;
		seo_title: string | null;
		seo_description: string | null;
		og_image: string | null;
		download_key: string | null;
		version: string;
		release_date: string | null;
		release_notes: string | null;
	}
</script>

<AdminPageHeader title="Edit Product" description={loading ? '' : `Editing: ${data.name || ''}`} />

<AdminPage {loading} error={loadingError} onRetry={loadProduct}>
	<AdminSection title="Edit Product Details">
		<ProductForm
			bind:data
			bind:errors
			{saving}
			{error}
			{success}
			submitLabel="Save Changes"
			{categories}
			onsubmit={handleSubmit}
			oncancel={handleCancel}
		/>
	</AdminSection>
</AdminPage>
