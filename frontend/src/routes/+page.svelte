<script lang="ts">
	import Hero from '$lib/components/home/Hero.svelte';
	import IntegrationGallery from '$lib/components/home/IntegrationGallery.svelte';
	import WhatWeDo from '$lib/components/home/WhatWeDo.svelte';
	import ROICalculator from '$lib/components/home/ROICalculator.svelte';
	import HowItWorks from '$lib/components/home/HowItWorks.svelte';
	import WhyTarkify from '$lib/components/home/WhyTarkify.svelte';
	import Testimonials from '$lib/components/home/Testimonials.svelte';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
	title="Tarkify - AI-Powered Automation"
	description="We build AI agents that automate work and make life easier. Reclaim hours of manual work and scale your team."
	ogImage="/og-image.svg"
/>

<Hero />
<IntegrationGallery />
<WhatWeDo />
<ROICalculator />
<HowItWorks />
<WhyTarkify />
<Testimonials />
