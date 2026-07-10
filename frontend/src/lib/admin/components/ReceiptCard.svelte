<script lang="ts">
	import { FileText, ExternalLink } from '@lucide/svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface ReceiptData {
		receipt_number: string;
		purchase_date: string;
		amount: number;
		currency: string;
		razorpay_payment_id: string | null;
		razorpay_order_id: string;
		product_name: string;
		customer_email: string;
		customer_name: string | null;
	}

	interface Props {
		receipt: ReceiptData;
		class?: string;
	}

	let { receipt, class: className = '' }: Props = $props();

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatPrice(amount: number, currency: string): string {
		try {
			return new Intl.NumberFormat('en-IN', {
				style: 'currency',
				currency: currency || 'INR',
				maximumFractionDigits: 0
			}).format(amount);
		} catch {
			return `${currency} ${amount}`;
		}
	}
</script>

<SectionCard title="Receipt" icon={FileText} class={className}>
	<div class="receipt-details">
		<div class="receipt-row">
			<span class="receipt-label">Receipt No.</span>
			<span class="receipt-value mono">#{receipt.receipt_number.substring(0, 8)}</span>
		</div>
		<div class="receipt-row">
			<span class="receipt-label">Purchase Date</span>
			<span class="receipt-value">{formatDate(receipt.purchase_date)}</span>
		</div>
		<div class="receipt-row">
			<span class="receipt-label">Product</span>
			<span class="receipt-value">{receipt.product_name}</span>
		</div>
		<div class="receipt-row">
			<span class="receipt-label">Customer</span>
			<span class="receipt-value">{receipt.customer_name || receipt.customer_email}</span>
		</div>
		<div class="receipt-row total">
			<span class="receipt-label">Total</span>
			<span class="receipt-value total-value">{formatPrice(receipt.amount, receipt.currency)}</span>
		</div>
		<div class="receipt-row">
			<span class="receipt-label">Payment ID</span>
			<span class="receipt-value mono">{receipt.razorpay_payment_id || '—'}</span>
		</div>
		<div class="receipt-row">
			<span class="receipt-label">Order ID</span>
			<span class="receipt-value mono">{receipt.razorpay_order_id}</span>
		</div>
	</div>
</SectionCard>

<style>
	.receipt-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.receipt-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.receipt-label {
		font-size: 0.8rem;
		opacity: 0.55;
		font-weight: 500;
	}

	.receipt-value {
		font-size: 0.9rem;
		font-weight: 500;
		text-align: right;
		word-break: break-all;
	}

	.receipt-value.mono {
		font-family: var(--font-accent);
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.receipt-row.total {
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-glass-border);
		margin-top: 0.25rem;
	}

	.total-value {
		font-size: 1.1rem;
		font-weight: 700;
	}
</style>
