<script lang="ts">
	import { Play, Sparkles, AlertCircle, Info, Star } from '@lucide/svelte';
	
	// Import components
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import FeedbackForm from '$lib/components/FeedbackForm.svelte';

	// Component states
	let isModalOpen = $state(false);
	let isDialogOpen = $state(false);
	let testInputValue = $state('');
	let testTextareaValue = $state('');
	let testSelectValue = $state('Option A');

	// Card info
	const cardFeatures = [
		'Real-time simulation engine',
		'Auto-scaling resources',
		'Multi-agent collaboration'
	];

	function handleConfirm() {
		alert('Dialog Confirmed!');
	}

	function handleCancel() {
		alert('Dialog Cancelled.');
	}
</script>

<div class="test-page-wrapper">
	<div class="container pt-24 pb-24">
		<div class="section-header text-center mb-16">
			<Badge variant="section">Testing Sandbox</Badge>
			<h1>Tarkify Shared <span class="text-accent-green">UI Components</span></h1>
			<p class="section-subtext">A workspace to verify styling, interactions, and Svelte 5 logic for migrated UI elements.</p>
		</div>

		<!-- 1. Buttons section -->
		<section class="test-section mb-12">
			<h2 class="test-sec-title">1. Button Variants & Sizes</h2>
			<div class="test-flex flex-wrap gap-4 items-center">
				<Button variant="primary">Primary Button</Button>
				<Button variant="secondary">Secondary Button</Button>
				<Button variant="outline">Outline Button</Button>
				<Button variant="ghost">Ghost Button</Button>
				<Button variant="danger">Danger Button</Button>
			</div>
			<div class="test-flex flex-wrap gap-4 items-center mt-6">
				<Button size="sm">Small Primary</Button>
				<Button size="md">Medium Primary</Button>
				<Button size="lg">Large Primary</Button>
				<Button variant="outline" size="sm">Small Outline</Button>
			</div>
			<div class="test-flex flex-wrap gap-4 items-center mt-6">
				<Button disabled>Disabled Button</Button>
				<Button href="/solutions">As Link element</Button>
				<Button variant="secondary">
					{#snippet children()}
						<Sparkles size={16} class="mr-2" />
						<span>With Icon Snippet</span>
					{/snippet}
				</Button>
			</div>
		</section>

		<!-- 2. Badges section -->
		<section class="test-section mb-12">
			<h2 class="test-sec-title">2. Badges / Pills</h2>
			<div class="test-flex flex-wrap gap-3">
				<Badge variant="primary">Primary</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="accent">Accent</Badge>
				<Badge variant="coming-soon">Soon</Badge>
				<Badge variant="success">Success</Badge>
				<Badge variant="warning">Warning</Badge>
				<Badge variant="error">Error</Badge>
			</div>
		</section>

		<!-- 3. Form Input elements -->
		<section class="test-section mb-12">
			<h2 class="test-sec-title">3. Inputs & Forms</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
				<div class="contact-form-card" style="padding: 2rem; border-radius: 2rem;">
					<Input 
						label="Standard Text Input" 
						placeholder="Type something..." 
						bind:value={testInputValue} 
						icon={Info} 
						class="mb-6"
					/>
					
					<Input 
						label="Email Input with Error" 
						type="email"
						placeholder="bademail.com" 
						value="invalid-email" 
						error="Please enter a valid email address."
						icon={AlertCircle}
						class="mb-6"
					/>

					<Input 
						label="Dropdown Selector" 
						type="select" 
						options={['Option A', 'Option B', 'Option C']}
						bind:value={testSelectValue}
						icon={Play}
						class="mb-6"
					/>

					<Input 
						label="Textarea Description" 
						type="textarea" 
						placeholder="Describe something..." 
						bind:value={testTextareaValue}
						rows={3}
					/>
				</div>

				<div class="flex flex-col justify-center">
					<h4 class="font-semibold text-lg mb-2">Live Bindings</h4>
					<p class="opacity-80 mb-2"><strong>Text input value:</strong> {testInputValue || '(empty)'}</p>
					<p class="opacity-80 mb-2"><strong>Select dropdown value:</strong> {testSelectValue}</p>
					<p class="opacity-80"><strong>Textarea value:</strong> {testTextareaValue || '(empty)'}</p>
				</div>
			</div>
		</section>

		<!-- 4. Loading States -->
		<section class="test-section mb-12">
			<h2 class="test-sec-title">4. Loading states</h2>
			<div class="test-flex gap-6 items-center">
				<Loading size={20} />
				<Loading size={32} class="text-accent-green" />
				<Loading size={48} class="text-primary-green" />
				<Button disabled>
					{#snippet children()}
						<Loading size={16} class="mr-2" />
						<span>Processing...</span>
					{/snippet}
				</Button>
			</div>
		</section>

		<!-- 5. Overlays (Modal, Dialog, Dropdown) -->
		<section class="test-section mb-12">
			<h2 class="test-sec-title">5. Modals, Dialogs & Dropdowns</h2>
			<div class="test-flex flex-wrap gap-4">
				<Button onclick={() => isModalOpen = true}>Open Slide-up Modal</Button>
				<Button variant="outline" onclick={() => isDialogOpen = true}>Open Confirmation Dialog</Button>
				
				<Dropdown label="Settings Dropdown" items={[
					{ label: 'View Profile', onclick: () => alert('Profile clicked') },
					{ label: 'System Settings', onclick: () => alert('Settings clicked') },
					{ label: 'Log Out', onclick: () => alert('Logout clicked') }
				]} />
			</div>

			<!-- Modal Instance -->
			<Modal show={isModalOpen} title="Tarkify Custom Modal">
				<p class="opacity-85 mb-4">
					This is a modular glassmorphic modal component. It supports responsive animations, custom bodies, headers, and bottom sheet footers.
				</p>
				<p class="opacity-85">
					You can place any custom elements or forms inside it.
				</p>
				{#snippet footer()}
					<Button variant="ghost" onclick={() => isModalOpen = false}>Close</Button>
					<Button variant="primary" onclick={() => isModalOpen = false}>Accept</Button>
				{/snippet}
			</Modal>

			<!-- Dialog Instance -->
			<Dialog 
				bind:open={isDialogOpen} 
				title="Confirm Deletion" 
				message="Are you absolutely sure you want to delete this agent simulator? This action is permanent and cannot be undone."
				confirmText="Delete Agent"
				variant="danger"
				onconfirm={handleConfirm}
				oncancel={handleCancel}
			/>
		</section>

		<!-- 6. Card Showcase -->
		<section class="test-section mb-16">
			<h2 class="test-sec-title">6. Product Cards (from React)</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
				<Card 
					title="DevBeast Agent Simulator" 
					description="Evaluate developer automation workflows with real-time docker container sandboxing and performance profiling."
					features={cardFeatures}
					icon={Sparkles}
					buttonText="Launch Sandbox"
					onButtonClick={() => alert('Launching sandbox simulator!')}
				/>

				<Card 
					title="Legal Redline Auto-Review" 
					description="AI-driven legal contract redlining and validation pipeline. Analyze contract differences instantly."
					features={['Contextual legal logic', 'Automatic change draft tracking', 'Export redlines to PDF']}
					comingSoon={true}
				/>
			</div>
		</section>

		<!-- 7. Shared Section Components -->
		<section class="test-section mb-12">
			<h2 class="test-sec-title">7. Layout-Level Components (Newsletter & Feedback)</h2>
			<div class="mb-12 border border-dashed border-gray-400 rounded-3xl p-4">
				<h3 class="text-center text-sm font-semibold opacity-50 mb-4">Newsletter Section</h3>
				<Newsletter />
			</div>
			
			<div class="border border-dashed border-gray-400 rounded-3xl p-4">
				<h3 class="text-center text-sm font-semibold opacity-50 mb-4">Feedback Form Section</h3>
				<FeedbackForm />
			</div>
		</section>
	</div>
</div>

<style>
	.test-page-wrapper {
		background-color: var(--color-light-bg);
		min-height: 100vh;
		color: var(--color-text);
	}
	
	.test-section {
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: var(--glass-blur);
		border: 1px solid var(--color-glass-border);
		padding: 2.5rem;
		border-radius: 2rem;
	}

	.test-sec-title {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 0;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-glass-border);
		padding-bottom: 0.75rem;
	}

	.test-flex {
		display: flex;
	}

	:global([data-theme='dark']) .test-page-wrapper {
		background-color: var(--color-dark-green);
	}

	:global([data-theme='dark']) .test-section {
		background: rgba(0, 0, 0, 0.2);
	}
</style>
