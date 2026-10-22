import { getState } from "./store";

// Slot machine sound effects, synthesized with the Web Audio API: no audio files to download.
// Sounds only play after the visitor has interacted with the page (browser autoplay rules)
// and when the sound setting is on.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function audio(): { c: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined" || !getState().sound) return null;
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (activation && !activation.hasBeenActive) return null;
  if (!ctx || !master) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { c: ctx, out: master };
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, Math.round(c.sampleRate * 0.2), c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function click(c: AudioContext, out: AudioNode, at: number, gain = 0.2, freq = 2600, dur = 0.012) {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.4;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(g).connect(out);
  src.start(at);
  src.stop(at + dur + 0.02);
}

function tone(
  c: AudioContext,
  out: AudioNode,
  at: number,
  freq: number,
  { to, dur = 0.16, type = "sine", gain = 0.18 }: { to?: number; dur?: number; type?: OscillatorType; gain?: number } = {},
) {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.03);
}

function thunk(c: AudioContext, out: AudioNode, at: number, gain = 0.22) {
  tone(c, out, at, 190, { to: 70, dur: 0.1, gain });
  click(c, out, at, gain * 0.8, 1300, 0.025);
}

function arpeggio(notes: number[], step: number, opts: { type?: OscillatorType; gain?: number; dur?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.c.currentTime + 0.01;
  notes.forEach((f, i) => tone(a.c, a.out, t + i * step, f, { type: "triangle", gain: 0.13, dur: 0.22, ...opts }));
}

export const sfx = {
  /** The ratchet of the lever going down and the clunk at the bottom. */
  lever() {
    const a = audio();
    if (!a) return;
    const t = a.c.currentTime + 0.01;
    for (let i = 0; i < 4; i++) click(a.c, a.out, t + i * 0.045, 0.16, 3200 - i * 300);
    thunk(a.c, a.out, t + 0.24, 0.26);
  },

  /** Ticks while the reels spin and a thunk as each reel stops. Returns a function that silences it. */
  spin(stopsMs: number[]): () => void {
    const a = audio();
    if (!a || !stopsMs.length) return () => {};
    const bus = a.c.createGain();
    bus.connect(a.out);
    const t0 = a.c.currentTime + 0.02;
    const end = Math.max(...stopsMs) / 1000;
    for (let t = 0.06; t < end - 0.04; t += 0.05 + 0.09 * (t / end) ** 2) click(a.c, bus, t0 + t, 0.05, 3400, 0.008);
    for (const ms of stopsMs) thunk(a.c, bus, t0 + ms / 1000, 0.16);
    return () => {
      try {
        bus.disconnect();
      } catch {
        // already disconnected
      }
    };
  },

  win() {
    arpeggio([784, 988, 1175, 1568], 0.07);
  },

  almost() {
    arpeggio([659, 784], 0.09, { gain: 0.11 });
  },

  lose() {
    const a = audio();
    if (!a) return;
    const t = a.c.currentTime + 0.01;
    tone(a.c, a.out, t, 233, { type: "square", gain: 0.05, dur: 0.14 });
    tone(a.c, a.out, t + 0.15, 175, { type: "square", gain: 0.05, dur: 0.24 });
  },

  /** Rule mastered: a longer run up and falling coins. */
  jackpot() {
    const a = audio();
    if (!a) return;
    arpeggio([523, 659, 784, 1047, 1319, 1568, 2093], 0.06, { gain: 0.11, dur: 0.26 });
    const t = a.c.currentTime + 0.45;
    for (let i = 0; i < 9; i++)
      tone(a.c, a.out, t + i * 0.07 + Math.random() * 0.03, 2400 + Math.random() * 1400, { dur: 0.08, gain: 0.05 });
  },
};
