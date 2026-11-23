import { AudioBus } from "./audio";

export const W = 480;
export const H = 800;

const SAVE_KEY = "ember-raid-v1";

export type Phase = "menu" | "playing" | "paused" | "over";

export type Hud = {
  phase: Phase;
  score: number;
  best: number;
  wave: number;
  lives: number;
  combo: number;
  rapid: number;
  wide: number;
  shield: boolean;
  newBest: boolean;
  muted: boolean;
};

type Kind = "scout" | "weaver" | "dart" | "bruiser" | "splitter" | "boss";

type Enemy = {
  x: number;
  y: number;
  base: number;
  amp: number;
  freq: number;
  phase: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  kind: Kind;
  shot: number;
  pattern: number;
  flash: number;
};

type Shot = { x: number; y: number; vx: number; vy: number; r: number; friendly: boolean };

type PickupKind = "rapid" | "wide" | "shield";

type Pickup = { x: number; y: number; kind: PickupKind; life: number; spin: number };

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };

type Floater = { x: number; y: number; text: string; life: number; color: string };

type Star = { x: number; y: number; s: number; v: number; a: number };

type View = { x: number; y: number; w: number; h: number };

const COLORS = {
  ember: "#ff5a36",
  gold: "#f0c14a",
  cream: "#f3efe8",
  muted: "#9c958c",
  ink: "#0a0b10",
};

function loadSave(): { best: number; mute: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { best: 0, mute: false };
    const parsed = JSON.parse(raw) as { best?: unknown; mute?: unknown };
    return {
      best: typeof parsed.best === "number" && Number.isFinite(parsed.best) ? parsed.best : 0,
      mute: parsed.mute === true,
    };
  } catch {
    return { best: 0, mute: false };
  }
}

function writeSave(best: number, mute: boolean) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, best, mute }));
  } catch {
    /* ignore quota */
  }
}

function pull<T>(arr: T[], i: number) {
  const n = arr.length - 1;
  if (i < n) arr[i] = arr[n]!;
  arr.pop();
}

function overlaps(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export class Game {
  readonly audio = new AudioBus();
  onHud: ((hud: Hud) => void) | null = null;

  phase: Phase = "menu";
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

  private px = W / 2;
  private py = H - 168;
  private kick = 0;
  private invuln = 0;
  private cool = 0;
  private flash = 0;
  private trauma = 0;
  private hitstop = 0;
  private time = 0;
  private spawnLeft = 0;
  private spawnT = 0;
  private clearing = false;
  private clearT = 0;
  private lastSave = 0;
  private reduce = false;

  private left = false;
  private right = false;
  private holdL = false;
  private holdR = false;
  private pointerX: number | null = null;

  private enemies: Enemy[] = [];
  private shots: Shot[] = [];
  private pickups: Pickup[] = [];
  private sparks: Spark[] = [];
  private floaters: Floater[] = [];
  private stars: Star[] = [];
  private view: View = { x: 0, y: 0, w: 1, h: 1 };
  private hudKey = "";

  constructor() {
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const save = loadSave();
    this.best = save.best;
    this.bestAtRun = save.best;
    this.audio.setMuted(save.mute);
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        s: 0.6 + Math.random() * 1.8,
        v: 18 + Math.random() * 70,
        a: 0.15 + Math.random() * 0.55,
      });
    }
  }

  setViewport(cssW: number, cssH: number) {
    let ph = cssH;
    let pw = ph * (W / H);
    if (pw > cssW) {
      pw = cssW;
      ph = pw * (H / W);
    }
    this.view = { x: (cssW - pw) / 2, y: (cssH - ph) / 2, w: pw, h: ph };
  }

  pointerDown(clientX: number, clientY: number, rect: DOMRect) {
    this.pointerX = this.toLogical(clientX, clientY, rect).x;
  }

  pointerMove(clientX: number, clientY: number, rect: DOMRect) {
    if (this.pointerX == null) return;
    this.pointerX = this.toLogical(clientX, clientY, rect).x;
  }

  pointerUp() {
    this.pointerX = null;
  }

  private toLogical(clientX: number, clientY: number, rect: DOMRect) {
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;
    const { x, y, w, h } = this.view;
    return { x: ((cssX - x) / w) * W, y: ((cssY - y) / h) * H };
  }

  setKey(code: string, down: boolean) {
    if (code === "ArrowLeft" || code === "KeyA") this.left = down;
    if (code === "ArrowRight" || code === "KeyD") this.right = down;
  }

  setHold(side: "left" | "right", down: boolean) {
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
    this.px = W / 2;
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

  private beginWave() {
    const boss = this.wave % 5 === 0;
    this.banner = boss ? "PRISM" : `WAVE ${this.wave}`;
    this.bannerT = 1.45;
    this.spawnLeft = boss ? 0 : Math.min(20, 4 + this.wave * 2);
    this.spawnT = 0.4;
    this.clearing = false;
    if (boss) this.spawnBoss();
  }

  private spawnBoss() {
    const hp = 26 + this.wave * 2;
    this.enemies.push({
      x: W / 2,
      y: -80,
      base: W / 2,
      amp: W * 0.3,
      freq: 0.7,
      phase: 0,
      vy: 90,
      r: 48,
      hp,
      maxHp: hp,
      kind: "boss",
      shot: 1.4,
      pattern: 0,
      flash: 0,
    });
  }

  private pickKind(): Kind {
    const bag: Kind[] = ["scout", "scout"];
    if (this.wave >= 2) bag.push("weaver");
    if (this.wave >= 3) bag.push("dart", "scout");
    if (this.wave >= 4) bag.push("bruiser", "splitter");
    if (this.wave >= 6) bag.push("dart", "weaver");
    return bag[(Math.random() * bag.length) | 0]!;
  }

  private spawnEnemy(kind: Kind, x = 40 + Math.random() * (W - 80), y = -30) {
    const wave = this.wave;
    const specs: Record<Exclude<Kind, "boss">, { r: number; hp: number; vy: number }> = {
      scout: { r: 14, hp: 1, vy: 105 + wave * 7 },
      weaver: { r: 16, hp: 2, vy: 78 + wave * 5 },
      dart: { r: 11, hp: 1, vy: 230 + wave * 8 },
      bruiser: { r: 26, hp: 3 + Math.floor(wave / 4), vy: 52 + wave * 3 },
      splitter: { r: 18, hp: 3, vy: 88 + wave * 4 },
    };
    const spec = specs[kind as Exclude<Kind, "boss">];
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
      flash: 0,
    });
  }

  step(dt: number) {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    if (this.bannerT > 0) this.bannerT -= dt;
    this.updateStars(dt * (this.phase === "playing" ? 1 : 0.3));
    if (this.hitstop > 0 && this.phase === "playing") {
      this.hitstop -= dt;
      this.updateSparks(dt);
      this.publish(false);
      return;
    }
    if (this.phase !== "playing") {
      this.updateSparks(dt * 0.6);
      this.publish(false);
      return;
    }

    const dir = (this.left || this.holdL ? -1 : 0) + (this.right || this.holdR ? 1 : 0);
    if (dir !== 0) {
      this.px += dir * 460 * dt;
    } else if (this.pointerX != null) {
      const dx = this.pointerX - this.px;
      const stepMax = 520 * dt;
      if (Math.abs(dx) > 1) this.px += Math.sign(dx) * Math.min(Math.abs(dx), stepMax);
    }
    this.px = Math.max(28, Math.min(W - 28, this.px));
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
    const rate = this.rapidT > 0 ? 0.085 : 0.15;
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

  private firePlayer() {
    const y = this.py - 16;
    const speed = -760;
    this.shots.push({ x: this.px, y, vx: 0, vy: speed, r: 4, friendly: true });
    if (this.wideT > 0) {
      this.shots.push({ x: this.px, y, vx: -140, vy: speed, r: 3.5, friendly: true });
      this.shots.push({ x: this.px, y, vx: 140, vy: speed, r: 3.5, friendly: true });
    }
    this.kick = 1;
    this.audio.shoot();
    this.burst(this.px, this.py - 18, COLORS.gold, 4, 80);
  }

  private updateShots(dt: number) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]!;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.y > H + 30 || s.x < -30 || s.x > W + 30) {
        pull(this.shots, i);
        continue;
      }
      if (s.friendly) {
        let hit = false;
        for (let e = this.enemies.length - 1; e >= 0; e--) {
          const enemy = this.enemies[e]!;
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

  private damageEnemy(index: number, amount: number) {
    const enemy = this.enemies[index];
    if (!enemy) return;
    enemy.hp -= amount;
    enemy.flash = 0.08;
    this.audio.hit();
    if (enemy.hp > 0) {
      if (enemy.kind === "boss") {
        this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : 0.12));
        this.hitstop = Math.max(this.hitstop, 0.025);
      }
      return;
    }
    this.killEnemy(index);
  }

  private killEnemy(index: number) {
    const enemy = this.enemies[index];
    if (!enemy) return;
    const base =
      enemy.kind === "boss"
        ? 2000
        : enemy.kind === "bruiser"
          ? 320
          : enemy.kind === "splitter"
            ? 240
            : enemy.kind === "weaver"
              ? 160
              : enemy.kind === "dart"
                ? 140
                : 100;
    const kind = enemy.kind;
    const ex = enemy.x;
    const ey = enemy.y;
    pull(this.enemies, index);
    this.combo += 1;
    this.comboT = 2;
    const mult = 1 + Math.min(this.combo, 12) * 0.25;
    const gained = Math.round(base * mult);
    this.score += gained;
    this.floaters.push({
      x: ex,
      y: ey,
      text: `+${gained}`,
      life: 0.7,
      color: this.combo >= 3 ? COLORS.gold : COLORS.cream,
    });
    this.burst(ex, ey, kind === "boss" ? COLORS.gold : COLORS.ember, kind === "boss" ? 28 : 12, 220);
    this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : kind === "boss" ? 0.85 : 0.28));
    this.hitstop = Math.max(this.hitstop, kind === "boss" ? 0.09 : 0.035);
    this.audio.explode();
    if (kind === "splitter") {
      this.spawnEnemy("scout", ex - 22, ey);
      this.spawnEnemy("scout", ex + 22, ey);
    }
    if (kind === "boss" || kind === "bruiser" || (kind === "splitter" && Math.random() < 0.45)) {
      const drop: PickupKind = kind === "boss" ? "shield" : Math.random() < 0.5 ? "rapid" : "wide";
      this.pickups.push({ x: ex, y: ey, kind: drop, life: 7, spin: 0 });
    }
  }

  private updateEnemies(dt: number) {
    if (this.spawnLeft > 0 && this.enemies.length < 12) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnEnemy(this.pickKind());
        this.spawnLeft -= 1;
        this.spawnT = Math.max(0.28, 0.86 - this.wave * 0.035);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      e.flash = Math.max(0, e.flash - dt);
      e.phase += dt * e.freq;
      if (e.kind === "boss") {
        if (e.y < 118) e.y += e.vy * dt;
        else e.y = 118;
        e.x = W / 2 + Math.sin(e.phase) * e.amp;
        e.shot -= dt;
        if (e.shot <= 0) {
          if (e.pattern % 2 === 0) this.fan(e.x, e.y + e.r * 0.4, 5, 1.15, 210);
          else this.aimed(e.x, e.y + 10, 3, 0.28, 240);
          e.pattern += 1;
          e.shot = Math.max(0.7, 1.15 - this.wave * 0.02);
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

      if (e.y > H + e.r + 8) {
        pull(this.enemies, i);
        if (e.kind !== "boss") this.playerHit();
        continue;
      }
      if (this.invuln <= 0 && overlaps(e.x, e.y, e.r * 0.82, this.px, this.py, 12)) {
        this.playerHit();
        if (e.kind !== "boss") pull(this.enemies, i);
      }
    }
  }

  private fan(x: number, y: number, count: number, spread: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const a = Math.PI / 2 - spread / 2 + spread * t;
      this.shots.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 5,
        friendly: false,
      });
    }
  }

  private aimed(x: number, y: number, count: number, spread: number, speed: number) {
    const base = Math.atan2(this.py - y, this.px - x);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i - (count - 1) / 2;
      const a = base + t * spread;
      this.shots.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 5,
        friendly: false,
      });
    }
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]!;
      p.y += 80 * dt;
      p.life -= dt;
      p.spin += dt * 3;
      if (p.life <= 0 || p.y > H + 20) {
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
          life: 0.8,
          color: COLORS.gold,
        });
        pull(this.pickups, i);
      }
    }
  }

  private updateWave(dt: number) {
    if (this.phase !== "playing") return;
    const bossAlive = this.enemies.some((e) => e.kind === "boss");
    if (!bossAlive && this.spawnLeft <= 0 && this.enemies.length === 0) {
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

  private playerHit() {
    if (this.invuln > 0 || this.phase !== "playing") return;
    if (this.shield) {
      this.shield = false;
      this.invuln = 0.55;
      this.flash = this.reduce ? 0.1 : 0.25;
      this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : 0.35));
      this.audio.hurt();
      return;
    }
    this.lives -= 1;
    this.invuln = 1.45;
    this.flash = this.reduce ? 0.12 : 0.4;
    this.trauma = Math.min(1, this.trauma + (this.reduce ? 0 : 0.8));
    this.hitstop = Math.max(this.hitstop, 0.1);
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

  private burst(x: number, y: number, color: string, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length > 260) this.sparks.shift();
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.35 + Math.random() * 0.65);
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.28 + Math.random() * 0.35,
        max: 0.63,
        size: 1.4 + Math.random() * 2.4,
        color,
      });
    }
  }

  private updateStars(dt: number) {
    for (const s of this.stars) {
      s.y += s.v * dt;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }
  }

  private updateSparks(dt: number) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) pull(this.sparks, i);
    }
  }

  private updateFloaters(dt: number) {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i]!;
      f.y -= 36 * dt;
      f.life -= dt;
      if (f.life <= 0) pull(this.floaters, i);
    }
  }

  publish(force: boolean) {
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
      hud.muted ? 1 : 0,
    ].join("|");
    if (!force && key === this.hudKey) return;
    this.hudKey = key;
    this.onHud?.(hud);
  }

  hud(): Hud {
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
      muted: this.audio.muted,
    };
  }

  draw(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) {
    if (cssW < 2 || cssH < 2) return;
    this.setViewport(cssW, cssH);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, cssW, cssH);

    const glow = ctx.createRadialGradient(cssW / 2, cssH * 0.42, 10, cssW / 2, cssH * 0.5, cssH * 0.55);
    glow.addColorStop(0, "rgba(255,90,54,0.09)");
    glow.addColorStop(1, "rgba(255,90,54,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, cssW, cssH);

    const view = this.view;
    const mag = this.reduce ? 0 : this.trauma * this.trauma;
    const ox = (hash(this.time * 40) - 0.5) * 18 * mag;
    const oy = (hash(this.time * 40 + 3) - 0.5) * 12 * mag;

    ctx.save();
    ctx.beginPath();
    ctx.rect(view.x, view.y, view.w, view.h);
    ctx.clip();
    ctx.translate(view.x + ox, view.y + oy);
    ctx.scale(view.w / W, view.h / H);
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

  private drawWorld(ctx: CanvasRenderingContext2D) {
    const floor = ctx.createLinearGradient(0, H * 0.55, 0, H);
    floor.addColorStop(0, "rgba(255,90,54,0)");
    floor.addColorStop(1, "rgba(255,90,54,0.16)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    for (const s of this.stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(243,239,232,0.05)";
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
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
      ctx.globalAlpha = Math.max(0, f.life / 0.7);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    if (this.bannerT > 0 && this.phase === "playing") {
      ctx.globalAlpha = Math.min(1, this.bannerT * 2);
      ctx.fillStyle = COLORS.gold;
      ctx.font = "800 42px Syne, sans-serif";
      ctx.fillText(this.banner, W / 2, 250);
      ctx.globalAlpha = 1;
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,90,54,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private drawShot(ctx: CanvasRenderingContext2D, s: Shot) {
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

  private drawPickup(ctx: CanvasRenderingContext2D, p: Pickup) {
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

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = e.flash > 0 ? COLORS.cream : e.kind === "boss" || e.kind === "weaver" ? COLORS.gold : COLORS.ember;
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (e.kind === "scout" || e.kind === "dart") {
      ctx.moveTo(0, e.r);
      ctx.lineTo(e.r * 0.85, -e.r * 0.75);
      ctx.lineTo(-e.r * 0.85, -e.r * 0.75);
    } else if (e.kind === "weaver" || e.kind === "splitter") {
      ctx.moveTo(0, -e.r);
      ctx.lineTo(e.r, 0);
      ctx.lineTo(0, e.r);
      ctx.lineTo(-e.r, 0);
    } else if (e.kind === "bruiser") {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const px = Math.cos(a) * e.r;
        const py = Math.sin(a) * e.r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const px = Math.cos(a) * e.r;
        const py = Math.sin(a) * e.r * 0.82;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
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

  private drawPlayer(ctx: CanvasRenderingContext2D) {
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
}
