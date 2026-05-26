<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import {
		Mail,
		User,
		Building,
		Briefcase,
		MessageSquare,
		Loader2,
		CheckCircle,
		AlertCircle,
		Send
	} from '@lucide/svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import { submitContact } from '$lib/api/client';

	const kushagraImg = '/assets/kushagra.webp';
	const ishitaImg = '/assets/ishita.webp';

	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		company: '',
		service: 'DevBeast',
		message: ''
	});

	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let errors = $state<Record<string, string>>({});

	// Prefill service from search parameter if present
	$effect(() => {
		const serviceParam = $page.url.searchParams.get('service');
		if (serviceParam) {
			formData.service = serviceParam;
		}
	});

	function handleChange(
		e: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }
	) {
		const target = e.currentTarget;
		formData = { ...formData, [target.name]: target.value };
		if (errors[target.name]) {
			errors = { ...errors, [target.name]: '' };
		}
	}

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.firstName.trim()) newErrors.firstName = 'Required';
		if (!formData.lastName.trim()) newErrors.lastName = 'Required';
		if (!formData.email.trim()) {
			newErrors.email = 'Required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Invalid email';
		}
		if (!formData.message.trim()) newErrors.message = 'Required';

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	};

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		status = 'loading';

		try {
			const response = await submitContact(formData);

			if (response.ok) {
				status = 'success';
				formData = {
					firstName: '',
					lastName: '',
					email: '',
					company: '',
					service: 'DevBeast',
					message: ''
				};
				setTimeout(() => (status = 'idle'), 5000);
			} else {
				status = 'error';
			}
		} catch (err) {
			console.error('Contact submission error:', err);
			status = 'error';
		}
	}
</script>

<svelte:head>
	<title>Contact Us | Tarkify</title>
	<meta
		name="description"
		content="Let's build the future together. Reach out and our team of AI experts will help you find the perfect solution."
	/>
</svelte:head>

<div class="contact-page pt-32 pb-20">
	<div class="container">
		<div class="contact-grid">
			<div transition:fly={{ x: -40, duration: 600 }}>
				<span class="section-badge">Get in Touch</span>
				<h1 class="mb-8 leading-none">
					Let's build the <br /><span class="text-accent-green">future</span> together.
				</h1>
				<p class="text-lg opacity-80 mb-12 max-w-md">
					Ready to automate your workflow? Reach out and our team of AI experts will help you find
					the perfect solution for your business scaling.
				</p>

				<div class="contact-info space-y-10">
					<div class="input-with-icon group p-0 pb-4">
						<div
							class="info-icon glass transition-transform group-hover:scale-110 relative left-0 p-5 mr-6"
						>
							<Mail class="text-accent-green" size={28} />
						</div>
						<div>
							<p class="text-xs uppercase tracking-wider opacity-50 mb-1">Email us at</p>
							<p class="font-bold text-xl">tarkify.ai@gmail.com</p>
						</div>
					</div>
				</div>
			</div>

			<div
				transition:fly={{ x: 40, duration: 600, delay: 200 }}
				class="contact-form-card rounded-[3rem] p-12"
			>
				<form onsubmit={handleSubmit} novalidate>
					<div class="form-row">
						<div class="form-group">
							<label for="firstName" class="form-label">First Name</label>
							<div class="input-with-icon">
								<User class="input-icon" size={20} />
								<input
									type="text"
									id="firstName"
									name="firstName"
									placeholder="John"
									value={formData.firstName}
									oninput={handleChange}
									class={errors.firstName ? 'input-error' : ''}
								/>
							</div>
							{#if errors.firstName}
								<span class="error-text">{errors.firstName}</span>
							{/if}
						</div>
						<div class="form-group">
							<label for="lastName" class="form-label">Last Name</label>
							<div class="input-with-icon">
								<User class="input-icon" size={20} />
								<input
									type="text"
									id="lastName"
									name="lastName"
									placeholder="Doe"
									value={formData.lastName}
									oninput={handleChange}
									class={errors.lastName ? 'input-error' : ''}
								/>
							</div>
							{#if errors.lastName}
								<span class="error-text">{errors.lastName}</span>
							{/if}
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="email" class="form-label">Work Email Address</label>
							<div class="input-with-icon">
								<Mail class="input-icon" size={20} />
								<input
									type="email"
									id="email"
									name="email"
									placeholder="john@company.com"
									value={formData.email}
									oninput={handleChange}
									class={errors.email ? 'input-error' : ''}
								/>
							</div>
							{#if errors.email}
								<span class="error-text">{errors.email}</span>
							{/if}
						</div>
						<div class="form-group">
							<label for="company" class="form-label">Company Name (Optional)</label>
							<div class="input-with-icon">
								<Building class="input-icon" size={20} />
								<input
									type="text"
									id="company"
									name="company"
									placeholder="Acme Corp"
									value={formData.company}
									oninput={handleChange}
								/>
							</div>
						</div>
					</div>

					<div class="form-group">
						<label for="service" class="form-label">Interested Service</label>
						<div class="input-with-icon">
							<Briefcase class="input-icon" size={20} />
							<select id="service" name="service" value={formData.service} onchange={handleChange}>
								<option value="DevBeast">DevBeast Control Plane</option>
								<option value="Legal Redline">Legal Redline AI (Coming Soon)</option>
								<option value="EM SME">EM SME AI Advisor (Coming Soon)</option>
								<option value="Custom Solutions">Custom Solutions</option>
							</select>
						</div>
					</div>

					<div class="form-group">
						<label for="message" class="form-label">How can we help?</label>
						<div class="input-with-icon">
							<MessageSquare class="input-icon top-align" size={20} />
							<textarea
								id="message"
								name="message"
								class={errors.message ? 'input-error' : ''}
								placeholder="Tell us about your automation needs..."
								style="min-height: 140px;"
								value={formData.message}
								oninput={handleChange}></textarea>
						</div>
						{#if errors.message}
							<span class="error-text">{errors.message}</span>
						{/if}
					</div>

					<button
						type="submit"
						class="btn btn-submit w-full p-5 flex items-center justify-center gap-4 text-lg"
						disabled={status === 'loading'}
					>
						{#if status === 'loading'}
							<span>Sending...</span>
							<Loader2 class="spinner animate-spin" size={22} />
						{:else}
							<span>Send Message</span>
							<Send size={22} />
						{/if}
					</button>

					{#if status === 'success'}
						<div
							transition:fly={{ y: 10, duration: 200 }}
							class="form-message success flex items-center justify-center gap-2 mt-4"
						>
							<CheckCircle size={18} />
							Message sent successfully! We'll be in touch soon.
						</div>
					{/if}
					{#if status === 'error'}
						<div
							transition:fly={{ y: 10, duration: 200 }}
							class="form-message error flex items-center justify-center gap-2 mt-4"
						>
							<AlertCircle size={18} />
							Something went wrong. Please try again.
						</div>
					{/if}

					<p class="text-center text-sm opacity-50 italic mt-6">
						We typically respond within 24 hours.
					</p>
				</form>
			</div>
		</div>

		<!-- Tarkify Team Section -->
		<div class="team-section mt-32 mb-20">
			<div transition:fly={{ y: 20, duration: 400 }} class="section-header text-center mb-16">
				<span class="section-badge">Our Founders</span>
				<h2>Meet the Tarkify Team</h2>
				<p class="section-subtext">The minds behind the next-gen AI automation solutions.</p>
			</div>

			<div class="team-grid">
				<div transition:fly={{ y: 20, duration: 400, delay: 100 }} class="team-card glass">
					<div class="team-avatar-wrapper">
						<img src={kushagraImg} alt="Kushagra" class="team-avatar-image" />
					</div>
					<h3>Kushagra</h3>
					<p class="team-role">Founder</p>
					<p class="team-bio">
						Developer and AI researcher focused on autonomous workflow scaling, agent-based
						reasoning, and developer platform engineering.
					</p>
					<div class="team-socials">
						<a
							href="https://linkedin.com/in/spybeast07"
							target="_blank"
							rel="noopener noreferrer"
							title="LinkedIn"
							data-tooltip="linkedin.com/in/spybeast07"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
								></path>
								<rect x="2" y="9" width="4" height="12"></rect>
								<circle cx="4" cy="4" r="2"></circle>
							</svg>
						</a>
						<a
							href="https://github.com/SpyBeast07"
							target="_blank"
							rel="noopener noreferrer"
							title="GitHub"
							data-tooltip="github.com/SpyBeast07"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
								></path>
								<path d="M9 18c-4.51 2-5-2-7-2"></path>
							</svg>
						</a>
					</div>
				</div>

				<div transition:fly={{ y: 20, duration: 400, delay: 150 }} class="team-card glass">
					<div class="team-avatar-wrapper">
						<img src={ishitaImg} alt="Ishita" class="team-avatar-image" />
					</div>
					<h3>Ishita</h3>
					<p class="team-role">Founder</p>
					<p class="team-bio">
						AI Engineer with a passion for building automated daily life tools. Passionate about
						reading, writing, and astronomy. Eager to connect with professionals in the field.
					</p>
					<div class="team-socials">
						<a
							href="https://linkedin.com/in/ishita-agarwal-3992b6249"
							target="_blank"
							rel="noopener noreferrer"
							title="LinkedIn"
							data-tooltip="linkedin.com/in/ishita-agarwal-3992b6249"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
								></path>
								<rect x="2" y="9" width="4" height="12"></rect>
								<circle cx="4" cy="4" r="2"></circle>
							</svg>
						</a>
						<a
							href="https://github.com/IshitaAgarwal05"
							target="_blank"
							rel="noopener noreferrer"
							title="GitHub"
							data-tooltip="github.com/IshitaAgarwal05"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
								></path>
								<path d="M9 18c-4.51 2-5-2-7-2"></path>
							</svg>
						</a>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-20">
			<Newsletter />
		</div>
	</div>
</div>
