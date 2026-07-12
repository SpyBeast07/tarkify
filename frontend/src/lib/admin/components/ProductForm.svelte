<script lang="ts">
	import { type Snippet } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import TagInput from './TagInput.svelte';

	import AdminForm from './AdminForm.svelte';
	import AdminFormSection from './AdminFormSection.svelte';
	import AdminInput from './AdminInput.svelte';
	import AdminSelect from './AdminSelect.svelte';
	import AdminTextarea from './AdminTextarea.svelte';
	import AdminGrid from './AdminGrid.svelte';
	import AdminStack from './AdminStack.svelte';
	import AdminButtonGroup from './AdminButtonGroup.svelte';

	interface FormData {
		name: string;
		slug: string;
		short_description: string;
		description: string;
		price: number;
		currency: string;
		category: string;
		tags: string[];
		visibility: 'public' | 'hidden';
		status: 'draft' | 'published' | 'archived';
		seo_title: string;
		seo_description: string;
		og_image: string;
		download_key: string;
		version: string;
		release_date: string;
		release_notes: string;
	}

	interface Errors {
		[key: string]: string;
	}

	interface Props {
		data: FormData;
		errors: Errors;
		saving: boolean;
		error: string | null;
		success: string | null;
		submitLabel: string;
		categories: string[];
		children?: Snippet;
		onsubmit: (e: SubmitEvent) => void;
		oncancel: () => void;
	}

	let {
		data = $bindable(),
		errors = $bindable(),
		saving,
		error,
		success,
		submitLabel,
		categories = [],
		children,
		onsubmit,
		oncancel
	}: Props = $props();

	let hasChanges = $state(false);

	function generateSlug() {
		if (!hasChanges) {
			data.slug = data.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
		}
	}

	function markChanged() {
		hasChanges = true;
	}
</script>

<AdminForm {onsubmit}>
	{#if error}
		<Alert type="error"><span>{error}</span></Alert>
	{/if}
	{#if success}
		<Alert type="success"><span>{success}</span></Alert>
	{/if}

	<AdminGrid cols={{ default: 1, md: 2 }} gap="md">
		<AdminStack gap="sm">
			<AdminInput
				type="text"
				label="Product Name"
				bind:value={data.name}
				error={errors.name}
				required
				placeholder="Enter product name"
				oninput={generateSlug}
			/>

			<AdminInput
				type="text"
				label="Slug"
				bind:value={data.slug}
				error={errors.slug}
				required
				placeholder="my-product-slug"
				oninput={markChanged}
			/>

			<AdminTextarea
				label="Short Description"
				bind:value={data.short_description}
				error={errors.short_description}
				placeholder="Brief description for listings"
				rows={2}
				maxlength={500}
			/>

			<AdminTextarea
				label="Description"
				bind:value={data.description}
				error={errors.description}
				placeholder="Full product description"
				rows={6}
			/>

			<AdminSelect
				label="Category"
				bind:value={data.category}
				error={errors.category}
				options={categories.length > 1 ? categories : ['General']}
			/>

			<div class="tag-input-field-wrapper">
				<TagInput bind:tags={data.tags} error={errors.tags} />
			</div>
		</AdminStack>

		<AdminStack gap="sm">
			<AdminGrid cols={2} gap="sm">
				<AdminInput
					type="number"
					label="Price"
					bind:value={data.price}
					error={errors.price}
					required
					placeholder="0"
				/>
				<AdminSelect
					label="Currency"
					bind:value={data.currency}
					error={errors.currency}
					options={['INR', 'USD', 'EUR', 'GBP']}
				/>
			</AdminGrid>

			<AdminSelect
				label="Status"
				bind:value={data.status}
				error={errors.status}
				options={[
					{ value: 'draft', label: 'Draft' },
					{ value: 'published', label: 'Published' },
					{ value: 'archived', label: 'Archived' }
				]}
			/>

			<AdminSelect
				label="Visibility"
				bind:value={data.visibility}
				error={errors.visibility}
				options={[
					{ value: 'public', label: 'Public' },
					{ value: 'hidden', label: 'Hidden' }
				]}
			/>

			<AdminInput
				type="text"
				label="Version"
				bind:value={data.version}
				error={errors.version}
				placeholder="1.0.0"
			/>

			<AdminInput
				type="text"
				label="Download Key"
				bind:value={data.download_key}
				error={errors.download_key}
				placeholder="storage folder key"
			/>

			<AdminInput
				type="text"
				label="Release Date"
				bind:value={data.release_date}
				error={errors.release_date}
				placeholder="YYYY-MM-DD"
			/>

			<AdminTextarea
				label="Release Notes"
				bind:value={data.release_notes}
				error={errors.release_notes}
				placeholder="Markdown release notes"
				rows={4}
			/>

			<AdminFormSection title="SEO Settings">
				<AdminInput
					type="text"
					label="SEO Title"
					bind:value={data.seo_title}
					error={errors.seo_title}
					placeholder="Meta title"
					maxlength={255}
				/>

				<AdminTextarea
					label="SEO Description"
					bind:value={data.seo_description}
					error={errors.seo_description}
					placeholder="Meta description"
					rows={2}
					maxlength={500}
				/>

				<AdminInput
					type="text"
					label="OG Image URL"
					bind:value={data.og_image}
					error={errors.og_image}
					placeholder="https://example.com/og-image.jpg"
				/>
			</AdminFormSection>
		</AdminStack>
	</AdminGrid>

	{#if children}
		{@render children()}
	{/if}

	<AdminButtonGroup align="right">
		<Button type="button" variant="ghost" onclick={oncancel} disabled={saving}>
			Cancel
		</Button>
		<Button type="submit" variant="primary" disabled={saving}>
			{#if saving}
				<Loading size={16} />
			{/if}
			{submitLabel}
		</Button>
	</AdminButtonGroup>
</AdminForm>

<style>
	.tag-input-field-wrapper {
		width: 100%;
	}
</style>
