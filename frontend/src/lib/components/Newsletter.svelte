<script lang="ts">
	import { Mail, Send } from '@lucide/svelte';

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success'>('idle');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = 'loading';
		setTimeout(() => {
			status = 'success';
			email = '';
			setTimeout(() => {
				status = 'idle';
			}, 3000);
		}, 1500);
	}
</script>

<section class="section newsletter" id="newsletter">
	<div class="container">
		<div class="newsletter-card glass">
			<div class="newsletter-content">
				<div class="mail-icon">
					<Mail size={32} />
				</div>
				<h2>Stay Ahead of Automation</h2>
				<p>Get weekly insights on how to leverage AI for your business scaling.</p>
			</div>

			<form class="newsletter-form" onsubmit={handleSubmit}>
				<div class="input-wrapper">
					<input
						type="email"
						placeholder="Enter your work email"
						required
						bind:value={email}
						disabled={status === 'loading' || status === 'success'}
					/>
					<button
						type="submit"
						class="btn btn-submit newsletter-btn"
						disabled={status === 'loading'}
					>
						<span>{status === 'success' ? 'Joined!' : status === 'loading' ? 'Joining...' : 'Subscribe'}</span>
						<Send size={15} />
					</button>
				</div>
				<p class="privacy-note">Zero spam. Just pure automation value.</p>
			</form>
		</div>
	</div>
</section>
