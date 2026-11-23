export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private drone: { a: OscillatorNode; b: OscillatorNode; gain: GainNode } | null = null;
  muted = false;

  unlock() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      const ctx = new AC({ latencyHint: "interactive" });
      const master = ctx.createGain();
      const sfx = ctx.createGain();
      const music = ctx.createGain();
      master.gain.value = 0.85;
      sfx.gain.value = 0.9;
      music.gain.value = 0.55;
      sfx.connect(master);
      music.connect(master);
      master.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.25);
      const noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      this.ctx = ctx;
      this.master = master;
      this.sfx = sfx;
      this.music = music;
      this.noise = noise;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyMusic();
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMusic();
  }

  private applyMusic() {
    const gain = this.drone?.gain;
    const ctx = this.ctx;
    if (!gain || !ctx) return;
    const target = this.muted ? 0.0001 : 0.045;
    gain.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
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
    gain.gain.value = 0.0001;
    a.connect(gain);
    b.connect(gain);
    gain.connect(music);
    a.start();
    b.start();
    this.drone = { a, b, gain };
    this.applyMusic();
  }

  stopDrone() {
    const ctx = this.ctx;
    const drone = this.drone;
    if (!ctx || !drone) return;
    this.drone = null;
    const t = ctx.currentTime;
    drone.gain.gain.setTargetAtTime(0.0001, t, 0.05);
    drone.a.stop(t + 0.2);
    drone.b.stop(t + 0.2);
    window.setTimeout(() => {
      drone.a.disconnect();
      drone.b.disconnect();
      drone.gain.disconnect();
    }, 300);
  }

  dispose() {
    this.stopDrone();
    void this.ctx?.close();
    this.ctx = null;
  }

  private tone(freq: number, dur: number, type: OscillatorType, volume: number, slide = 0) {
    const ctx = this.ctx;
    const sfx = this.sfx;
    if (!ctx || !sfx || this.muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private burst(volume: number, dur = 0.12) {
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
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  shoot() {
    const wobble = 1 + (Math.random() * 2 - 1) * 0.08;
    this.tone(720 * wobble, 0.045, "square", 0.035, -280);
  }

  hit() {
    this.tone(210 + Math.random() * 40, 0.06, "triangle", 0.06, -80);
  }

  explode() {
    this.burst(0.18, 0.16);
    this.tone(160, 0.18, "sawtooth", 0.05, -100);
  }

  hurt() {
    this.tone(90, 0.28, "sine", 0.12, -50);
    this.burst(0.12, 0.2);
  }

  pickup() {
    this.tone(523, 0.08, "triangle", 0.07);
    this.tone(784, 0.12, "sine", 0.06);
  }

  chime() {
    this.tone(440, 0.1, "triangle", 0.06);
    this.tone(660, 0.16, "sine", 0.05);
  }
}
