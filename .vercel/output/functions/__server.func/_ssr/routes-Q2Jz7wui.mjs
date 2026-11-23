import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, i as Play, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Q2Jz7wui.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AudioBus = class {
	ctx = null;
	master = null;
	sfx = null;
	music = null;
	noise = null;
	drone = null;
	muted = false;
	unlock() {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		if (!this.ctx) {
			const ctx = new AC({ latencyHint: "interactive" });
			const master = ctx.createGain();
			const sfx = ctx.createGain();
			const music = ctx.createGain();
			master.gain.value = .85;
			sfx.gain.value = .9;
			music.gain.value = .55;
			sfx.connect(master);
			music.connect(master);
			master.connect(ctx.destination);
			const len = Math.floor(ctx.sampleRate * .25);
			const noise = ctx.createBuffer(1, len, ctx.sampleRate);
			const data = noise.getChannelData(0);
			for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
			this.ctx = ctx;
			this.master = master;
			this.sfx = sfx;
			this.music = music;
			this.noise = noise;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	resume() {
		if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
	}
	toggleMute() {
		this.muted = !this.muted;
		this.applyMusic();
		return this.muted;
	}
	setMuted(muted) {
		this.muted = muted;
		this.applyMusic();
	}
	applyMusic() {
		const gain = this.drone?.gain;
		const ctx = this.ctx;
		if (!gain || !ctx) return;
		const target = this.muted ? 1e-4 : .045;
		gain.gain.setTargetAtTime(target, ctx.currentTime, .05);
	}
	startDrone() {
		this.unlock();
		const ctx = this.ctx;
		const music = this.music;
		if (!ctx || !music || this.drone) return;
		const a = ctx.createOscillator();
		const b = ctx.createOscillator();
		const gain = ctx.createGain();
		a.type = "sine";
		b.type = "triangle";
		a.frequency.value = 55;
		b.frequency.value = 82.5;
		gain.gain.value = 1e-4;
		a.connect(gain);
		b.connect(gain);
		gain.connect(music);
		a.start();
		b.start();
		this.drone = {
			a,
			b,
			gain
		};
		this.applyMusic();
	}
	stopDrone() {
		const ctx = this.ctx;
		const drone = this.drone;
		if (!ctx || !drone) return;
		this.drone = null;
		const t = ctx.currentTime;
		drone.gain.gain.setTargetAtTime(1e-4, t, .05);
		drone.a.stop(t + .2);
		drone.b.stop(t + .2);
		window.setTimeout(() => {
			drone.a.disconnect();
			drone.b.disconnect();
			drone.gain.disconnect();
		}, 300);
	}
	dispose() {
		this.stopDrone();
		this.ctx?.close();
		this.ctx = null;
	}
	tone(freq, dur, type, volume, slide = 0) {
		const ctx = this.ctx;
		const sfx = this.sfx;
		if (!ctx || !sfx || this.muted) return;
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);
		if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
		gain.gain.setValueAtTime(1e-4, t);
		gain.gain.exponentialRampToValueAtTime(Math.max(2e-4, volume), t + .012);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		osc.connect(gain);
		gain.connect(sfx);
		osc.start(t);
		osc.stop(t + dur + .02);
		osc.onended = () => {
			osc.disconnect();
			gain.disconnect();
		};
	}
	burst(volume, dur = .12) {
		const ctx = this.ctx;
		const sfx = this.sfx;
		const noise = this.noise;
		if (!ctx || !sfx || !noise || this.muted) return;
		const t = ctx.currentTime;
		const src = ctx.createBufferSource();
		const gain = ctx.createGain();
		const filter = ctx.createBiquadFilter();
		src.buffer = noise;
		filter.type = "highpass";
		filter.frequency.value = 800;
		gain.gain.setValueAtTime(1e-4, t);
		gain.gain.exponentialRampToValueAtTime(volume, t + .01);
		gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(sfx);
		src.start(t);
		src.stop(t + dur + .02);
		src.onended = () => {
			src.disconnect();
			filter.disconnect();
			gain.disconnect();
		};
	}
	shoot() {
		const wobble = 1 + (Math.random() * 2 - 1) * .08;
		this.tone(720 * wobble, .045, "square", .035, -280);
	}
	hit() {
		this.tone(210 + Math.random() * 40, .06, "triangle", .06, -80);
	}
	explode() {
		this.burst(.18, .16);
		this.tone(160, .18, "sawtooth", .05, -100);
	}
	hurt() {
		this.tone(90, .28, "sine", .12, -50);
		this.burst(.12, .2);
	}
	pickup() {
		this.tone(523, .08, "triangle", .07);
		this.tone(784, .12, "sine", .06);
	}
	chime() {
		this.tone(440, .1, "triangle", .06);
		this.tone(660, .16, "sine", .05);
	}
};
var SAVE_KEY = "ember-raid-v1";
var COLORS = {
	ember: "#ff5a36",
	gold: "#f0c14a",
	cream: "#f3efe8",
	muted: "#9c958c",
	ink: "#0a0b10"
};
function loadSave() {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return {
			best: 0,
			mute: false
		};
		const parsed = JSON.parse(raw);
		return {
			best: typeof parsed.best === "number" && Number.isFinite(parsed.best) ? parsed.best : 0,
			mute: parsed.mute === true
		};
	} catch {
		return {
			best: 0,
			mute: false
		};
	}
}
function writeSave(best, mute) {
	try {
		localStorage.setItem(SAVE_KEY, JSON.stringify({
			v: 1,
			best,
			mute
		}));
	} catch {}
}
function pull(arr, i) {
	const n = arr.length - 1;
	if (i < n) arr[i] = arr[n];
	arr.pop();
}
function overlaps(ax, ay, ar, bx, by, br) {
	const dx = ax - bx;
	const dy = ay - by;
	const r = ar + br;
	return dx * dx + dy * dy <= r * r;
}
function hash(n) {
	const s = Math.sin(n * 127.1) * 43758.5453;
	return s - Math.floor(s);
}
var Game = class {
	audio = new AudioBus();
	onHud = null;
	phase = "menu";
	score = 0;
	best = 0;
	bestAtRun = 0;
	wave = 1;
	lives = 3;
	combo = 0;
	comboT = 0;
	rapidT = 0;
	wideT = 0;
	shield = false;
	newBest = false;
	banner = "";
	bannerT = 0;
	px = 240;
	py = 632;
	kick = 0;
	invuln = 0;
	cool = 0;
	flash = 0;
	trauma = 0;
	hitstop = 0;
	time = 0;
	spawnLeft = 0;
	spawnT = 0;
	clearing = false;
	clearT = 0;
	lastSave = 0;
	reduce = false;
	left = false;
	right = false;
	holdL = false;
	holdR = false;
	pointerX = null;
	enemies = [];
	shots = [];
	pickups = [];
	sparks = [];
	floaters = [];
	stars = [];
	view = {
		x: 0,
		y: 0,
		w: 1,
		h: 1
	};
	hudKey = "";
	constructor() {
		this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const save = loadSave();
		this.best = save.best;
		this.bestAtRun = save.best;
		this.audio.setMuted(save.mute);
		for (let i = 0; i < 70; i++) this.stars.push({
			x: Math.random() * 480,
			y: Math.random() * 800,
			s: .6 + Math.random() * 1.8,
			v: 18 + Math.random() * 70,
			a: .15 + Math.random() * .55
		});
	}
	setViewport(cssW, cssH) {
		let ph = cssH;
		let pw = ph * (480 / 800);
		if (pw > cssW) {
			pw = cssW;
			ph = pw * (800 / 480);
		}
		this.view = {
			x: (cssW - pw) / 2,
			y: (cssH - ph) / 2,
			w: pw,
			h: ph
		};
	}
	pointerDown(clientX, clientY, rect) {
		this.pointerX = this.toLogical(clientX, clientY, rect).x;
	}
	pointerMove(clientX, clientY, rect) {
		if (this.pointerX == null) return;
		this.pointerX = this.toLogical(clientX, clientY, rect).x;
	}
	pointerUp() {
		this.pointerX = null;
	}
	toLogical(clientX, clientY, rect) {
		const cssX = clientX - rect.left;
		const cssY = clientY - rect.top;
		const { x, y, w, h } = this.view;
		return {
			x: (cssX - x) / w * 480,
			y: (cssY - y) / h * 800
		};
	}
	setKey(code, down) {
		if (code === "ArrowLeft" || code === "KeyA") this.left = down;
		if (code === "ArrowRight" || code === "KeyD") this.right = down;
	}
	setHold(side, down) {
		if (side === "left") this.holdL = down;
		else this.holdR = down;
	}
	toggleMute() {
		const muted = this.audio.toggleMute();
		writeSave(this.best, muted);
		this.publish(true);
		return muted;
	}
	start() {
		this.audio.unlock();
		this.score = 0;
		this.wave = 1;
		this.lives = 3;
		this.combo = 0;
		this.comboT = 0;
		this.rapidT = 0;
		this.wideT = 0;
		this.shield = false;
		this.newBest = false;
		this.bestAtRun = this.best;
		this.px = 240;
		this.invuln = 0;
		this.cool = 0;
		this.flash = 0;
		this.hitstop = 0;
		this.kick = 0;
		this.clearing = false;
		this.clearT = 0;
		this.enemies.length = 0;
		this.shots.length = 0;
		this.pickups.length = 0;
		this.floaters.length = 0;
		this.phase = "playing";
		this.beginWave();
		this.audio.startDrone();
		this.audio.chime();
		this.publish(true);
	}
	togglePause() {
		if (this.phase === "playing") this.phase = "paused";
		else if (this.phase === "paused") this.phase = "playing";
		this.publish(true);
	}
	toMenu() {
		this.phase = "menu";
		this.audio.stopDrone();
		this.pointerX = null;
		this.holdL = false;
		this.holdR = false;
		writeSave(this.best, this.audio.muted);
		this.publish(true);
	}
	beginWave() {
		const boss = this.wave % 5 === 0;
		this.banner = boss ? "PRISM" : `WAVE ${this.wave}`;
		this.bannerT = 1.45;
		this.spawnLeft = boss ? 0 : Math.min(20, 4 + this.wave * 2);
		this.spawnT = .4;
		this.clearing = false;
		if (boss) this.spawnBoss();
	}
	spawnBoss() {
		const hp = 26 + this.wave * 2;
		this.enemies.push({
			x: 240,
			y: -80,
			base: 240,
			amp: 144,
			freq: .7,
			phase: 0,
			vy: 90,
			r: 48,
			hp,
			maxHp: hp,
			kind: "boss",
			shot: 1.4,
			pattern: 0,
			flash: 0
		});
	}
	pickKind() {
		const bag = ["scout", "scout"];
		if (this.wave >= 2) bag.push("weaver");
		if (this.wave >= 3) bag.push("dart", "scout");
		if (this.wave >= 4) bag.push("bruiser", "splitter");
		if (this.wave >= 6) bag.push("dart", "weaver");
		return bag[Math.random() * bag.length | 0];
	}
	spawnEnemy(kind, x = 40 + Math.random() * 400, y = -30) {
		const wave = this.wave;
		const spec = {
			scout: {
				r: 14,
				hp: 1,
				vy: 105 + wave * 7
			},
			weaver: {
				r: 16,
				hp: 2,
				vy: 78 + wave * 5
			},
			dart: {
				r: 11,
				hp: 1,
				vy: 230 + wave * 8
			},
			bruiser: {
				r: 26,
				hp: 3 + Math.floor(wave / 4),
				vy: 52 + wave * 3
			},
			splitter: {
				r: 18,
				hp: 3,
				vy: 88 + wave * 4
			}
		}[kind];
		this.enemies.push({
			x,
			y,
			base: x,
			amp: 36 + Math.random() * 48,
			freq: 1.6 + Math.random() * 1.4,
			phase: Math.random() * Math.PI * 2,
			vy: spec.vy,
			r: spec.r,
			hp: spec.hp,
			maxHp: spec.hp,
			kind,
			shot: 1.2 + Math.random(),
			pattern: 0,
			flash: 0
		});
	}
	step(dt) {
		this.time += dt;
		this.trauma = Math.max(0, this.trauma - dt * 1.7);
		if (this.bannerT > 0) this.bannerT -= dt;
		this.updateStars(dt * (this.phase === "playing" ? 1 : .3));
		if (this.hitstop > 0 && this.phase === "playing") {
			this.hitstop -= dt;
			this.updateSparks(dt);
			this.publish(false);
			return;
		}
		if (this.phase !== "playing") {
			this.updateSparks(dt * .6);
			this.publish(false);
			return;
		}
		const dir = (this.left || this.holdL ? -1 : 0) + (this.right || this.holdR ? 1 : 0);
		if (dir !== 0) this.px += dir * 460 * dt;
		else if (this.pointerX != null) {
			const dx = this.pointerX - this.px;
			const stepMax = 520 * dt;
			if (Math.abs(dx) > 1) this.px += Math.sign(dx) * Math.min(Math.abs(dx), stepMax);
		}
		this.px = Math.max(28, Math.min(452, this.px));
		this.kick = Math.max(0, this.kick - dt * 5);
		if (this.invuln > 0) this.invuln -= dt;
		if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.4);
		if (this.rapidT > 0) this.rapidT -= dt;
		if (this.wideT > 0) this.wideT -= dt;
		if (this.comboT > 0) {
			this.comboT -= dt;
			if (this.comboT <= 0) this.combo = 0;
		}
		this.cool -= dt;
		const rate = this.rapidT > 0 ? .085 : .15;
		if (this.cool <= 0) {
			this.firePlayer();
			this.cool = rate;
		}
		this.updateShots(dt);
		this.updateEnemies(dt);
		this.updatePickups(dt);
		this.updateWave(dt);
		this.updateSparks(dt);
		this.updateFloaters(dt);
		if (this.score > this.best) {
			this.best = this.score;
			if (this.time - this.lastSave > 1.2) {
				writeSave(this.best, this.audio.muted);
				this.lastSave = this.time;
			}
		}
		this.publish(false);
	}
	firePlayer() {
		const y = this.py - 16;
		const speed = -760;
		this.shots.push({
			x: this.px,
			y,
			vx: 0,
			vy: speed,
			r: 4,
			friendly: true
		});
		if (this.wideT > 0) {
			this.shots.push({
				x: this.px,
				y,
				vx: -140,
				vy: speed,
				r: 3.5,
				friendly: true
			});
			this.shots.push({
				x: this.px,
				y,
				vx: 140,
				vy: speed,
				r: 3.5,
				friendly: true
			});
		}
		this.kick = 1;
		this.audio.shoot();
		this.burst(this.px, this.py - 18, COLORS.gold, 4, 80);
	}
	updateShots(dt) {
		for (let i = this.shots.length - 1; i >= 0; i--) {
			const s = this.shots[i];
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			if (s.y < -20 || s.y > 830 || s.x < -30 || s.x > 510) {
				pull(this.shots, i);
				continue;
			}
			if (s.friendly) {
				let hit = false;
				for (let e = this.enemies.length - 1; e >= 0; e--) {
					const enemy = this.enemies[e];
					if (!overlaps(s.x, s.y, s.r, enemy.x, enemy.y, enemy.r)) continue;
					this.damageEnemy(e, 1);
					hit = true;
					break;
				}
				if (hit) pull(this.shots, i);
			} else if (this.invuln <= 0 && overlaps(s.x, s.y, s.r, this.px, this.py, 12)) {
				this.playerHit();
				pull(this.shots, i);
			}
		}
	}
	damageEnemy(index, amount) {
		const enemy = this.enemies[index];
		if (!enemy) return;
		enemy.hp -= amount;
		enemy.flash = .08;
		this.audio.hit();
		if (enemy.hp > 0) {
			if (enemy.kind === "boss") {
				this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : .12));
				this.hitstop = Math.max(this.hitstop, .025);
			}
			return;
		}
		this.killEnemy(index);
	}
	killEnemy(index) {
		const enemy = this.enemies[index];
		if (!enemy) return;
		const base = enemy.kind === "boss" ? 2e3 : enemy.kind === "bruiser" ? 320 : enemy.kind === "splitter" ? 240 : enemy.kind === "weaver" ? 160 : enemy.kind === "dart" ? 140 : 100;
		const kind = enemy.kind;
		const ex = enemy.x;
		const ey = enemy.y;
		pull(this.enemies, index);
		this.combo += 1;
		this.comboT = 2;
		const mult = 1 + Math.min(this.combo, 12) * .25;
		const gained = Math.round(base * mult);
		this.score += gained;
		this.floaters.push({
			x: ex,
			y: ey,
			text: `+${gained}`,
			life: .7,
			color: this.combo >= 3 ? COLORS.gold : COLORS.cream
		});
		this.burst(ex, ey, kind === "boss" ? COLORS.gold : COLORS.ember, kind === "boss" ? 28 : 12, 220);
		this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : kind === "boss" ? .85 : .28));
		this.hitstop = Math.max(this.hitstop, kind === "boss" ? .09 : .035);
		this.audio.explode();
		if (kind === "splitter") {
			this.spawnEnemy("scout", ex - 22, ey);
			this.spawnEnemy("scout", ex + 22, ey);
		}
		if (kind === "boss" || kind === "bruiser" || kind === "splitter" && Math.random() < .45) {
			const drop = kind === "boss" ? "shield" : Math.random() < .5 ? "rapid" : "wide";
			this.pickups.push({
				x: ex,
				y: ey,
				kind: drop,
				life: 7,
				spin: 0
			});
		}
	}
	updateEnemies(dt) {
		if (this.spawnLeft > 0 && this.enemies.length < 12) {
			this.spawnT -= dt;
			if (this.spawnT <= 0) {
				this.spawnEnemy(this.pickKind());
				this.spawnLeft -= 1;
				this.spawnT = Math.max(.28, .86 - this.wave * .035);
			}
		}
		for (let i = this.enemies.length - 1; i >= 0; i--) {
			const e = this.enemies[i];
			e.flash = Math.max(0, e.flash - dt);
			e.phase += dt * e.freq;
			if (e.kind === "boss") {
				if (e.y < 118) e.y += e.vy * dt;
				else e.y = 118;
				e.x = 240 + Math.sin(e.phase) * e.amp;
				e.shot -= dt;
				if (e.shot <= 0) {
					if (e.pattern % 2 === 0) this.fan(e.x, e.y + e.r * .4, 5, 1.15, 210);
					else this.aimed(e.x, e.y + 10, 3, .28, 240);
					e.pattern += 1;
					e.shot = Math.max(.7, 1.15 - this.wave * .02);
				}
			} else if (e.kind === "weaver") {
				e.x = e.base + Math.sin(e.phase) * e.amp;
				e.y += e.vy * dt;
			} else if (e.kind === "dart") {
				const dx = this.px - e.x;
				e.x += Math.sign(dx) * Math.min(Math.abs(dx), 70 * dt);
				e.y += e.vy * dt;
			} else {
				e.y += e.vy * dt;
				if (e.kind === "bruiser" && this.wave >= 6) {
					e.shot -= dt;
					if (e.shot <= 0) {
						this.aimed(e.x, e.y + e.r, 1, 0, 200);
						e.shot = 2.3;
					}
				}
			}
			if (e.y > 800 + e.r + 8) {
				pull(this.enemies, i);
				if (e.kind !== "boss") this.playerHit();
				continue;
			}
			if (this.invuln <= 0 && overlaps(e.x, e.y, e.r * .82, this.px, this.py, 12)) {
				this.playerHit();
				if (e.kind !== "boss") pull(this.enemies, i);
			}
		}
	}
	fan(x, y, count, spread, speed) {
		for (let i = 0; i < count; i++) {
			const t = count === 1 ? .5 : i / (count - 1);
			const a = Math.PI / 2 - spread / 2 + spread * t;
			this.shots.push({
				x,
				y,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed,
				r: 5,
				friendly: false
			});
		}
	}
	aimed(x, y, count, spread, speed) {
		const base = Math.atan2(this.py - y, this.px - x);
		for (let i = 0; i < count; i++) {
			const a = base + (count === 1 ? 0 : i - (count - 1) / 2) * spread;
			this.shots.push({
				x,
				y,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed,
				r: 5,
				friendly: false
			});
		}
	}
	updatePickups(dt) {
		for (let i = this.pickups.length - 1; i >= 0; i--) {
			const p = this.pickups[i];
			p.y += 80 * dt;
			p.life -= dt;
			p.spin += dt * 3;
			if (p.life <= 0 || p.y > 820) {
				pull(this.pickups, i);
				continue;
			}
			if (overlaps(p.x, p.y, 16, this.px, this.py, 16)) {
				if (p.kind === "rapid") this.rapidT = 8;
				if (p.kind === "wide") this.wideT = 8;
				if (p.kind === "shield") this.shield = true;
				this.audio.pickup();
				this.floaters.push({
					x: p.x,
					y: p.y - 10,
					text: p.kind === "rapid" ? "RAPID" : p.kind === "wide" ? "WIDE" : "SHIELD",
					life: .8,
					color: COLORS.gold
				});
				pull(this.pickups, i);
			}
		}
	}
	updateWave(dt) {
		if (this.phase !== "playing") return;
		if (!this.enemies.some((e) => e.kind === "boss") && this.spawnLeft <= 0 && this.enemies.length === 0) {
			if (!this.clearing) {
				this.clearing = true;
				this.clearT = 1.15;
				this.banner = "LANE CLEAR";
				this.bannerT = 1.05;
				this.audio.chime();
			} else {
				this.clearT -= dt;
				if (this.clearT <= 0) {
					this.wave += 1;
					this.beginWave();
				}
			}
		}
	}
	playerHit() {
		if (this.invuln > 0 || this.phase !== "playing") return;
		if (this.shield) {
			this.shield = false;
			this.invuln = .55;
			this.flash = this.reduce ? .1 : .25;
			this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : .35));
			this.audio.hurt();
			return;
		}
		this.lives -= 1;
		this.invuln = 1.45;
		this.flash = this.reduce ? .12 : .4;
		this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : .8));
		this.hitstop = Math.max(this.hitstop, .1);
		this.combo = 0;
		this.audio.hurt();
		this.burst(this.px, this.py, COLORS.cream, 16, 180);
		if (this.lives <= 0) {
			this.phase = "over";
			this.newBest = this.score > this.bestAtRun && this.score > 0;
			if (this.score > this.best) this.best = this.score;
			writeSave(this.best, this.audio.muted);
			this.audio.stopDrone();
			this.pointerX = null;
			this.holdL = false;
			this.holdR = false;
		}
	}
	burst(x, y, color, count, speed) {
		for (let i = 0; i < count; i++) {
			if (this.sparks.length > 260) this.sparks.shift();
			const a = Math.random() * Math.PI * 2;
			const sp = speed * (.35 + Math.random() * .65);
			this.sparks.push({
				x,
				y,
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp,
				life: .28 + Math.random() * .35,
				max: .63,
				size: 1.4 + Math.random() * 2.4,
				color
			});
		}
	}
	updateStars(dt) {
		for (const s of this.stars) {
			s.y += s.v * dt;
			if (s.y > 800) {
				s.y = 0;
				s.x = Math.random() * 480;
			}
		}
	}
	updateSparks(dt) {
		for (let i = this.sparks.length - 1; i >= 0; i--) {
			const s = this.sparks[i];
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			s.life -= dt;
			if (s.life <= 0) pull(this.sparks, i);
		}
	}
	updateFloaters(dt) {
		for (let i = this.floaters.length - 1; i >= 0; i--) {
			const f = this.floaters[i];
			f.y -= 36 * dt;
			f.life -= dt;
			if (f.life <= 0) pull(this.floaters, i);
		}
	}
	publish(force) {
		const hud = this.hud();
		const key = [
			hud.phase,
			hud.score,
			hud.best,
			hud.wave,
			hud.lives,
			hud.combo,
			hud.shield ? 1 : 0,
			Math.ceil(hud.rapid),
			Math.ceil(hud.wide),
			hud.newBest ? 1 : 0,
			hud.muted ? 1 : 0
		].join("|");
		if (!force && key === this.hudKey) return;
		this.hudKey = key;
		this.onHud?.(hud);
	}
	hud() {
		return {
			phase: this.phase,
			score: this.score,
			best: this.best,
			wave: this.wave,
			lives: this.lives,
			combo: this.combo,
			rapid: Math.max(0, this.rapidT),
			wide: Math.max(0, this.wideT),
			shield: this.shield,
			newBest: this.newBest,
			muted: this.audio.muted
		};
	}
	draw(ctx, cssW, cssH, dpr) {
		if (cssW < 2 || cssH < 2) return;
		this.setViewport(cssW, cssH);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = COLORS.ink;
		ctx.fillRect(0, 0, cssW, cssH);
		const glow = ctx.createRadialGradient(cssW / 2, cssH * .42, 10, cssW / 2, cssH * .5, cssH * .55);
		glow.addColorStop(0, "rgba(255,90,54,0.09)");
		glow.addColorStop(1, "rgba(255,90,54,0)");
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, cssW, cssH);
		const view = this.view;
		const mag = this.reduce ? 0 : this.trauma * this.trauma;
		const ox = (hash(this.time * 40) - .5) * 18 * mag;
		const oy = (hash(this.time * 40 + 3) - .5) * 12 * mag;
		ctx.save();
		ctx.beginPath();
		ctx.rect(view.x, view.y, view.w, view.h);
		ctx.clip();
		ctx.translate(view.x + ox, view.y + oy);
		ctx.scale(view.w / 480, view.h / 800);
		this.drawWorld(ctx);
		ctx.restore();
		ctx.strokeStyle = "rgba(255,90,54,0.45)";
		ctx.lineWidth = 1.5;
		ctx.strokeRect(view.x + 1, view.y + 1, view.w - 2, view.h - 2);
		if (view.x > 40) {
			ctx.save();
			ctx.translate(view.x - 26, cssH / 2);
			ctx.rotate(-Math.PI / 2);
			ctx.fillStyle = "rgba(243,239,232,0.38)";
			ctx.font = "700 13px Syne, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("EMBER RAID", 0, 0);
			ctx.restore();
		}
	}
	drawWorld(ctx) {
		const floor = ctx.createLinearGradient(0, 800 * .55, 0, 800);
		floor.addColorStop(0, "rgba(255,90,54,0)");
		floor.addColorStop(1, "rgba(255,90,54,0.16)");
		ctx.fillStyle = floor;
		ctx.fillRect(0, 800 * .55, 480, 360);
		for (const s of this.stars) {
			ctx.globalAlpha = s.a;
			ctx.fillStyle = COLORS.cream;
			ctx.fillRect(s.x, s.y, s.s, s.s);
		}
		ctx.globalAlpha = 1;
		ctx.strokeStyle = "rgba(243,239,232,0.05)";
		ctx.lineWidth = 1;
		for (let x = 40; x < 480; x += 40) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, 800);
			ctx.stroke();
		}
		for (const p of this.pickups) this.drawPickup(ctx, p);
		for (const s of this.shots) this.drawShot(ctx, s);
		for (const e of this.enemies) this.drawEnemy(ctx, e);
		for (const s of this.sparks) {
			ctx.globalAlpha = Math.max(0, s.life / s.max);
			ctx.fillStyle = s.color;
			ctx.fillRect(s.x, s.y, s.size, s.size);
		}
		ctx.globalAlpha = 1;
		this.drawPlayer(ctx);
		ctx.textAlign = "center";
		ctx.font = "700 18px Outfit, sans-serif";
		for (const f of this.floaters) {
			ctx.globalAlpha = Math.max(0, f.life / .7);
			ctx.fillStyle = f.color;
			ctx.fillText(f.text, f.x, f.y);
		}
		ctx.globalAlpha = 1;
		if (this.bannerT > 0 && this.phase === "playing") {
			ctx.globalAlpha = Math.min(1, this.bannerT * 2);
			ctx.fillStyle = COLORS.gold;
			ctx.font = "800 42px Syne, sans-serif";
			ctx.fillText(this.banner, 240, 250);
			ctx.globalAlpha = 1;
		}
		if (this.flash > 0) {
			ctx.fillStyle = `rgba(255,90,54,${this.flash * .35})`;
			ctx.fillRect(0, 0, 480, 800);
		}
	}
	drawShot(ctx, s) {
		ctx.save();
		ctx.translate(s.x, s.y);
		if (s.friendly) {
			ctx.fillStyle = COLORS.gold;
			ctx.fillRect(-2, -10, 4, 16);
			ctx.fillStyle = COLORS.cream;
			ctx.fillRect(-1.2, -12, 2.4, 6);
		} else {
			ctx.fillStyle = COLORS.ember;
			ctx.beginPath();
			ctx.arc(0, 0, s.r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}
	drawPickup(ctx, p) {
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(p.spin);
		ctx.strokeStyle = COLORS.gold;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, -12);
		ctx.lineTo(12, 0);
		ctx.lineTo(0, 12);
		ctx.lineTo(-12, 0);
		ctx.closePath();
		ctx.stroke();
		ctx.fillStyle = p.kind === "shield" ? COLORS.cream : p.kind === "wide" ? COLORS.gold : COLORS.ember;
		ctx.beginPath();
		ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
	drawEnemy(ctx, e) {
		ctx.save();
		ctx.translate(e.x, e.y);
		ctx.fillStyle = e.flash > 0 ? COLORS.cream : e.kind === "boss" || e.kind === "weaver" ? COLORS.gold : COLORS.ember;
		ctx.strokeStyle = COLORS.cream;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		if (e.kind === "scout" || e.kind === "dart") {
			ctx.moveTo(0, e.r);
			ctx.lineTo(e.r * .85, -e.r * .75);
			ctx.lineTo(-e.r * .85, -e.r * .75);
		} else if (e.kind === "weaver" || e.kind === "splitter") {
			ctx.moveTo(0, -e.r);
			ctx.lineTo(e.r, 0);
			ctx.lineTo(0, e.r);
			ctx.lineTo(-e.r, 0);
		} else if (e.kind === "bruiser") for (let i = 0; i < 6; i++) {
			const a = -Math.PI / 2 + i * Math.PI / 3;
			const px = Math.cos(a) * e.r;
			const py = Math.sin(a) * e.r;
			if (i === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		else for (let i = 0; i < 5; i++) {
			const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
			const px = Math.cos(a) * e.r;
			const py = Math.sin(a) * e.r * .82;
			if (i === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.closePath();
		ctx.fill();
		if (e.kind === "boss" || e.kind === "bruiser") ctx.stroke();
		ctx.restore();
		if (e.maxHp > 2) {
			const w = e.kind === "boss" ? 120 : 36;
			const t = Math.max(0, e.hp / e.maxHp);
			const x = e.x - w / 2;
			const y = e.y - e.r - 12;
			ctx.fillStyle = "rgba(243,239,232,0.2)";
			ctx.fillRect(x, y, w, 4);
			ctx.fillStyle = COLORS.gold;
			ctx.fillRect(x, y, w * t, 4);
		}
	}
	drawPlayer(ctx) {
		if (this.phase === "playing" && this.invuln > 0 && Math.floor(this.time * 16) % 2 === 0) return;
		ctx.save();
		ctx.translate(this.px, this.py - this.kick * 7);
		const flame = 10 + Math.sin(this.time * 28) * 4 + this.kick * 8;
		ctx.fillStyle = COLORS.gold;
		ctx.beginPath();
		ctx.moveTo(-5, 10);
		ctx.lineTo(0, 10 + flame);
		ctx.lineTo(5, 10);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = COLORS.ember;
		ctx.beginPath();
		ctx.moveTo(0, -20);
		ctx.lineTo(14, 14);
		ctx.lineTo(0, 6);
		ctx.lineTo(-14, 14);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = COLORS.cream;
		ctx.beginPath();
		ctx.arc(0, -1, 3.2, 0, Math.PI * 2);
		ctx.fill();
		if (this.shield) {
			ctx.strokeStyle = COLORS.gold;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(0, 0, 24, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.restore();
	}
	dispose() {
		this.audio.dispose();
	}
};
var EMPTY = {
	phase: "menu",
	score: 0,
	best: 0,
	wave: 1,
	lives: 3,
	combo: 0,
	rapid: 0,
	wide: 0,
	shield: false,
	newBest: false,
	muted: false
};
function formatScore(n) {
	return n.toLocaleString("en-US");
}
function GameScreen() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(EMPTY);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const game = new Game();
		gameRef.current = game;
		game.onHud = (next) => setHud(next);
		game.publish(true);
		setReady(true);
		let raf = 0;
		let last = performance.now();
		let dead = false;
		const frame = (now) => {
			if (dead) return;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const rect = canvas.getBoundingClientRect();
			game.setViewport(rect.width, rect.height);
			let remain = dt;
			while (remain > 0) {
				const step = Math.min(remain, 1 / 120);
				game.step(step);
				remain -= step;
			}
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const bw = Math.max(1, Math.round(rect.width * dpr));
			const bh = Math.max(1, Math.round(rect.height * dpr));
			if (canvas.width !== bw || canvas.height !== bh) {
				canvas.width = bw;
				canvas.height = bh;
			}
			game.draw(ctx, rect.width, rect.height, dpr);
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		const onKeyDown = (e) => {
			if (e.repeat) return;
			if (e.code === "Space" || e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown") e.preventDefault();
			game.audio.unlock();
			game.setKey(e.code, true);
			if (e.code === "KeyP") game.togglePause();
			if (e.code === "Escape" && (game.phase === "playing" || game.phase === "paused")) game.togglePause();
			if ((e.code === "Enter" || e.code === "Space") && game.phase === "menu") game.start();
			if (e.code === "Enter" && game.phase === "paused") game.togglePause();
			if (e.code === "Enter" && game.phase === "over") game.start();
		};
		const onKeyUp = (e) => game.setKey(e.code, false);
		const onVis = () => {
			if (document.visibilityState === "visible") game.audio.resume();
		};
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		document.addEventListener("visibilitychange", onVis);
		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			document.removeEventListener("visibilitychange", onVis);
			game.dispose();
			gameRef.current = null;
		};
	}, []);
	const point = (event) => {
		const canvas = canvasRef.current;
		const game = gameRef.current;
		if (!canvas || !game || game.phase !== "playing") return;
		const rect = canvas.getBoundingClientRect();
		if (event.type === "pointerdown") {
			game.audio.unlock();
			canvas.setPointerCapture(event.pointerId);
			game.pointerDown(event.clientX, event.clientY, rect);
		} else if (event.type === "pointermove") game.pointerMove(event.clientX, event.clientY, rect);
	};
	const endPoint = (event) => {
		const canvas = canvasRef.current;
		if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
		gameRef.current?.pointerUp();
	};
	const hold = (side) => (event) => {
		event.preventDefault();
		event.stopPropagation();
		const game = gameRef.current;
		if (!game) return;
		game.audio.unlock();
		if (event.type === "pointerdown") {
			event.currentTarget.setPointerCapture(event.pointerId);
			game.setHold(side, true);
		} else game.setHold(side, false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg select-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "absolute inset-0 h-full w-full touch-none",
			onPointerDown: point,
			onPointerMove: point,
			onPointerUp: endPoint,
			onPointerCancel: endPoint
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lane pointer-events-none relative flex max-w-full flex-col",
				children: [
					hud.phase === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pointer-events-auto m-auto w-full max-w-sm rounded-2xl border border-line bg-surface/90 px-6 py-7 shadow-2xl backdrop-blur-md",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-widest text-ember",
								children: "VERTICAL ARCADE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 font-display text-5xl font-extrabold leading-none text-fg",
								children: "Ember Raid"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-base leading-snug text-muted",
								children: "Steer the ember. Nothing gets through."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-5 text-sm text-muted",
								children: [
									"Best",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-gold",
										children: ready ? formatScore(hud.best) : "—"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-5 h-12 w-full rounded-xl bg-ember text-base font-semibold text-bg transition active:scale-95",
								onClick: () => gameRef.current?.start(),
								children: "Launch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-5 space-y-2 text-sm text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Drag, or A and D, to move." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Guns fire on their own." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Gold cores grant rapid, wide, or shield." })
								]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "sr-only",
						children: "Ember Raid"
					}),
					hud.phase !== "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-3xl font-extrabold leading-none tabular-nums",
								children: formatScore(hud.score)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted",
								children: ["Best ", formatScore(hud.best)]
							}),
							hud.combo >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm font-semibold text-gold",
								children: [
									"x",
									hud.combo,
									" combo"
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold tracking-widest text-muted",
									children: "WAVE"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-2xl font-extrabold leading-none",
									children: hud.wave
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex justify-end gap-1.5",
									"aria-label": `${hud.lives} lives`,
									children: Array.from({ length: 3 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `block size-2.5 rotate-45 ${i < hud.lives ? "bg-ember" : "bg-line"}` }, i))
								})
							]
						})]
					}),
					hud.phase === "playing" && (hud.rapid > 0 || hud.wide > 0 || hud.shield) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute inset-x-0 top-24 flex justify-center gap-2",
						children: [
							hud.rapid > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { label: `Rapid ${Math.ceil(hud.rapid)}` }),
							hud.wide > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { label: `Wide ${Math.ceil(hud.wide)}` }),
							hud.shield && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { label: "Shield" })
						]
					}),
					hud.phase !== "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto absolute top-4 left-1/2 flex -translate-x-1/2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: hud.muted ? "Unmute" : "Mute",
							onClick: () => gameRef.current?.toggleMute(),
							children: hud.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
						}), hud.phase !== "over" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: hud.phase === "paused" ? "Resume" : "Pause",
							onClick: () => gameRef.current?.togglePause(),
							children: hud.phase === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" })
						})]
					}),
					hud.phase === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pointer-events-auto m-auto w-full max-w-xs rounded-2xl border border-line bg-surface/90 px-6 py-7 text-center shadow-2xl backdrop-blur-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-4xl font-extrabold",
							children: "Paused"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-6 h-12 w-full rounded-xl bg-ember text-base font-semibold text-bg",
							onClick: () => gameRef.current?.togglePause(),
							children: "Resume"
						})]
					}),
					hud.phase === "over" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pointer-events-auto m-auto w-full max-w-sm rounded-2xl border border-line bg-surface/90 px-6 py-7 text-center shadow-2xl backdrop-blur-md",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-widest text-ember",
								children: "LANE LOST"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 font-display text-4xl font-extrabold",
								children: "Raid over"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 font-display text-4xl font-extrabold tabular-nums text-gold",
								children: formatScore(hud.score)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: hud.newBest ? "New best" : `Best ${formatScore(hud.best)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-6 h-12 w-full rounded-xl bg-ember text-base font-semibold text-bg",
								onClick: () => gameRef.current?.start(),
								children: "Fly again"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-3 h-11 w-full rounded-xl text-sm font-semibold text-muted",
								onClick: () => gameRef.current?.toMenu(),
								children: "Menu"
							})
						]
					}),
					hud.phase === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute inset-x-0 bottom-4 flex items-end justify-between px-4 md:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Move left",
							className: "pointer-events-auto h-16 w-20 rounded-2xl border border-line bg-surface/80 text-2xl font-semibold text-fg",
							onPointerDown: hold("left"),
							onPointerUp: hold("left"),
							onPointerCancel: hold("left"),
							children: "A"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Move right",
							className: "pointer-events-auto h-16 w-20 rounded-2xl border border-line bg-surface/80 text-2xl font-semibold text-fg",
							onPointerDown: hold("right"),
							onPointerUp: hold("right"),
							onPointerCancel: hold("right"),
							children: "D"
						})]
					})
				]
			})
		})]
	});
}
function Chip({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold text-gold",
		children: label
	});
}
function IconButton({ label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		className: "flex size-11 items-center justify-center rounded-full border border-line bg-surface/80 text-fg",
		onClick,
		children
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameScreen, {});
}
//#endregion
export { Home as component };
