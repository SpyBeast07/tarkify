<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adminFetch, AdminApiError } from '$lib/admin/api/client';
	import AdminPage from '$lib/admin/components/AdminPage.svelte';
	import AdminPageHeader from '$lib/admin/components/AdminPageHeader.svelte';
	import AdminSection from '$lib/admin/components/AdminSection.svelte';
	import ProductForm from '$lib/admin/components/ProductForm.svelte';
	import AdminPageContainer from '$lib/admin/components/AdminPageContainer.svelte';

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
	let saving = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);
	let categories = $state<string[]>(['General']);

	onMount(async () => {
		try {
			const result = await adminFetch<{ categories: string[] }>('/products/categories');
			categories = ['General', ...result.categories.filter((c: string) => c !== 'General')];
		} catch {
			// non-critical
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		error = null;
		success = null;
		errors = {};

		try {
			const result = await adminFetch<{ product: { id: string } }>('/products', {
				method: 'POST',
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
			success = 'Product created successfully!';
			setTimeout(() => goto(`/admin/products/${result.product.id}`), 1000);
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
				error = 'Failed to create product';
			}
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/admin/products');
	}
</script>

<AdminPageContainer>
	<AdminPageHeader title="New Product" description="Create a new product" />

	<AdminPage>
		<AdminSection title="Product Details">
			<ProductForm
				bind:data
				bind:errors
				{saving}
				{error}
				{success}
				submitLabel="Create Product"
				{categories}
				onsubmit={handleSubmit}
				oncancel={handleCancel}
			/>
		</AdminSection>
	</AdminPage>
</AdminPageContainer>
