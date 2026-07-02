<script lang="ts">
	import { slide, fly } from 'svelte/transition';
	import {
		Briefcase,
		MapPin,
		Clock,
		Send,
		Loader2,
		AlertCircle,
		CheckCircle,
		Link as LinkIcon,
		User,
		Mail,
		Phone,
		ChevronDown
	} from '@lucide/svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import { submitCareers, ApiResponseError, TimeoutError, NetworkError } from '$lib/api/client';
	import Seo from '$lib/components/Seo.svelte';
	import { tick, getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	const toastState = getContext<{ addToast: (msg: string, type: string) => void }>('toast');

	const OPEN_ROLES = ['Full Stack Developer'];

	let jobOpen = $state(false);

	let formData = $state({
		name: '',
		email: '',
		phone: '',
		role: '',
		cvLink: '',
		linkedin: '',
		portfolio: '',
		message: ''
	});
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let formErrors = $state<string[]>([]);
	let errorMessage = $state('');
	let errorBanner: HTMLDivElement | undefined = $state(undefined);

	function handleChange(
		e: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }
	) {
		const target = e.currentTarget;
		formData = { ...formData, [target.name]: target.value };
		if (formErrors.length > 0) formErrors = [];
	}

	const validate = (): string[] => {
		const errors: string[] = [];
		if (!formData.role) errors.push('Please select a role.');
		if (!formData.name.trim()) errors.push('Full Name is required.');
		if (!formData.email.trim()) errors.push('Email Address is required.');
		else if (!/\S+@\S+\.\S+/.test(formData.email))
			errors.push('Please enter a valid email address.');
		if (!formData.phone.trim()) errors.push('Phone Number is required.');
		if (!formData.cvLink.trim()) errors.push('Resume / CV link is required.');
		return errors;
	};

	function resetForm() {
		formData = {
			name: '',
			email: '',
			phone: '',
			role: '',
			cvLink: '',
			linkedin: '',
			portfolio: '',
			message: ''
		};
		formErrors = [];
		errorMessage = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'submitting') return;
		const errors = validate();
		if (errors.length > 0) {
			formErrors = errors;
			return;
		}
		status = 'submitting';
		formErrors = [];
		errorMessage = '';

		try {
			await submitCareers({
				name: formData.name.trim(),
				email: formData.email.trim(),
				phone: formData.phone.trim(),
				resume_url: formData.cvLink.trim(),
				portfolio_url: formData.portfolio.trim() || undefined,
				cover_letter: formData.message.trim() || undefined
			});

			status = 'success';
			toastState?.addToast(
				'Application submitted successfully! We will be in touch soon.',
				'success'
			);
			resetForm();
		} catch (err) {
			status = 'error';
			if (err instanceof ApiResponseError) {
				errorMessage = err.message;
			} else if (err instanceof TimeoutError || err instanceof NetworkError) {
				errorMessage = err.message;
			} else {
				errorMessage = 'Something went wrong. Please try again later.';
			}
			await tick();
			errorBanner?.focus();
			toastState?.addToast(errorMessage, 'error');
		}
	}
</script>

<Seo
	title="Careers | Tarkify"
	description="Build the future of AI automation with Tarkify. We are hiring passionate engineers and innovators."
	ogImage="/og-image.svg"
/>

<div class="careers-page pt-32 pb-20">
	<div class="container">
		<div transition:fly={{ y: 20, duration: 400 }} class="careers-hero mb-16">
			<span class="section-badge">Join the Team</span>
			<h1>Build the future of <span class="text-accent-green">automation</span>.</h1>
			<p>
				We are on a mission to simplify life by automating complex workflows. If you're passionate
				about AI, developer tools, and scalable architecture, you belong here.
			</p>
		</div>

		<div class="careers-layout">
			<div transition:fly={{ x: -20, duration: 400, delay: 100 }}>
				<h2 class="text-2xl font-bold mb-6 font-heading">Open Positions</h2>

				<div class="job-card-collapse glass">
					<button
						class="job-card-header w-full text-left"
						onclick={() => (jobOpen = !jobOpen)}
						aria-expanded={jobOpen}
					>
						<div class="job-card-header-left">
							<span class="job-card-title">Full Stack Developer</span>
							<div class="job-meta mt-3">
								<span class="job-meta-tag"><Clock size={13} /> 0–1 Years</span>
								<span class="job-meta-tag"><MapPin size={13} /> Remote / Jaipur</span>
								<span class="job-meta-tag"><Briefcase size={13} /> Full-Time</span>
							</div>
						</div>
						<div class="job-card-chevron" class:open={jobOpen}>
							<ChevronDown size={20} />
						</div>
					</button>

					{#if jobOpen}
						<div transition:slide={{ duration: 400 }} class="overflow-hidden">
							<div class="job-card-body">
								<div class="job-body">
									<div class="job-section pt-5">
										<h3>Role Overview</h3>
										<p>
											As a Full Stack Developer at Tarkify, you will build the interfaces and
											backend systems that power our next-generation AI agents and developer tools
											like DevBeast and BizOps.
										</p>
									</div>
									<div class="job-section">
										<h3>Responsibilities</h3>
										<ul>
											<li>
												Develop modern, responsive web apps using React, Vite, and TypeScript.
											</li>
											<li>Build scalable backend APIs using Node.js and Express/FastAPI.</li>
											<li>Integrate complex AI models and LLM APIs into user-facing features.</li>
											<li>Design and implement database schemas (PostgreSQL/Supabase).</li>
											<li>Write clean, maintainable, and well-documented code.</li>
										</ul>
									</div>
									<div class="job-section">
										<h3>Requirements</h3>
										<ul>
											<li>0–1 years of experience (strong portfolio required).</li>
											<li>Proficiency in React.js, TypeScript, and CSS.</li>
											<li>Experience with Node.js and RESTful API design.</li>
											<li>Familiarity with Git and basic CI/CD workflows.</li>
										</ul>
									</div>
									<div class="job-section">
										<h3>Nice-to-haves</h3>
										<ul>
											<li>Experience with Framer Motion or animation libraries.</li>
											<li>Familiarity with Python (FastAPI/Flask).</li>
											<li>Experience with OpenAI, Anthropic, or open-source LLMs.</li>
											<li>Understanding of containerization (Docker).</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div transition:fly={{ x: 20, duration: 400, delay: 150 }} class="careers-form-sticky">
				<div class="careers-form-card">
					{#if status === 'success'}
						<div
							class="success-state text-center py-8"
							transition:fade={{ duration: 300 }}
							role="status"
							aria-live="polite"
						>
							<CheckCircle size={48} class="text-accent-green mx-auto mb-4" />
							<h3 class="text-xl font-bold mb-2">Application Submitted!</h3>
							<p class="opacity-70">
								Your application has been received. We will be in touch soon.
							</p>
							<button
								class="btn btn-submit w-full mt-6 p-3"
								onclick={() => {
									status = 'idle';
									resetForm();
								}}
							>
								Submit Another Application
							</button>
						</div>
					{:else}
						<h3>Apply for a Role</h3>
						<form onsubmit={handleSubmit} novalidate class="careers-form">
							<div class="form-group">
								<label for="car-role" class="form-label">Select Role *</label>
								<div class="careers-select-wrap">
									<select
										id="car-role"
										name="role"
										value={formData.role}
										onchange={handleChange}
										class="careers-select"
										disabled={status === 'submitting'}
									>
										<option value="" disabled>Choose a position...</option>
										{#each OPEN_ROLES as r (r)}
											<option value={r}>{r}</option>
										{/each}
									</select>
									<ChevronDown class="select-chevron" size={16} />
								</div>
							</div>

							<div class="careers-form-row">
								<div class="form-group">
									<label for="car-name" class="form-label">Full Name *</label>
									<div class="careers-input-wrap">
										<User class="careers-input-icon" size={15} />
										<input
											type="text"
											id="car-name"
											name="name"
											placeholder="John Doe"
											value={formData.name}
											oninput={handleChange}
											class="careers-input"
											maxlength={100}
											autocomplete="name"
											disabled={status === 'submitting'}
										/>
									</div>
								</div>
								<div class="form-group">
									<label for="car-email" class="form-label">Email Address *</label>
									<div class="careers-input-wrap">
										<Mail class="careers-input-icon" size={15} />
										<input
											type="email"
											id="car-email"
											name="email"
											placeholder="you@example.com"
											value={formData.email}
											oninput={handleChange}
											class="careers-input"
											maxlength={100}
											autocomplete="email"
											disabled={status === 'submitting'}
										/>
									</div>
								</div>
							</div>

							<div class="careers-form-row">
								<div class="form-group">
									<label for="car-phone" class="form-label">Phone Number *</label>
									<div class="careers-input-wrap">
										<Phone class="careers-input-icon" size={15} />
										<input
											type="tel"
											id="car-phone"
											name="phone"
											placeholder="+91 98765 43210"
											value={formData.phone}
											oninput={handleChange}
											class="careers-input"
											maxlength={20}
											autocomplete="tel"
											disabled={status === 'submitting'}
										/>
									</div>
								</div>
								<div class="form-group">
									<label for="car-cv" class="form-label">Resume / CV Link *</label>
									<div class="careers-input-wrap">
										<LinkIcon class="careers-input-icon" size={15} />
										<input
											type="url"
											id="car-cv"
											name="cvLink"
											placeholder="drive.google.com/..."
											value={formData.cvLink}
											oninput={handleChange}
											class="careers-input"
											maxlength={500}
											autocomplete="url"
											disabled={status === 'submitting'}
										/>
									</div>
								</div>
							</div>

							<div class="careers-form-row">
								<div class="form-group">
									<label for="car-linkedin" class="form-label">LinkedIn (Optional)</label>
									<div class="careers-input-wrap">
										<LinkIcon class="careers-input-icon" size={15} />
										<input
											type="url"
											id="car-linkedin"
											name="linkedin"
											placeholder="linkedin.com/in/..."
											value={formData.linkedin}
											oninput={handleChange}
											class="careers-input"
											maxlength={500}
											autocomplete="url"
											disabled={status === 'submitting'}
										/>
									</div>
								</div>
								<div class="form-group">
									<label for="car-portfolio" class="form-label">Portfolio / GitHub (Optional)</label
									>
									<div class="careers-input-wrap">
										<LinkIcon class="careers-input-icon" size={15} />
										<input
											type="url"
											id="car-portfolio"
											name="portfolio"
											placeholder="github.com/..."
											value={formData.portfolio}
											oninput={handleChange}
											class="careers-input"
											maxlength={500}
											autocomplete="url"
											disabled={status === 'submitting'}
										/>
									</div>
								</div>
							</div>

							<div class="form-group">
								<label for="car-message" class="form-label">Cover Letter (Optional)</label>
								<textarea
									id="car-message"
									name="message"
									placeholder="Why are you a great fit for Tarkify?"
									class="careers-textarea"
									value={formData.message}
									oninput={handleChange}
									maxlength={2000}
									disabled={status === 'submitting'}></textarea>
								<div class="char-count">{formData.message.length}/2000</div>
							</div>

							<button
								type="submit"
								class="btn btn-submit w-full flex items-center justify-center gap-2 p-3"
								disabled={status === 'submitting'}
							>
								{#if status === 'submitting'}
									<span>Submitting...</span>
									<Loader2 class="spinner animate-spin" size={17} />
								{:else}
									<span>Submit Application</span>
									<Send size={17} />
								{/if}
							</button>

							{#if formErrors.length > 0}
								<div
									transition:fly={{ y: 6, duration: 200 }}
									class="careers-errors"
									role="alert"
									aria-live="polite"
								>
									{#each formErrors as err, i (`err-${i}`)}
										<p class="careers-error-item flex items-center gap-1">
											<AlertCircle size={13} />
											{err}
										</p>
									{/each}
								</div>
							{/if}
							{#if status === 'error' && errorMessage}
								<div
									bind:this={errorBanner}
									tabindex="-1"
									transition:fly={{ y: 8, duration: 200 }}
									class="form-message error flex items-center justify-center gap-2"
									role="alert"
									aria-live="polite"
								>
									<AlertCircle size={15} />
									{errorMessage}
								</div>
							{/if}
						</form>
					{/if}
				</div>
			</div>
		</div>

		<Newsletter />
	</div>
</div>

<style>
	.char-count {
		text-align: right;
		font-size: 0.75rem;
		opacity: 0.5;
		margin-top: 0.25rem;
	}
</style>
