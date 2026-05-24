<script lang="ts">
	import { Terminal, Bot, ChevronRight, Check } from '@lucide/svelte';

	const scenarios = [
		{
			task: 'Sorting high-priority emails...',
			steps: ['Analyzing context...', 'Applying labels...', 'Filtering spam...', 'Task Complete.']
		},
		{
			task: 'Automating CRM updates...',
			steps: [
				'Fetching new leads...',
				'Syncing with HubSpot...',
				'Updating contact records...',
				'Task Complete.'
			]
		},
		{
			task: 'Generating weekly report...',
			steps: [
				'Aggregating data...',
				'Formatting metrics...',
				'Exporting as PDF...',
				'Task Complete.'
			]
		}
	];

	let logs = $state<string[]>(['Initializing Tarkify Agent v2.4...']);
	let status = $state('Idle');

	$effect(() => {
		let currentScenario = 0;
		let currentStep = 0;

		const interval = setInterval(() => {
			const scenario = scenarios[currentScenario];
			if (!scenario) return;

			if (currentStep === 0) {
				logs = [`> Executing: ${scenario.task}`];
				status = 'Processing';
			} else if (currentStep <= scenario.steps.length) {
				logs = [...logs, `[OK] ${scenario.steps[currentStep - 1]}`];
			} else {
				status = 'Idle';
				currentScenario = (currentScenario + 1) % scenarios.length;
				currentStep = -1;
			}
			currentStep++;
		}, 1500);

		return () => clearInterval(interval);
	});
</script>

<div class="agent-simulator glass">
	<div class="simulator-header">
		<div class="window-controls">
			<span class="dot red"></span>
			<span class="dot yellow"></span>
			<span class="dot green"></span>
		</div>
		<div class="simulator-title">
			<Terminal size={14} /> agent_executor.sh
		</div>
		<div class="simulator-status {status.toLowerCase()}">
			{status}
		</div>
	</div>

	<div class="simulator-body">
		<div class="log-container">
			{#each logs as log, i (`${log}-${i}`)}
				<div class="log-line {log.startsWith('>') ? 'command' : 'success'}">
					{#if log.startsWith('>')}
						<ChevronRight size={14} />
					{:else}
						<Check size={14} />
					{/if}
					{log}
				</div>
			{/each}
		</div>
	</div>

	<div class="simulator-footer">
		<Bot class="bot-icon animate-pulse" />
		<div class="footer-info">
			<span>Target: Production v2.0</span>
			<span>Load: 12%</span>
		</div>
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	:global(.animate-pulse) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
