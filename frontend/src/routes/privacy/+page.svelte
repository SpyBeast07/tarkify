<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		Database,
		Cog,
		Share2,
		Lock,
		Clock,
		UserCheck,
		Layers,
		Cookie,
		Users,
		RefreshCw,
		Mail
	} from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let activeSection = $state('collection');

	const sections = [
		{ id: 'collection', label: '1. Information We Collect', icon: Database },
		{ id: 'usage', label: '2. How We Use Information', icon: Cog },
		{ id: 'sharing', label: '3. Sharing & Disclosure', icon: Share2 },
		{ id: 'security', label: '4. Data Security & Storage', icon: Lock },
		{ id: 'retention', label: '5. Data Retention Policies', icon: Clock },
		{ id: 'rights', label: '6. Your Privacy Rights', icon: UserCheck },
		{ id: 'thirdparty', label: '7. Third-Party Integrations', icon: Layers },
		{ id: 'cookies', label: '8. Cookies & Tracking', icon: Cookie },
		{ id: 'children', label: '9. Children\'s Privacy', icon: Users },
		{ id: 'changes', label: '10. Changes to Policy', icon: RefreshCw },
		{ id: 'contact', label: '11. Contact Details', icon: Mail }
	];

	$effect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY + 150;

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
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function scrollTo(id: string) {
		const element = document.getElementById(id);
		if (element) {
			const offset = 110;
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
	title="Privacy Policy | Tarkify"
	description="Review the Privacy Policy of Tarkify. Learn how we collect, use, store, and protect your data when using our AI automation solutions."
	ogImage="/og-image.svg"
/>

<div class="legal-page">
	<div class="container">
		<!-- Header -->
		<header class="legal-header" transition:fly={{ y: 20, duration: 600 }}>
			<Badge variant="section">Legal Agreement</Badge>
			<h1>Privacy Policy</h1>
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
				<!-- 1. Information We Collect -->
				<section id="collection" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Database size={24} />
						</div>
						<h2>1. Information We Collect</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We collect information that you provide directly to us, information that is automatically
							collected when you use our Services, and information processed on your behalf by our custom
							AI agents.
						</p>
						<p><strong>Personal Data:</strong> This includes your name, email address, phone number, billing information,
							company name, and credentials provided when creating an account or contacting support.</p>
						<p><strong>System & Integration Data:</strong> To allow our AI agents (like DevBeast) to execute tasks, we
							may collect API keys, database credentials, repository access, and log files that you explicitly authorize
							and configure within the platform.</p>
						<p><strong>Usage Information:</strong> We collect details about your interactions with the Services, such as
							IP address, browser type, operating system, page views, query inputs, and performance metrics.</p>
					</div>
				</section>

				<!-- 2. How We Use Information -->
				<section id="usage" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Cog size={24} />
						</div>
						<h2>2. How We Use Information</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We use the information we collect to provide, maintain, and improve our Services, including:
						</p>
						<ul>
							<li>Operating the AI agents, code executors, and automation pipelines.</li>
							<li>Processing transactions and sending billing notifications.</li>
							<li>Responding to customer support requests and communication inquiries.</li>
							<li>Detecting, preventing, and addressing technical issues or security vulnerabilities.</li>
							<li>Analyzing usage trends to improve user interface design and software performance.</li>
						</ul>
						<p>
							<strong>Important note on AI training:</strong> Tarkify does NOT use your proprietary source code, database contents,
							or private company documents to train public or shared AI models. Your workspace data remains segregated and
							private.
						</p>
					</div>
				</section>

				<!-- 3. Sharing & Disclosure -->
				<section id="sharing" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Share2 size={24} />
						</div>
						<h2>3. Sharing & Disclosure</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We do not sell, rent, or trade your personal data. We only share information in the following circumstances:
						</p>
						<ul>
							<li><strong>With Subprocessors:</strong> We utilize third-party cloud hosting providers (e.g., AWS, GCP) and leading AI model provider APIs (e.g., OpenAI, Anthropic, Google Gemini) to run backend workloads. These subprocessors are contractually bound to comply with strict data protection guidelines.</li>
							<li><strong>For Legal Compliance:</strong> We may disclose information if we believe in good faith that disclosure is necessary to comply with applicable laws, regulations, legal processes, or government requests.</li>
							<li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, financing, or sale of assets, your information may be transferred as part of that business transaction.</li>
						</ul>
					</div>
				</section>

				<!-- 4. Data Security -->
				<section id="security" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Lock size={24} />
						</div>
						<h2>4. Data Security & Storage</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Tarkify takes data security extremely seriously. We implement robust technical and organizational measures
							to protect your information, including:
						</p>
						<ul>
							<li>Encryption of data at rest and in transit using industry-standard TLS 1.3 and AES-256 protocols.</li>
							<li>Secure credential vaulting with restricted, role-based access control.</li>
							<li>Regular automated dependency audits and third-party security assessments.</li>
							<li>Containerized sandboxing of AI code executions to prevent unauthorized network access or privilege escalation.</li>
						</ul>
					</div>
				</section>

				<!-- 5. Data Retention -->
				<section id="retention" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Clock size={24} />
						</div>
						<h2>5. Data Retention Policies</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We store your personal data only as long as necessary to fulfill the purposes outlined in this Privacy Policy,
							provide our services, resolve disputes, and comply with legal requirements.
						</p>
						<p>
							For AI task executions, detailed transaction logs and inputs/outputs are kept for 30 days to facilitate
							debugging and reporting, after which they are automatically anonymized or purged, unless custom retention terms
							are set in your organization's configuration.
						</p>
					</div>
				</section>

				<!-- 6. Privacy Rights -->
				<section id="rights" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<UserCheck size={24} />
						</div>
						<h2>6. Your Privacy Rights</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Depending on your location, you may have specific rights regarding your personal information, including the rights under
							the General Data Protection Regulation (GDPR) or California Consumer Privacy Act (CCPA):
						</p>
						<ul>
							<li><strong>Access & Portability:</strong> The right to request copies of your personal information in a structured, machine-readable format.</li>
							<li><strong>Rectification:</strong> The right to request correction of inaccurate or incomplete personal data.</li>
							<li><strong>Deletion ("Right to be Forgotten"):</strong> The right to request that we erase your personal data, subject to certain exceptions.</li>
							<li><strong>Objection & Restriction:</strong> The right to object to or request restriction of our processing of your personal data.</li>
						</ul>
						<p>To exercise any of these rights, please contact our support team at <a href="mailto:tarkify.ai@gmail.com">tarkify.ai@gmail.com</a>.</p>
					</div>
				</section>

				<!-- 7. Third-Party Integrations -->
				<section id="thirdparty" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Layers size={24} />
						</div>
						<h2>7. Third-Party Integrations</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Our Services allow you to connect third-party platforms (such as GitHub, Slack, Jira, or database hosting providers).
							This Privacy Policy only applies to our platform. We do not control and are not responsible for the privacy practices,
							security, or contents of third-party platforms. We recommend checking their individual privacy policies.
						</p>
					</div>
				</section>

				<!-- 8. Cookies -->
				<section id="cookies" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Cookie size={24} />
						</div>
						<h2>8. Cookies & Tracking</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We use cookies and similar tracking technologies to enhance user experiences, keep you logged in,
							and analyze traffic. You can adjust your browser settings to refuse cookies or alert you when cookies are
							being sent. However, please note that disabling cookies may cause some parts of the Services to function
							incorrectly.
						</p>
					</div>
				</section>

				<!-- 9. Children's Privacy -->
				<section id="children" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Users size={24} />
						</div>
						<h2>9. Children's Privacy</h2>
					</div>
					<div class="legal-card-body">
						<p>
							Our Services are not designed for or directed at children under the age of 16. We do not knowingly collect
							personal information from children under 16. If we become aware that we have collected information from
							a child under 16, we will take immediate steps to delete that data from our servers.
						</p>
					</div>
				</section>

				<!-- 10. Changes to Policy -->
				<section id="changes" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<RefreshCw size={24} />
						</div>
						<h2>10. Changes to this Privacy Policy</h2>
					</div>
					<div class="legal-card-body">
						<p>
							We may update this Privacy Policy from time to time to reflect changes in our practices or compliance
							requirements. When changes are made, we will update the "Last updated" date at the top of the policy
							and, if the changes are significant, we will notify you by email or through a platform alert.
						</p>
					</div>
				</section>

				<!-- 11. Contact Details -->
				<section id="contact" class="legal-card-section">
					<div class="legal-card-header">
						<div class="legal-card-icon">
							<Mail size={24} />
						</div>
						<h2>11. Contact Information</h2>
					</div>
					<div class="legal-card-body">
						<p>
							If you have any questions or concerns regarding our privacy practices, please contact us:
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
