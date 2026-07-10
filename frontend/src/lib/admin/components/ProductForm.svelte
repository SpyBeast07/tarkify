<script lang="ts">
	import { type Snippet } from 'svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import TagInput from './TagInput.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';

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

<form onsubmit={onsubmit} novalidate>
	{#if error}
		<Alert type="error"><span>{error}</span></Alert>
	{/if}
	{#if success}
		<Alert type="success"><span>{success}</span></Alert>
	{/if}

	<div class="form-grid">
		<div class="form-column">
			<Input
				type="text"
				label="Product Name *"
				bind:value={data.name}
				error={errors.name}
				required
				placeholder="Enter product name"
				oninput={generateSlug}
			/>

			<Input
				type="text"
				label="Slug *"
				bind:value={data.slug}
				error={errors.slug}
				required
				placeholder="my-product-slug"
				oninput={markChanged}
			/>

			<Input
				type="textarea"
				label="Short Description"
				bind:value={data.short_description}
				error={errors.short_description}
				placeholder="Brief description for listings"
				rows={2}
				maxlength={500}
			/>

			<Input
				type="textarea"
				label="Description"
				bind:value={data.description}
				error={errors.description}
				placeholder="Full product description"
				rows={6}
			/>

			<Input
				type="select"
				label="Category"
				bind:value={data.category}
				error={errors.category}
				options={categories.length > 1 ? categories : ['General']}
			/>

			<TagInput bind:tags={data.tags} error={errors.tags} />
		</div>

		<div class="form-column">
			<div class="form-row">
				<Input
					type="number"
					label="Price *"
					bind:value={data.price}
					error={errors.price}
					required
					placeholder="0"
					class="price-input"
				/>
				<Input
					type="select"
					label="Currency"
					bind:value={data.currency}
					error={errors.currency}
					options={['INR', 'USD', 'EUR', 'GBP']}
					class="currency-input"
				/>
			</div>

			<Input
				type="select"
				label="Status"
				bind:value={data.status}
				error={errors.status}
				options={[
					{ value: 'draft', label: 'Draft' },
					{ value: 'published', label: 'Published' },
					{ value: 'archived', label: 'Archived' }
				]}
			/>

			<Input
				type="select"
				label="Visibility"
				bind:value={data.visibility}
				error={errors.visibility}
				options={[
					{ value: 'public', label: 'Public' },
					{ value: 'hidden', label: 'Hidden' }
				]}
			/>

			<Input
				type="text"
				label="Version"
				bind:value={data.version}
				error={errors.version}
				placeholder="1.0.0"
			/>

			<Input
				type="text"
				label="Download Key"
				bind:value={data.download_key}
				error={errors.download_key}
				placeholder="storage folder key"
			/>

			<Input
				type="text"
				label="Release Date"
				bind:value={data.release_date}
				error={errors.release_date}
				placeholder="YYYY-MM-DD"
			/>

			<Input
				type="textarea"
				label="Release Notes"
				bind:value={data.release_notes}
				error={errors.release_notes}
				placeholder="Markdown release notes"
				rows={4}
			/>

			<div class="form-section">
				<h3 class="section-label">SEO Settings</h3>

				<Input
					type="text"
					label="SEO Title"
					bind:value={data.seo_title}
					error={errors.seo_title}
					placeholder="Meta title"
					maxlength={255}
				/>

				<Input
					type="textarea"
					label="SEO Description"
					bind:value={data.seo_description}
					error={errors.seo_description}
					placeholder="Meta description"
					rows={2}
					maxlength={500}
				/>

				<Input
					type="text"
					label="OG Image URL"
					bind:value={data.og_image}
					error={errors.og_image}
					placeholder="https://example.com/og-image.jpg"
				/>
			</div>
		</div>
	</div>

	{#if children}
		{@render children()}
	{/if}

	<div class="form-actions">
		<Button type="button" variant="ghost" onclick={oncancel} disabled={saving}>
			Cancel
		</Button>
		<Button type="submit" variant="primary" disabled={saving}>
			{#if saving}
				<Loading size={16} />
			{/if}
			{submitLabel}
		</Button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.form-column {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 120px;
		gap: 0.75rem;
	}

	.form-section {
		border-top: 1px solid var(--color-glass-border);
		padding-top: 1rem;
		margin-top: 0.5rem;
	}

	.section-label {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: var(--color-text);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-glass-border);
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
