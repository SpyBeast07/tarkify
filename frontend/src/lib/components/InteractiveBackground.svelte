<script lang="ts">
	import { onMount } from 'svelte';
	import Matter from 'matter-js';
	import { Volume2, VolumeX, ShieldAlert, RotateCcw } from '@lucide/svelte';

	// Web Audio API Synthesizer Class (No external audio file dependencies)
	class AudioSynth {
		ctx: AudioContext | null = null;
		muted: boolean = false;

		init() {
			if (!this.ctx) {
				const AudioCtx =
					window.AudioContext ||
					(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
				if (AudioCtx) {
					this.ctx = new AudioCtx();
				}
			}
			if (this.ctx && this.ctx.state === 'suspended') {
				this.ctx.resume();
			}
		}

		playEat() {
			if (this.muted) return;
			this.init();
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.connect(gain);
			gain.connect(this.ctx.destination);
			osc.type = 'sine';
			osc.frequency.setValueAtTime(440, this.ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
			gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
			osc.start();
			osc.stop(this.ctx.currentTime + 0.12);
		}

		playWarning() {
			if (this.muted) return;
			this.init();
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.connect(gain);
			gain.connect(this.ctx.destination);
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(140, this.ctx.currentTime);
			gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
			gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
			osc.start();
			osc.stop(this.ctx.currentTime + 0.08);
		}

		playCollapse() {
			if (this.muted) return;
			this.init();
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.connect(gain);
			gain.connect(this.ctx.destination);
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(180, this.ctx.currentTime);
			osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.7);
			gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);
			osc.start();
			osc.stop(this.ctx.currentTime + 0.75);
		}

		playReboot() {
			if (this.muted) return;
			this.init();
			if (!this.ctx) return;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.connect(gain);
			gain.connect(this.ctx.destination);
			osc.type = 'sine';
			osc.frequency.setValueAtTime(90, this.ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 1.0);
			gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.05);
			osc.start();
			osc.stop(this.ctx.currentTime + 1.05);
		}
	}

	const audioSynth = new AudioSynth();

	// ── Svelte display state ──────────────────────────
	let score = $state(0);
	let discount = $state(0);
	let stability = $state(100);
	let isCollapsed = $state(false);
	let isMuted = $state(false);
	let isReturning = $state(false);
	let previousStats = $state({ score: 0, discount: 0 });
	let shakeProgress = $state(0);

	let isRebooting = false;

	// Refs
	let containerRef: HTMLDivElement | undefined = $state();
	let canvasRef: HTMLCanvasElement | undefined = $state();

	// ── Mutable game variables ─
	const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0 };
	let segments: { x: number; y: number }[] = [];
	let particles: { x: number; y: number; vx: number; vy: number; alpha: number; color: string }[] =
		[];
	let food: {
		x: number;
		y: number;
		baseX: number;
		baseY: number;
		timeOffset: number;
		color: string;
	} | null = null;
	let isIdle = false;
	let idleTimer = 0;
	let prevStability = 100;
	let alertPulse = 0;
	let mouseMoved = false;

	// ── Collapse / reboot variables ────────────────────────────────────────────────
	let matterEngine: Matter.Engine | null = null;
	let matterRunner: Matter.Runner | null = null;
	let collapsedItems: {
		el: HTMLElement;
		body: Matter.Body;
		ox: number;
		oy: number;
		originalStyles: { transform: string; transition: string; pointerEvents: string };
	}[] = [];

	// Shake detection
	let lastMousePos = { x: 0, y: 0, time: 0, dx: 0, dy: 0 };

	const toggleMute = () => {
		audioSynth.muted = !audioSynth.muted;
		isMuted = audioSynth.muted;
		audioSynth.init();
	};

	// ── Food spawner ──────────────────────────────────────────────────────────
	const spawnFood = (width: number, height: number) => {
		const px = 50 + Math.random() * (width - 100);
		const py = 120 + Math.random() * (height - 220);
		food = {
			x: px,
			y: py,
			baseX: px,
			baseY: py,
			timeOffset: Math.random() * Math.PI * 2,
			color: Math.random() > 0.4 ? 'rgba(235, 196, 64, 0.95)' : 'rgba(230, 85, 85, 0.95)'
		};
	};

	let cleanupFunctions: (() => void)[] = [];

	onMount(() => {
		// Load stats
		const savedScore = localStorage.getItem('tarkify_snake_score');
		const savedDiscount = localStorage.getItem('tarkify_snake_discount');
		if (savedScore && savedDiscount) {
			const s = parseInt(savedScore, 10);
			const d = parseInt(savedDiscount, 10);
			if (s > 0) {
				isReturning = true;
				previousStats = { score: s, discount: d };
				setTimeout(() => (isReturning = false), 6000);
			}
		}

		const canvas = canvasRef;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animFrameId: number;
		let frameCount = 0;

		// Resize
		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			if (!food) spawnFood(canvas.width, canvas.height);
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

		// Init snake
		if (segments.length === 0) {
			for (let i = 0; i < 6; i++) {
				segments.push({ x: canvas.width / 2 + i * 12, y: canvas.height / 2 });
			}
		}
		mouse.targetX = canvas.width / 2;
		mouse.targetY = canvas.height / 2;
		mouse.x = canvas.width / 2;
		mouse.y = canvas.height / 2;

		// ── TRIGGER COLLAPSE ────
		const doCollapse = () => {
			if (matterEngine || isCollapsed) return;
			audioSynth.playCollapse();
			document.body.style.overflow = 'hidden';

			if (containerRef) containerRef.classList.add('shock');
			setTimeout(() => {
				if (containerRef) containerRef.classList.remove('shock');

				const width = window.innerWidth;
				const height = window.innerHeight;
				const engine = Matter.Engine.create({ gravity: { y: 1.1 } });
				const world = engine.world;
				matterEngine = engine;

				const floor = Matter.Bodies.rectangle(width / 2, height + 50, width * 3, 100, {
					isStatic: true,
					friction: 0.95
				});
				const leftWall = Matter.Bodies.rectangle(-50, height / 2, 100, height * 3, {
					isStatic: true
				});
				const rightWall = Matter.Bodies.rectangle(width + 50, height / 2, 100, height * 3, {
					isStatic: true
				});
				Matter.Composite.add(world, [floor, leftWall, rightWall]);

				const targetQuery =
					'h1, h2, h3, p, button, a.btn, .hero-badge, .agent-simulator, .service-card, .reason-card, .calculator-grid, .contact-form-card, .logo, nav a';
				const selected = Array.from(document.querySelectorAll(targetQuery)) as HTMLElement[];

				const filtered = selected.filter((el) => {
					if (
						el.closest('.interactive-bg-wrapper') ||
						el.closest('.hud-overlay') ||
						el.closest('.collapse-banner') ||
						el.closest('.returning-banner')
					)
						return false;
					let parent = el.parentElement;
					while (parent) {
						if (selected.includes(parent)) return false;
						parent = parent.parentElement;
					}
					return true;
				});

				collapsedItems = [];

				filtered.forEach((el) => {
					const rect = el.getBoundingClientRect();
					if (rect.width < 5 || rect.height < 5) return;

					const cx = rect.left + rect.width / 2;
					const cy = rect.top + rect.height / 2;

					let density = 0.005;
					let frictionAir = 0.05;
					if (el.tagName === 'P' || el.tagName === 'SPAN') {
						density = 0.001;
						frictionAir = 0.09;
					} else if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
						density = 0.015;
						frictionAir = 0.04;
					} else if (
						el.classList.contains('calculator-grid') ||
						el.classList.contains('contact-form-card') ||
						el.classList.contains('agent-simulator')
					) {
						density = 0.06;
						frictionAir = 0.02;
					}

					const body = Matter.Bodies.rectangle(cx, cy, rect.width, rect.height, {
						density,
						frictionAir,
						restitution: 0.35,
						friction: 0.2
					});
					const originalStyles = {
						transform: el.style.transform,
						transition: el.style.transition,
						pointerEvents: el.style.pointerEvents
					};

					Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
					Matter.Body.applyForce(
						body,
						{ x: cx, y: cy },
						{ x: (Math.random() - 0.5) * 0.015, y: 0 }
					);
					Matter.Composite.add(world, body);
					collapsedItems.push({ el, body, ox: cx, oy: cy, originalStyles });
				});

				const runner = Matter.Runner.create();
				matterRunner = runner;
				Matter.Runner.run(runner, engine);

				Matter.Events.on(engine, 'afterUpdate', () => {
					collapsedItems.forEach((item) => {
						const { x, y } = item.body.position;
						item.el.style.transition = 'none';
						item.el.style.transform = `translate3d(${x - item.ox}px, ${y - item.oy}px, 0) rotate(${item.body.angle}rad)`;
						item.el.style.pointerEvents = 'none';
					});
				});

				isCollapsed = true;
				shakeProgress = 0;
				lastMousePos = { x: 0, y: 0, time: 0, dx: 0, dy: 0 };
			}, 200);
		};

		// ── TRIGGER REBOOT ────────────────────────────
		const doReboot = () => {
			if (!isCollapsed || isRebooting) return;
			isRebooting = true;
			audioSynth.playReboot();

			if (matterRunner && matterEngine) {
				Matter.Runner.stop(matterRunner);
				Matter.Events.off(matterEngine, 'afterUpdate');
				Matter.World.clear(matterEngine.world, false);
				Matter.Engine.clear(matterEngine);
			}
			matterEngine = null;
			matterRunner = null;

			collapsedItems.forEach((item) => {
				item.el.style.transition = 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
				item.el.style.transform = 'translate3d(0, 0, 0) rotate(0rad)';
			});

			score = 0;
			discount = 0;
			stability = 100;
			shakeProgress = 0;
			localStorage.removeItem('tarkify_snake_score');
			localStorage.removeItem('tarkify_snake_discount');

			setTimeout(() => {
				collapsedItems.forEach((item) => {
					item.el.style.removeProperty('transform');
					item.el.style.removeProperty('transition');
					item.el.style.removeProperty('pointer-events');
				});
				collapsedItems = [];

				isCollapsed = false;
				isRebooting = false;
				document.body.style.removeProperty('overflow');
				mouseMoved = false;

				const width = window.innerWidth;
				const height = window.innerHeight;
				segments = [];
				for (let i = 0; i < 6; i++) {
					segments.push({ x: width / 2 + i * 12, y: height / 2 });
				}
				mouse.vx = 0;
				mouse.vy = 0;
				mouse.targetX = width / 2;
				mouse.targetY = height / 2;
				spawnFood(width, height);
				lastMousePos = { x: 0, y: 0, time: 0, dx: 0, dy: 0 };
			}, 1600);
		};

		// ── MOUSE HANDLER ────────────────────────────────────────────────────
		const handleMouseMove = (e: MouseEvent) => {
			isIdle = false;
			idleTimer = 0;
			if (!mouseMoved) mouseMoved = true;
			mouse.targetX = e.clientX;
			mouse.targetY = e.clientY;

			// Shake detection
			if (isCollapsed && !isRebooting) {
				const timeNow = Date.now();
				const lp = lastMousePos;

				if (lp.time > 0) {
					const dx = e.clientX - lp.x;
					const dy = e.clientY - lp.y;
					const dt = Math.max(1, timeNow - lp.time);
					const speed = Math.hypot(dx, dy) / dt;

					if ((lp.dx !== 0 || lp.dy !== 0) && speed > 0.5) {
						const dot = dx * lp.dx + dy * lp.dy;
						if (dot < -5) {
							const next = Math.min(100, shakeProgress + 6);
							shakeProgress = next;

							if (next >= 100) {
								shakeProgress = 0;
								setTimeout(doReboot, 16);
							}
						}
					}

					lp.dx = dx;
					lp.dy = dy;
				}

				lp.x = e.clientX;
				lp.y = e.clientY;
				lp.time = timeNow;
			}
		};
		window.addEventListener('mousemove', handleMouseMove);
		cleanupFunctions.push(() => window.removeEventListener('mousemove', handleMouseMove));

		// Particle emitter
		const createExplosion = (x: number, y: number, color: string) => {
			for (let i = 0; i < 15; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = 1.5 + Math.random() * 3.5;
				particles.push({
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					alpha: 1.0,
					color
				});
			}
		};

		const cellSize = 60;
		let clock = 0;

		const render = () => {
			animFrameId = requestAnimationFrame(render);
			clock += 0.05;
			frameCount++;

			idleTimer++;
			if (idleTimer > 600) isIdle = true;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Phase 1: Blueprint grid
			const mouseX = mouse.targetX;
			const mouseY = mouse.targetY;
			const gridOpacity = isIdle ? 0.02 : 0.045;
			ctx.strokeStyle = `rgba(163, 163, 163, ${gridOpacity})`;
			ctx.lineWidth = 0.8;
			ctx.beginPath();
			for (let x = 0; x < canvas.width; x += cellSize) {
				ctx.moveTo(x, 0);
				ctx.lineTo(x, canvas.height);
			}
			for (let y = 0; y < canvas.height; y += cellSize) {
				ctx.moveTo(0, y);
				ctx.lineTo(canvas.width, y);
			}
			ctx.stroke();

			// Mouse glow
			if (!isIdle && !isCollapsed) {
				const glow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 160);
				glow.addColorStop(0, 'rgba(122, 163, 85, 0.05)');
				glow.addColorStop(1, 'rgba(122, 163, 85, 0)');
				ctx.fillStyle = glow;
				ctx.beginPath();
				ctx.arc(mouseX, mouseY, 160, 0, Math.PI * 2);
				ctx.fill();
			}

			// Collapsed state: red flash + decay progress
			if (isCollapsed) {
				alertPulse += 0.04;
				const flashIntensity = 0.02 + Math.sin(alertPulse) * 0.015;
				ctx.fillStyle = `rgba(230, 85, 85, ${flashIntensity})`;
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				if (!isRebooting && shakeProgress > 0 && frameCount % 3 === 0) {
					const decayed = Math.max(0, shakeProgress - 0.4);
					shakeProgress = decayed;
				}
				return;
			}

			// Phase 2: Snake spring physics
			const head = segments[0];
			if (head) {
				const stiffness = isIdle ? 0.03 : 0.095;
				const damping = 0.72;
				const dx = mouse.targetX - head.x;
				const dy = mouse.targetY - head.y;
				mouse.vx += dx * stiffness;
				mouse.vy += dy * stiffness;
				mouse.vx *= damping;
				mouse.vy *= damping;
				head.x += mouse.vx;
				head.y += mouse.vy;

				const margin = 18;
				let boundaryTouch = false;
				if (head.x < margin) {
					head.x = margin;
					mouse.vx = Math.abs(mouse.vx) * 0.4;
					boundaryTouch = true;
				} else if (head.x > canvas.width - margin) {
					head.x = canvas.width - margin;
					mouse.vx = -Math.abs(mouse.vx) * 0.4;
					boundaryTouch = true;
				}
				if (head.y < margin) {
					head.y = margin;
					mouse.vy = Math.abs(mouse.vy) * 0.4;
					boundaryTouch = true;
				} else if (head.y > canvas.height - margin) {
					head.y = canvas.height - margin;
					mouse.vy = -Math.abs(mouse.vy) * 0.4;
					boundaryTouch = true;
				}

				const targetDist = 12;
				for (let i = 1; i < segments.length; i++) {
					const prev = segments[i - 1];
					const curr = segments[i];
					if (!prev || !curr) continue;
					const sdx = curr.x - prev.x;
					const sdy = curr.y - prev.y;
					const dist = Math.hypot(sdx, sdy) || 1;
					curr.x = prev.x + (sdx / dist) * targetDist;
					curr.y = prev.y + (sdy / dist) * targetDist;
				}

				let localStability = 100;
				let nearSelfCollision = false;
				let selfColTrigger = false;

				if (mouseMoved) {
					if (boundaryTouch) {
						localStability -= 25;
						if (Math.random() > 0.7) {
							audioSynth.playWarning();
							createExplosion(head.x, head.y, 'rgba(230, 85, 85, 0.4)');
						}
					}

					for (let i = 12; i < segments.length; i++) {
						const seg = segments[i];
						if (!seg) continue;
						const dist = Math.hypot(head.x - seg.x, head.y - seg.y);
						if (dist < 32) {
							nearSelfCollision = true;
							localStability = Math.min(localStability, Math.round((dist - 8) * 4));
							ctx.strokeStyle = `rgba(230, 85, 85, ${0.45 * (1 - dist / 32)})`;
							ctx.lineWidth = 1.0;
							ctx.beginPath();
							ctx.moveTo(head.x, head.y);
							ctx.lineTo(seg.x, seg.y);
							ctx.stroke();
						}
						if (dist < 8) selfColTrigger = true;
					}
				}

				if (mouseMoved && (nearSelfCollision || boundaryTouch)) {
					stability = Math.max(0, localStability);
					if (prevStability > 30 && localStability <= 30) audioSynth.playWarning();
					prevStability = localStability;
				} else {
					stability = Math.min(100, stability + 1);
					prevStability = 100;
				}

				if (mouseMoved && selfColTrigger) {
					doCollapse();
					return;
				}
			}

			// Draw snake body
			ctx.save();
			const segmentLen = segments.length;
			const energyPulse = 1.0 + Math.sin(clock * 4.5) * 0.12;

			ctx.globalCompositeOperation = 'screen';
			ctx.shadowBlur = 10;
			ctx.shadowColor = 'rgba(122, 163, 85, 0.5)';

			for (let i = segmentLen - 1; i > 0; i--) {
				const curr = segments[i];
				const next = segments[i - 1];
				if (!curr || !next) continue;
				const pctCurr = 1.0 - i / segmentLen;
				const pctNext = 1.0 - (i - 1) / segmentLen;
				const radCurr = (3.5 + pctCurr * 6.5) * energyPulse;
				const radNext = (3.5 + pctNext * 6.5) * energyPulse;
				const isAlternate = i % 2 === 0;
				const alpha = 0.3 + 0.45 * pctCurr;
				ctx.fillStyle = isAlternate
					? `rgba(122, 163, 85, ${alpha})`
					: `rgba(90, 130, 50, ${alpha})`;
				ctx.beginPath();
				ctx.arc(curr.x, curr.y, radCurr, 0, Math.PI * 2);
				ctx.fill();
				const midX = (curr.x + next.x) / 2;
				const midY = (curr.y + next.y) / 2;
				const radMid = (radCurr + radNext) / 2;
				const alphaMid = 0.3 + 0.45 * ((pctCurr + pctNext) / 2);
				ctx.fillStyle = isAlternate
					? `rgba(90, 130, 50, ${alphaMid})`
					: `rgba(122, 163, 85, ${alphaMid})`;
				ctx.beginPath();
				ctx.arc(midX, midY, radMid, 0, Math.PI * 2);
				ctx.fill();
			}

			for (let i = segmentLen - 1; i > 0; i--) {
				const seg = segments[i];
				if (!seg) continue;
				const pct = 1.0 - i / segmentLen;
				const rad = (3.5 + pct * 6.5) * energyPulse;
				ctx.strokeStyle = `rgba(163, 204, 126, ${0.15 * pct})`;
				ctx.lineWidth = 1.0;
				ctx.beginPath();
				ctx.arc(seg.x, seg.y, rad, 0, Math.PI * 2);
				ctx.stroke();
			}

			ctx.shadowBlur = 4;
			ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			if (segments[0]) {
				ctx.moveTo(segments[0].x, segments[0].y);
				for (let i = 1; i < segments.length; i++) {
					const seg = segments[i];
					if (seg) ctx.lineTo(seg.x, seg.y);
				}
			}
			ctx.stroke();
			ctx.restore();

			// Draw head
			const headSeg = segments[0];
			if (headSeg) {
				const nextSeg = segments[1] || headSeg;
				const angle = Math.atan2(headSeg.y - nextSeg.y, headSeg.x - nextSeg.x);
				ctx.save();
				ctx.translate(headSeg.x, headSeg.y);
				ctx.rotate(angle);
				const headRad = 11.5 * energyPulse;
				ctx.shadowBlur = 12;
				ctx.shadowColor = 'rgba(122, 163, 85, 0.7)';
				ctx.fillStyle = 'rgba(122, 163, 85, 0.95)';
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo(headRad * 1.2, 0);
				ctx.quadraticCurveTo(headRad * 0.6, headRad * 0.9, -headRad * 0.4, headRad * 0.8);
				ctx.quadraticCurveTo(-headRad * 0.9, headRad * 0.5, -headRad * 0.7, 0);
				ctx.quadraticCurveTo(-headRad * 0.9, -headRad * 0.5, -headRad * 0.4, -headRad * 0.8);
				ctx.quadraticCurveTo(headRad * 0.6, -headRad * 0.9, headRad * 1.2, 0);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();

				ctx.shadowBlur = 0;
				ctx.fillStyle = '#ffffff';
				ctx.save();
				ctx.translate(headRad * 0.3, headRad * 0.35);
				ctx.rotate(0.3);
				ctx.beginPath();
				ctx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#000000';
				ctx.fillRect(-0.5, -1.5, 1, 3);
				ctx.restore();

				ctx.save();
				ctx.translate(headRad * 0.3, -headRad * 0.35);
				ctx.rotate(-0.3);
				ctx.beginPath();
				ctx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2);
				ctx.fillStyle = '#ffffff';
				ctx.fill();
				ctx.fillStyle = '#000000';
				ctx.fillRect(-0.5, -1.5, 1, 3);
				ctx.restore();

				const flicker = Math.sin(clock * 18) > 0.4;
				if (flicker) {
					ctx.strokeStyle = '#e65555';
					ctx.lineWidth = 2.0;
					ctx.beginPath();
					ctx.moveTo(headRad * 1.2, 0);
					ctx.lineTo(headRad * 1.9, 0);
					ctx.moveTo(headRad * 1.9, 0);
					ctx.lineTo(headRad * 2.3, headRad * 0.35);
					ctx.moveTo(headRad * 1.9, 0);
					ctx.lineTo(headRad * 2.3, -headRad * 0.35);
					ctx.stroke();
				}
				ctx.restore();
			}

			// Phase 3: Food
			if (food && head) {
				const fd = food;
				const driftX = fd.baseX + Math.sin(clock + fd.timeOffset) * 12;
				const driftY = fd.baseY + Math.cos(clock + fd.timeOffset) * 12;
				const distHead = Math.hypot(head.x - fd.x, head.y - fd.y);
				if (distHead < 90) {
					fd.x += (head.x - fd.x) * 0.15;
					fd.y += (head.y - fd.y) * 0.15;
				} else {
					fd.x += (driftX - fd.x) * 0.05;
					fd.y += (driftY - fd.y) * 0.05;
				}
				ctx.save();
				ctx.shadowBlur = 12;
				ctx.shadowColor = fd.color;
				ctx.fillStyle = fd.color;
				const foodPulse = 4.0 + Math.sin(clock * 6) * 1.5;
				ctx.beginPath();
				ctx.arc(fd.x, fd.y, foodPulse, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();

				if (distHead < 18) {
					audioSynth.playEat();
					createExplosion(fd.x, fd.y, fd.color);
					const tail = segments[segments.length - 1] || head;
					for (let k = 0; k < 3; k++) {
						if (segments.length < 80) segments.push({ x: tail.x, y: tail.y });
					}
					const nextScore = score + 1;
					score = nextScore;
					const disc = Math.floor(nextScore / 100) * 10;
					discount = disc;
					localStorage.setItem('tarkify_snake_score', nextScore.toString());
					localStorage.setItem('tarkify_snake_discount', disc.toString());
					spawnFood(canvas.width, canvas.height);
				}
			}

			// Phase 4: Particles
			particles = particles.filter((p) => {
				p.x += p.vx;
				p.y += p.vy;
				p.alpha -= 0.035;
				ctx.fillStyle = p.color.replace('0.95', p.alpha.toFixed(2));
				ctx.beginPath();
				ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
				ctx.fill();
				return p.alpha > 0;
			});
		};

		render();

		// Bind doReboot reference
		(canvas as HTMLCanvasElement & { __doReboot?: () => void }).__doReboot = doReboot;

		return () => {
			cancelAnimationFrame(animFrameId);
			cleanupFunctions.forEach((cleanup) => cleanup());
			cleanupFunctions = [];
			if (matterRunner && matterEngine) {
				Matter.Runner.stop(matterRunner);
				Matter.Events.off(matterEngine, 'afterUpdate');
				Matter.World.clear(matterEngine.world, false);
				Matter.Engine.clear(matterEngine);
			}
			document.body.style.removeProperty('overflow');
		};
	});

	const handleForceReboot = () => {
		const fn = (canvasRef as HTMLCanvasElement & { __doReboot?: () => void })?.__doReboot;
		if (fn) fn();
	};
</script>

<div bind:this={containerRef} class="interactive-bg-wrapper">
	<canvas bind:this={canvasRef} class="interactive-canvas"></canvas>
</div>

<!-- Returning operator banner -->
{#if isReturning && !isCollapsed}
	<div class="returning-banner">
		<span class="text-accent-green">// RETURNING_OPERATOR_DETECTED</span>
		<span>SCORE: {previousStats.score} | UNLOCKED DISCOUNT: ₹{previousStats.discount}</span>
	</div>
{/if}

<!-- HUD -->
<div class="hud-overlay">
	<!-- Collapsed pill -->
	<div class="hud-pill">
		<span class="hud-pill-score accent">{score}</span>
		<span class="hud-pill-sep">·</span>
		<span class="hud-pill-disc">₹{discount}</span>
		<button onclick={toggleMute} class="hud-mute-btn" title={isMuted ? 'Unmute' : 'Mute'}>
			{#if isMuted}
				<VolumeX size={10} />
			{:else}
				<Volume2 size={10} />
			{/if}
		</button>
	</div>
	<!-- Expanded panel -->
	<div class="hud-expanded">
		<div class="hud-metrics">
			<div class="metric-row">
				<span class="label">SCORE</span>
				<span class="value accent">{score}</span>
			</div>
			<div class="metric-row">
				<span class="label">DISCOUNT</span>
				<span class="value">₹{discount}</span>
			</div>
		</div>
	</div>
</div>

<!-- Crash screen -->
{#if isCollapsed}
	<div class="collapse-banner">
		<div class="error-title">
			<ShieldAlert size={22} class="text-red-alert animate-bounce" />
			<span>CRITICAL_SYSTEM_FAILURE: TARKIFY_OS_COLLAPSED</span>
		</div>
		<p class="error-instruction">&gt; SHAKE CURSOR RAPIDLY TO REINITIALIZE SYSTEMS...</p>
		<div class="shake-track">
			<div class="shake-fill" style="width: {shakeProgress}%;"></div>
		</div>
		<div class="shake-percent">
			SYS_RECONSTRUCT: {Math.round(shakeProgress)}%
		</div>
		<button onclick={handleForceReboot} class="manual-reset-btn">
			<RotateCcw size={13} /> Bypass Shake (Force Reboot)
		</button>
	</div>
{/if}

<style>
	.interactive-bg-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 9990;
		pointer-events: none;
		overflow: hidden;
		transition: background-color 0.4s ease;
	}
	.interactive-bg-wrapper :global(.shock) {
		animation: shock-shake 0.2s linear infinite;
		background-color: rgba(230, 85, 85, 0.45) !important;
	}
	@keyframes shock-shake {
		0% {
			transform: translate(2px, 1px) rotate(0deg);
		}
		10% {
			transform: translate(-1px, -2px) rotate(-1deg);
		}
		20% {
			transform: translate(-3px, 0px) rotate(1deg);
		}
		30% {
			transform: translate(0px, 2px) rotate(0deg);
		}
		40% {
			transform: translate(1px, -1px) rotate(1deg);
		}
		50% {
			transform: translate(-1px, 2px) rotate(-1deg);
		}
		60% {
			transform: translate(-3px, 1px) rotate(0deg);
		}
		70% {
			transform: translate(2px, 1px) rotate(-1deg);
		}
		80% {
			transform: translate(-1px, -1px) rotate(1deg);
		}
		90% {
			transform: translate(2px, 2px) rotate(0deg);
		}
		100% {
			transform: translate(1px, -2px) rotate(-1deg);
		}
	}
	.interactive-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9990;
	}
	.returning-banner {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 9999;
		pointer-events: auto;
		background: rgba(18, 18, 18, 0.85);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(163, 163, 163, 0.15);
		border-radius: 6px;
		padding: 10px 14px;
		font-family: monospace;
		font-size: 10px;
		color: #ffffff;
		display: flex;
		flex-direction: column;
		gap: 4px;
		letter-spacing: 0.1em;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
		animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes slide-up-fade {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.hud-overlay {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9999;
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0;
		cursor: default;
	}
	/* ── Compact pill (default) ── */
	.hud-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(10, 20, 10, 0.68);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(122, 163, 85, 0.2);
		padding: 4px 8px;
		border-radius: 20px;
		font-family: monospace;
		font-size: 8px;
		letter-spacing: 0.1em;
		color: rgba(163, 204, 126, 0.75);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		transition: opacity 0.3s;
	}
	.hud-pill :global(.accent) {
		font-weight: 700;
	}
	.hud-pill-score {
		font-weight: 700;
	}
	.hud-pill-sep {
		opacity: 0.35;
	}
	.hud-pill-disc {
		color: rgba(255, 255, 255, 0.6);
	}
	/* ── Expanded panel ── */
	.hud-expanded {
		overflow: hidden;
		max-height: 0;
		opacity: 0;
		margin-bottom: 0;
		transition:
			max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0s,
			opacity 0.3s ease 0s,
			margin-bottom 0.3s ease 0s;
		background: rgba(10, 20, 10, 0.78);
		backdrop-filter: blur(14px);
		border: 1px solid rgba(122, 163, 85, 0.22);
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
		pointer-events: none;
	}
	.hud-overlay:hover .hud-expanded {
		max-height: 80px;
		opacity: 1;
		margin-bottom: 6px;
		pointer-events: auto;
		transition:
			max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0s,
			opacity 0.25s ease 0s,
			margin-bottom 0.25s ease 0s;
	}
	.hud-metrics {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-family: monospace;
		font-size: 8px;
		letter-spacing: 0.12em;
		color: rgba(163, 204, 126, 0.65);
		padding: 8px 12px;
	}
	.metric-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		min-width: 110px;
	}
	.metric-row :global(.label) {
		opacity: 0.6;
		text-transform: uppercase;
	}
	.metric-row :global(.value) {
		font-weight: 700;
		color: rgba(255, 255, 255, 0.88);
	}
	.metric-row :global(.value.accent) {
		color: #a3cc7e;
		text-shadow: 0 0 6px rgba(122, 163, 85, 0.45);
	}
	.hud-mute-btn {
		background: none;
		border: none;
		color: rgba(163, 204, 126, 0.4);
		cursor: pointer;
		padding: 0 0 0 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
		line-height: 1;
	}
	.hud-mute-btn:hover {
		color: #a3cc7e;
	}
	.collapse-banner {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 10000;
		pointer-events: auto;
		background: rgba(20, 10, 10, 0.92);
		backdrop-filter: blur(14px);
		border: 1px solid rgba(230, 85, 85, 0.5);
		border-radius: 8px;
		padding: 28px 36px;
		max-width: 440px;
		width: calc(100% - 32px);
		text-align: center;
		font-family: monospace;
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(230, 85, 85, 0.15);
		animation: shock-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	@keyframes shock-bounce {
		from {
			opacity: 0;
			transform: translate(-50%, -40%) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
	.error-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		color: #e65555;
		font-size: 11px;
		font-weight: bold;
		letter-spacing: 0.1em;
		margin-bottom: 12px;
	}
	.error-instruction {
		color: rgba(255, 255, 255, 0.7);
		font-size: 10px;
		letter-spacing: 0.08em;
		line-height: 1.6;
		margin-bottom: 20px;
	}
	.shake-track {
		width: 100%;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 8px;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}
	.shake-fill {
		height: 100%;
		background: linear-gradient(90deg, #5a8232, #7aa355, #a3cc7e);
		transition: width 0.1s ease-out;
		box-shadow: 0 0 10px rgba(122, 163, 85, 0.7);
		border-radius: 4px;
	}
	.shake-percent {
		font-size: 9px;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.1em;
		margin-bottom: 18px;
	}
	.manual-reset-btn {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.65);
		font-family: monospace;
		font-size: 9px;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.3s;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.manual-reset-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.3);
	}
</style>
