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
		AlertCircle,
		Send,
		CheckCircle
	} from '@lucide/svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import { submitContact, ApiResponseError, TimeoutError, NetworkError } from '$lib/api/client';
	import Seo from '$lib/components/Seo.svelte';
	import { tick, getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	const toastState = getContext<{ addToast: (msg: string, type: string) => void }>('toast');

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

	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errors = $state<Record<string, string>>({});
	let errorMessage = $state('');
	let errorBanner: HTMLDivElement | undefined = $state(undefined);

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

	function resetForm() {
		formData = {
			firstName: '',
			lastName: '',
			email: '',
			company: '',
			service: 'DevBeast',
			message: ''
		};
		errors = {};
		errorMessage = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'submitting') return;
		if (!validate()) return;

		status = 'submitting';
		errorMessage = '';

		try {
			const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
			const serviceLabels: Record<string, string> = {
				DevBeast: 'DevBeast Control Plane',
				'Legal Redline': 'Legal Redline AI',
				'BizOps': 'BizOps',
				'Custom Solutions': 'Custom Solutions'
			};

			await submitContact({
				name,
				email: formData.email.trim(),
				company: formData.company.trim() || undefined,
				subject: serviceLabels[formData.service] || formData.service,
				message: formData.message.trim()
			});

			status = 'success';
			toastState?.addToast(
				'Message sent successfully! We will respond within 24 hours.',
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
	title="Contact Us | Tarkify"
	description="Let's build the future together. Reach out and our team of AI experts will help you find the perfect solution."
	ogImage="/og-image.svg"
/>

<div class="contact-page pt-32 pb-20">
	<div class="container">
		<div class="contact-grid">
			<div class="contact-left" transition:fly={{ x: -40, duration: 600 }}>
				<span class="section-badge">Get in Touch</span>
				<h1 class="contact-heading">
					Let's build the <br /><span class="accent-green">future</span> together.
				</h1>
				<p class="contact-subtext">
					Ready to automate your workflow? Reach out and our team of AI experts will help you find
					the perfect solution for your business scaling.
				</p>

				<div class="contact-info">
					<div class="contact-info-item">
						<div class="info-icon glass">
							<Mail size={28} />
						</div>
						<div>
							<p class="info-label">Email us at</p>
							<p class="info-value">tarkify.ai@gmail.com</p>
						</div>
					</div>
				</div>
			</div>

			<div
				transition:fly={{ x: 40, duration: 600, delay: 200 }}
				class="contact-form-card"
				style="padding: 3rem; border-radius: 3rem;"
			>
				{#if status === 'success'}
					<div
						class="success-state text-center py-8"
						transition:fade={{ duration: 300 }}
						role="status"
						aria-live="polite"
					>
						<CheckCircle size={48} class="text-accent-green mx-auto mb-4" />
						<h3 class="text-xl font-bold mb-2">Message Sent!</h3>
						<p class="opacity-70">
							Thank you for reaching out. We will get back to you within 24 hours.
						</p>
						<button
							class="btn btn-submit submit-full mt-6"
							onclick={() => {
								status = 'idle';
								resetForm();
							}}
						>
							Send Another Message
						</button>
					</div>
				{:else}
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
										maxlength={50}
										autocomplete="given-name"
										disabled={status === 'submitting'}
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
										maxlength={50}
										autocomplete="family-name"
										disabled={status === 'submitting'}
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
										maxlength={100}
										autocomplete="email"
										disabled={status === 'submitting'}
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
										maxlength={100}
										autocomplete="organization"
										disabled={status === 'submitting'}
									/>
								</div>
							</div>
						</div>

						<div class="form-group">
							<label for="service" class="form-label">Interested Service</label>
							<div class="input-with-icon">
								<Briefcase class="input-icon" size={20} />
								<select
									id="service"
									name="service"
									value={formData.service}
									onchange={handleChange}
									disabled={status === 'submitting'}
								>
									<option value="DevBeast">DevBeast Control Plane</option>
									<option value="Legal Redline">Legal Redline AI (Coming Soon)</option>
									<option value="BizOps"
										>BizOps</option
									>
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
									oninput={handleChange}
									maxlength={2000}
									disabled={status === 'submitting'}></textarea>
							</div>
							<div class="char-count">{formData.message.length}/2000</div>
							{#if errors.message}
								<span class="error-text">{errors.message}</span>
							{/if}
						</div>

						<button
							type="submit"
							class="btn btn-submit submit-full"
							disabled={status === 'submitting'}
						>
							{#if status === 'submitting'}
								<span>Sending...</span>
								<Loader2 class="spinner" size={22} />
							{:else}
								<span>Send Message</span>
								<Send size={22} />
							{/if}
						</button>

						{#if status === 'error' && errorMessage}
							<div
								bind:this={errorBanner}
								tabindex="-1"
								transition:fly={{ y: 10, duration: 200 }}
								class="form-message error"
								role="alert"
								aria-live="polite"
							>
								<AlertCircle size={18} />
								{errorMessage}
							</div>
						{/if}

						<p class="form-footer-note">We typically respond within 24 hours.</p>
					</form>
				{/if}
			</div>
		</div>

		<div class="team-section" style="margin-top: 8rem; margin-bottom: 5rem;">
			<div
				transition:fly={{ y: 20, duration: 400 }}
				class="section-header text-center"
				style="margin-bottom: 4rem;"
			>
				<span class="section-badge">Our Founders</span>
				<h2>Meet the Tarkify Team</h2>
				<p class="section-subtext">The minds behind the next-gen AI automation solutions.</p>
			</div>

			<div class="team-grid">
				<div transition:fly={{ y: 20, duration: 400, delay: 100 }} class="team-card glass">
					<div class="team-avatar-wrapper">
						<img
							src={kushagraImg}
							alt="Kushagra"
							class="team-avatar-image"
							width="84"
							height="84"
							loading="lazy"
							decoding="async"
						/>
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
						<img
							src={ishitaImg}
							alt="Ishita"
							class="team-avatar-image"
							width="84"
							height="84"
							loading="lazy"
							decoding="async"
						/>
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

		<div style="margin-top: 5rem;">
			<Newsletter />
		</div>
	</div>
</div>

<style>
	.contact-heading {
		margin-bottom: 2rem;
		line-height: 1.1;
	}

	.accent-green {
		color: var(--color-accent-green);
	}

	.contact-subtext {
		font-size: 1.125rem;
		opacity: 0.8;
		margin-bottom: 3rem;
		max-width: 28rem;
		line-height: 1.7;
	}

	.contact-info {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.contact-info-item {
		display: flex;
		align-items: center;
		padding-left: 0;
		padding-bottom: 1rem;
	}

	.contact-info-item .info-icon {
		position: relative;
		left: 0;
		padding: 1.25rem;
		margin-right: 1.5rem;
	}

	.info-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
		margin-bottom: 0.25rem;
	}

	.info-value {
		font-weight: 700;
		font-size: 1.25rem;
	}

	.submit-full {
		width: 100%;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		font-size: 1.125rem;
	}

	.form-footer-note {
		text-align: center;
		font-size: 0.875rem;
		opacity: 0.5;
		font-style: italic;
		margin-top: 1.5rem;
	}

	.contact-info-item :global(svg) {
		color: var(--color-accent-green);
	}

	.char-count {
		text-align: right;
		font-size: 0.75rem;
		opacity: 0.5;
		margin-top: 0.25rem;
	}
</style>
