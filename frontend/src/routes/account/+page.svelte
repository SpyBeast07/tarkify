<script lang="ts">
	import { fly } from 'svelte/transition';
	import { User, Download, Receipt, CreditCard } from '@lucide/svelte';
	import Seo from '$lib/components/Seo.svelte';
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<Seo
	title="Account | Tarkify"
	description="Manage your Tarkify account, downloads, and purchases."
	ogImage="/og-image.svg"
	ogType="website"
/>

<div class="account-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="account-hero text-center">
			<span class="section-badge">Account</span>
			<h1>Customer Portal</h1>
			<p class="section-subtext">
				Manage your downloads, purchases, and billing — all in one place.
			</p>
		</div>

		<div transition:fly={{ y: 20, duration: 400, delay: 150 }} class="account-coming-soon glass">
			<div class="account-icon-wrapper">
				<User size={32} />
			</div>
			<h2>Coming Soon</h2>
			<p>
				We're building a full customer portal where you'll be able to manage your downloads, view
				purchase history, and handle billing.
			</p>

			<div class="account-features-preview">
				<div class="account-feature-item">
					<Download size={20} />
					<span>Downloads</span>
				</div>
				<div class="account-feature-item">
					<Receipt size={20} />
					<span>Purchases</span>
				</div>
				<div class="account-feature-item">
					<CreditCard size={20} />
					<span>Billing</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.account-page {
		min-height: 60vh;
	}

	.account-hero {
		margin-bottom: 3rem;
	}

	.account-hero h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.account-coming-soon {
		max-width: 560px;
		margin: 0 auto;
		padding: 3rem 2.5rem;
		border-radius: 24px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.account-icon-wrapper {
		width: 64px;
		height: 64px;
		border-radius: 18px;
		background: linear-gradient(135deg, var(--color-primary-green), var(--color-accent-green));
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
	}

	.account-coming-soon h2 {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.account-coming-soon p {
		font-size: 0.95rem;
		opacity: 0.7;
		line-height: 1.7;
		max-width: 400px;
	}

	.account-features-preview {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
	}

	.account-feature-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		opacity: 0.6;
	}

	@media (max-width: 640px) {
		.account-hero h1 {
			font-size: 2.25rem;
		}

		.account-features-preview {
			flex-direction: column;
			gap: 1rem;
		}

		.account-coming-soon {
			padding: 2rem 1.5rem;
		}
	}
</style>
