<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertTriangle, WifiOff, ShieldAlert, SearchX } from '@lucide/svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		type?: 'error' | '401' | '403' | '404' | '500' | 'offline';
		title?: string;
		message?: string;
		onRetry?: () => void;
		class?: string;
		children?: Snippet;
	}

	let {
		type = 'error',
		title = '',
		message = '',
		onRetry,
		class: className = '',
		children
	}: Props = $props();

	const defaults = {
		'401': {
			title: 'Unauthorized',
			message: 'Please sign in to access this page.'
		},
		'403': {
			title: 'Forbidden',
			message: 'You do not have permission to access this page.'
		},
		'404': {
			title: 'Not Found',
			message: 'The page you are looking for does not exist.'
		},
		'500': {
			title: 'Server Error',
			message: 'Something went wrong. Please try again later.'
		},
		offline: {
			title: 'No Connection',
			message: 'Please check your internet connection and try again.'
		},
		error: {
			title: 'Error',
			message: 'An unexpected error occurred.'
		}
	};

	const resolved = $derived({
		title: title || defaults[type].title,
		message: message || defaults[type].message
	});
</script>

<div class="admin-error {className}" role="alert">
	<Alert type="error">
		<strong>{resolved.title}</strong>: {resolved.message}
	</Alert>

	{#if children}
		<div class="admin-error-content">
			{@render children()}
		</div>
	{/if}

	{#if onRetry}
		<div class="admin-error-action">
			<Button variant="primary" onclick={onRetry}>Try Again</Button>
		</div>
	{/if}
</div>

<style>
	.admin-error {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.admin-error-content {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.admin-error-action {
		display: flex;
		justify-content: center;
	}
</style>
