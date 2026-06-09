<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		ShieldCheck,
		Cpu,
		UserCheck,
		FileText,
		AlertTriangle,
		CreditCard,
		Lock,
		Scale,
		RefreshCw,
		Mail
	} from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let activeSection = $state('intro');

	const sections = [
		{ id: 'intro', label: '1. Acceptance of Terms', icon: ShieldCheck },
		{ id: 'services', label: '2. Description of Services', icon: Cpu },
		{ id: 'accounts', label: '3. User Accounts', icon: UserCheck },
		{ id: 'ip', label: '4. Intellectual Property', icon: FileText },
		{ id: 'use', label: '5. Acceptable Use', icon: AlertTriangle },
		{ id: 'billing', label: '6. Fees & Subscriptions', icon: CreditCard },
		{ id: 'liability', label: '7. Limitation of Liability', icon: Lock },
		{ id: 'law', label: '8. Governing Law', icon: Scale },
		{ id: 'changes', label: '9. Changes to Terms', icon: RefreshCw },
		{ id: 'contact', label: '10. Contact Details', icon: Mail }
	];

	$effect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY + 150; // offset for navbar and breathing room

			for (let i = sections.length - 1; i >= 0; i--) {
				const section = sections[i];
				const element = document.getElementById(section.id);
				if (element) {
					const offsetTop = element.offsetTop;
					if (scrollPosition >= offsetTop) {
						activeSection = section.id;
						break;
					}
				}
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // Trigger initial scroll check

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function scrollTo(id: string) {
		const element = document.getElementById(id);
		if (element) {
			const offset = 110; // Match CSS scroll-margin-top
			const bodyRect = document.body.getBoundingClientRect().top;
			const elementRect = element.getBoundingClientRect().top;
			const elementPosition = elementRect - bodyRect;
			const offsetPosition = elementPosition - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
			activeSection = id;
		}
	}
</script>

<Seo
	title="Terms of Service | Tarkify"
	description="Review the terms of service, conditions, and legal agreement governing the use of Tarkify's AI automation services."
	ogImage="/og-image.svg"
/>

<div class="legal-page">
	<div class="container">
		<!-- Header -->
		<header class="legal-header" transition:fly={{ y: 20, duration: 600 }}>
			<Badge variant="section">Legal Agreement</Badge>
			<h1>Terms of Service</h1>
			<p>Last updated: June 26, 2026</p>
		</header>

		<!-- Grid Layout -->
		<div class="legal-container">
			<!-- Table of Contents Sidebar -->
			<aside class="legal-sidebar" transition:fly={{ x: -20, duration: 600, delay: 100 }}>
				<h2 class="legal-sidebar-title">Table of Contents</h2>
				<ul class="legal-sidebar-menu">
					{#each sections as section (section.id)}
						{@const IconComp = section.icon}
						<li>
							<button
								onclick={() => scrollTo(section.id)}
								class="legal-sidebar-link"
								class:active={activeSection === section.id}
							>
								<IconComp size={16} />
								<span>{section.label}</span>
							</button>
						</li>
					{/each}
				</ul>
			</aside>

			<!-- Content Pane -->
			<main class="legal-content-pane" transition:fly={{ y: 20, duration: 600, delay: 200 }}>
				<!-- 1. Introduction -->
				<section id="intro" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<ShieldCheck size={24} />
						</div>
						<h2>1. Acceptance of Terms</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Welcome to Tarkify ("Company," "we," "us," or "our"). By accessing or using our website
							located at <a href="/">tarkify.com</a>, our software, API, and custom AI agents
							(collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms").
							If you do not agree to these Terms, please do not access or use our Services.
						</p>
						<p>
							These Terms constitute a legally binding agreement between you and Tarkify. If you are entering
							into these Terms on behalf of a company or other legal entity, you represent that you have the
							authority to bind such entity and its affiliates to these Terms, in which case the terms "you" or
							"your" shall refer to such entity.
						</p>
					</div>
				</section>

				<!-- 2. Description of Services -->
				<section id="services" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Cpu size={24} />
						</div>
						<h2>2. Description of Services</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Tarkify designs, builds, and deploys custom artificial intelligence (AI) agents and automated
							workflows (e.g., our DevBeast platform) to automate business operations, coding tasks, research,
							and legal operations.
						</p>
						<p>
							We constantly modify and improve our Services. We reserve the right to add, modify, or discontinue
							features or functionalities of the Services at any time without prior notice. We shall not be
							liable to you or any third party for any modification, price change, suspension, or discontinuance
							of the Services.
						</p>
					</div>
				</section>

				<!-- 3. User Accounts -->
				<section id="accounts" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<UserCheck size={24} />
						</div>
						<h2>3. User Accounts & Security</h2>
					</div>
					<div class="legal-card-body">
						<p>
							To access certain features of our Services, you may be required to register for an account.
							You agree to provide accurate, current, and complete information during the registration
							process and to update such information to keep it accurate, current, and complete.
						</p>
						<p>
							You are solely responsible for safeguarding your password and for all activities that occur
							under your account. You agree to notify us immediately of any unauthorized use of your account or
							any other breach of security. Tarkify cannot and will not be liable for any loss or damage arising
							from your failure to comply with these security requirements.
						</p>
					</div>
				</section>

				<!-- 4. Intellectual Property -->
				<section id="ip" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<FileText size={24} />
						</div>
						<h2>4. Intellectual Property Rights</h2>
					</div>
					<div class="legal-card-body">
						<p>
							All right, title, and interest in and to the Services (excluding User Content) are and will remain
							the exclusive property of Tarkify and its licensors. The Services are protected by copyright,
							trademark, and other laws of both the United States and foreign countries.
						</p>
						<p>
							<strong>User Content:</strong> You retain all rights to any data, text, files, or other material
							that you submit, post, or display on or through the Services ("User Content"). By submitting User Content,
							you grant us a worldwide, non-exclusive, royalty-free license to use, copy, process, adapt, modify,
							publish, transmit, and distribute such content solely for the purpose of providing and improving the Services.
						</p>
						<p>
							<strong>AI-Generated Outputs:</strong> Unless otherwise specified in a custom Enterprise Agreement,
							all code, documents, and automation scripts generated by Tarkify's AI agents specifically for your organization
							are owned by you, subject to your full payment of all applicable fees.
						</p>
					</div>
				</section>

				<!-- 5. Acceptable Use -->
				<section id="use" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<AlertTriangle size={24} />
						</div>
						<h2>5. Acceptable Use Policy</h2>
					</div>
					<div class="legal-card-body">
						<p>
							You agree not to use the Services to:
						</p>
						<ul>
							<li>Violate any local, state, national, or international law or regulation.</li>
							<li>Infringe upon or violate our intellectual property rights or the rights of others.</li>
							<li>Transmit any viruses, worms, malware, or other malicious code.</li>
							<li>Interfere with or disrupt the integrity or performance of the Services.</li>
							<li>Attempt to gain unauthorized access to the Services or their related systems or networks.</li>
							<li>Reverse engineer, decompile, or disassemble any aspect of the software or AI architectures.</li>
							<li>Use the AI agents to generate illegal, fraudulent, or harmful materials.</li>
						</ul>
					</div>
				</section>

				<!-- 6. Fees & Subscriptions -->
				<section id="billing" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<CreditCard size={24} />
						</div>
						<h2>6. Fees, Billing, & Subscriptions</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Certain features of the Services are provided on a paid subscription basis or as custom enterprise contracts.
							You agree to pay all fees specified in your service tier or custom contract. All payments are non-refundable
							except as required by law or as explicitly stated in a service level agreement (SLA).
						</p>
						<p>
							We reserve the right to change our subscription rates at any time. We will provide you with reasonable
							prior notice of any changes to fees. Your continued use of the Services after the fee change becomes
							effective constitutes your agreement to pay the modified amount.
						</p>
					</div>
				</section>

				<!-- 7. Limitation of Liability -->
				<section id="liability" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Lock size={24} />
						</div>
						<h2>7. Limitation of Liability</h2>
					</div>
					<div class="legal-card-body">
						<p>
							TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TARKIFY AND ITS OFFICERS, EMPLOYEES, AND AGENTS
							SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
							OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
							USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
						</p>
						<p>
							IN NO EVENT SHALL THE AGGREGATE LIABILITY OF TARKIFY EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS
							($100.00) OR THE TOTAL AMOUNT PAID BY YOU TO TARKIFY IN THE PAST SIX (6) MONTHS FOR THE SERVICES
							GIVING RISE TO THE CLAIM.
						</p>
					</div>
				</section>

				<!-- 8. Governing Law -->
				<section id="law" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Scale size={24} />
						</div>
						<h2>8. Governing Law & Jurisdiction</h2>
					</div>
					<div class="legal-card-body">
						<p>
							These Terms and any action related thereto will be governed by the laws of the State of California
							without regard to or application of its conflict of law provisions or your state or country of
							residence. All claims, legal proceedings, or litigation arising in connection with the Services
							will be brought solely in the federal or state courts located in San Francisco County, California.
						</p>
					</div>
				</section>

				<!-- 9. Changes to Terms -->
				<section id="changes" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<RefreshCw size={24} />
						</div>
						<h2>9. Changes to Terms of Service</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
							If a revision is material, we will provide at least 30 days' notice prior to any new terms taking
							effect. What constitutes a material change will be determined at our sole discretion.
						</p>
						<p>
							By continuing to access or use our Services after those revisions become effective, you agree to
							be bound by the revised terms. If you do not agree to the new terms, please stop using the Services.
						</p>
					</div>
				</section>

				<!-- 10. Contact Details -->
				<section id="contact" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Mail size={24} />
						</div>
						<h2>10. Contact Information</h2>
					</div>
					<div class="legal-card-body">
						<p>
							If you have any questions about these Terms, please contact the Tarkify team:
						</p>
						<ul>
							<li>Email: <a href="mailto:tarkify.ai@gmail.com">tarkify.ai@gmail.com</a></li>
							<li>Website Contact Form: <a href="/contact">tarkify.com/contact</a></li>
						</ul>
					</div>
				</section>
			</main>
		</div>
	</div>
</div>
