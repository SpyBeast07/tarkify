<script lang="ts">
	import { Clock, Users, Zap, TrendingUp } from '@lucide/svelte';
	import { calculateROI } from '$lib/utils/roi';

	let hours = $state(20);
	let teamSize = $state(5);

	let roi = $derived(calculateROI(hours, teamSize));
</script>

<section class="section roi-calculator" id="roi">
	<div class="container">
		<div class="section-header text-center">
			<span class="section-badge">Calculator</span>
			<h2>Calculate Your Savings</h2>
			<p class="section-subtext">See how much time and money Tarkify can reclaim for your team.</p>
		</div>

		<div class="calculator-grid glass">
			<div class="calculator-inputs">
				<div class="input-group">
					<div class="label-row">
						<label><Clock size={16} /> Manual Work Hours / Week</label>
						<span class="value">{hours}h</span>
					</div>
					<input type="range" min="5" max="100" bind:value={hours} class="slider" />
				</div>

				<div class="input-group">
					<div class="label-row">
						<label><Users size={16} /> Team Size</label>
						<span class="value">{teamSize}</span>
					</div>
					<input type="range" min="1" max="50" bind:value={teamSize} class="slider" />
				</div>
			</div>

			<div class="calculator-results">
				<div class="result-card secondary">
					<Zap class="result-icon" />
					<div class="result-info">
						<h3>{roi.hoursSaved}h</h3>
						<p>Hours Saved / Month</p>
					</div>
				</div>

				<div class="result-card primary">
					<TrendingUp class="result-icon" />
					<div class="result-info">
						<h3>${roi.moneySaved.toLocaleString()}</h3>
						<p>Potential Monthly Savings</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
