/**
 * Decompressly sonic signature — START (energising) and CLOSE (calming) pairs in four styles.
 *
 * Every pair shares one five-note hook in D major: D – A – F# – B – A.
 *  START  plays it bright and rhythmic over an uplifting groove (I–V–vi–IV–ii–V → I), builds, and lands
 *         on a wide, sparkling Dadd9 chord.
 *  CLOSE  opens with the same first three notes, slowly, then resolves downwards (… E – D) over warm
 *         maj9 harmony, with a long natural fade.
 * Stereo, 44.1 kHz, synthesised from scratch (no samples, no third-party rights).
 */

const SR = 44100;
const TAU = Math.PI * 2;
export const LEN = 20;

// ---------- deterministic noise ----------
let seed = 1;
const rand = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};
const reseed = (s) => {
  seed = s >>> 0 || 1;
};

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const n = (name) => {
  const m = /^([A-G])(s?)(-?\d)$/.exec(name);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  return 12 * (Number(m[3]) + 1) + base + (m[2] ? 1 : 0);
};
const f = (name) => midi(n(name));
const len = (sec) => Math.max(1, Math.floor(sec * SR));

// ---------- DSP ----------
function biquad(type, fc, q) {
  const w = (TAU * Math.min(fc, SR * 0.45)) / SR;
  const cs = Math.cos(w);
  const sn = Math.sin(w);
  const a = sn / (2 * q);
  let b0, b1, b2;
  if (type === "lp") [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
  else if (type === "hp") [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
  else [b0, b1, b2] = [a, 0, -a];
  const a0 = 1 + a;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cs) / a0, a2: (1 - a) / a0 };
}

/** biquad with optional time-varying cutoff fn(t) */
function filt(x, type, cutoff, q = 0.707) {
  const out = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let c = biquad(type, typeof cutoff === "number" ? cutoff : cutoff(0), q);
  for (let i = 0; i < x.length; i++) {
    if (typeof cutoff !== "number" && (i & 31) === 0) c = biquad(type, Math.max(25, cutoff(i / SR)), q);
    const y = c.b0 * x[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

function noise(sec) {
  const b = new Float32Array(len(sec));
  for (let i = 0; i < b.length; i++) b[i] = rand() * 2 - 1;
  return b;
}

const expDecay = (t, rate) => Math.exp(-t * rate);

// ---------- instruments (mono voices) ----------
/** FM bell: bright with a strike, glassy decay. */
function fmBell(fr, sec, { ratio = 3.5, index = 3, decay = 1.6, bright = 1 } = {}) {
  const b = new Float32Array(len(sec));
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const idx = index * bright * expDecay(t, 3.2);
    const env = Math.min(1, t / 0.002) * (0.75 * expDecay(t, decay) + 0.25 * expDecay(t, decay * 0.35));
    b[i] = env * Math.sin(TAU * fr * t + idx * Math.sin(TAU * fr * ratio * t));
  }
  return b;
}

/** Karplus–Strong plucked string with fractional delay (harp, pizzicato, guitar-ish, upright bass). */
function pluck(fr, sec, { bright = 0.6, decay = 0.996, body = 0 } = {}) {
  const N = len(sec);
  const out = new Float32Array(N);
  const period = SR / fr;
  const size = Math.ceil(period) + 2;
  const line = new Float32Array(size);
  // excitation: lowpassed noise burst (softer attack for lower brightness)
  let lp = 0;
  for (let i = 0; i < size; i++) {
    lp += (rand() * 2 - 1 - lp) * (0.15 + bright * 0.8);
    line[i] = lp;
  }
  let w = 0;
  let prev = 0;
  for (let i = 0; i < N; i++) {
    const readPos = w - period;
    const r = ((readPos % size) + size) % size;
    const i0 = Math.floor(r);
    const frac = r - i0;
    const s = line[i0] * (1 - frac) + line[(i0 + 1) % size] * frac;
    const y = decay * (0.5 * (s + prev) * (1 - bright * 0.3) + s * bright * 0.3);
    prev = s;
    line[w % size] = y;
    w++;
    out[i] = s;
  }
  return body ? filt(out, "lp", body, 0.8) : out;
}

/** Marimba: modal bar (1 : 3.93 : 9.2) with a mallet click. */
function marimba(fr, sec, vel = 0.8) {
  const b = new Float32Array(len(sec));
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] =
      Math.sin(TAU * fr * t) * expDecay(t, 2.6) +
      0.35 * vel * Math.sin(TAU * fr * 3.93 * t) * expDecay(t, 9) +
      0.08 * vel * Math.sin(TAU * fr * 9.2 * t) * expDecay(t, 22);
    if (t < 0.006) b[i] += (rand() * 2 - 1) * 0.4 * vel * (1 - t / 0.006);
  }
  return b;
}

/** Kalimba tine. */
function kalimba(fr, sec) {
  const b = new Float32Array(len(sec));
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] = Math.min(1, t / 0.003) * (Math.sin(TAU * fr * t) * expDecay(t, 1.4) + 0.3 * Math.sin(TAU * fr * 5.93 * t) * expDecay(t, 10));
  }
  return b;
}

/** Felt piano: inharmonic partials, two-stage decay, soft hammer. */
function piano(fr, sec, vel = 0.7) {
  const b = new Float32Array(len(sec));
  const parts = [1, 0.55, 0.3, 0.18, 0.1, 0.06, 0.035];
  for (let k = 0; k < parts.length; k++) {
    const h = k + 1;
    const fk = fr * h * Math.sqrt(1 + 0.0004 * h * h);
    if (fk > SR * 0.42) break;
    const d = 0.8 + h * 0.8 + fr / 700;
    const amp = parts[k] * (k ? vel : 1);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] += amp * Math.sin(TAU * fk * t + k) * (0.6 * expDecay(t, d) + 0.4 * expDecay(t, d * 0.22));
    }
  }
  for (let i = 0; i < Math.min(b.length, len(0.008)); i++) b[i] *= i / len(0.008);
  return filt(b, "lp", 2200 + vel * 2600, 0.6);
}

/** Electric piano (Rhodes-like FM). */
function rhodes(fr, sec, vel = 0.6) {
  const b = new Float32Array(len(sec));
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const idx = 1.6 * vel * expDecay(t, 2.4);
    b[i] = Math.min(1, t / 0.005) * expDecay(t, 0.9) * Math.sin(TAU * fr * t + idx * Math.sin(TAU * fr * t)) * (1 + 0.05 * Math.sin(TAU * 4.8 * t));
  }
  return b;
}

/** Analog-style pluck synth: saw through a fast-closing filter (energetic arps). */
function synthPluck(fr, sec, { cutoff = 3800, decay = 9 } = {}) {
  const b = new Float32Array(len(sec));
  let p1 = rand(), p2 = rand();
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    p1 = (p1 + fr / SR) % 1;
    p2 = (p2 + (fr * 1.006) / SR) % 1;
    b[i] = (p1 * 2 - 1 + (p2 * 2 - 1)) * 0.5 * expDecay(t, 3.5) * Math.min(1, t / 0.002);
  }
  return filt(b, "lp", (t) => 300 + cutoff * expDecay(t, decay), 1.4);
}

/** Sustained voice with attack/release: saw stack through a lowpass (pads, strings, brass, cello). */
function sustained(freqs, sec, { a = 1, r = 2, cutoff = 1500, voices = 4, detune = 0.005, vibrato = 0, vibDelay = 0.3, brassy = 0 } = {}) {
  const N = len(sec);
  const b = new Float32Array(N);
  for (const f0 of freqs) {
    for (let v = 0; v < voices; v++) {
      const fv = f0 * (1 + (v - (voices - 1) / 2) * detune);
      let ph = rand();
      for (let i = 0; i < N; i++) {
        const t = i / SR;
        const vib = vibrato ? 1 + vibrato * Math.min(1, Math.max(0, (t - vibDelay) / 0.4)) * Math.sin(TAU * 5.4 * t + v) : 1;
        ph = (ph + (fv * vib) / SR) % 1;
        b[i] += (ph * 2 - 1) / voices;
      }
    }
  }
  const relStart = sec - r;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const env = (t < a ? 0.5 - 0.5 * Math.cos((Math.PI * t) / a) : 1) * (t > relStart ? Math.max(0, 1 - (t - relStart) / r) : 1);
    b[i] *= env / Math.max(1, freqs.length * 0.75);
  }
  return filt(b, "lp", brassy ? (t) => cutoff * (0.35 + 0.65 * Math.min(1, t / brassy)) : cutoff, brassy ? 1.1 : 0.6);
}

/** Wooden flute: sine + soft 2nd harmonic + breath, delayed vibrato. */
function flute(fr, sec, { a = 0.15, r = 0.6 } = {}) {
  const N = len(sec);
  const breath = filt(noise(sec), "bp", fr * 2, 2.5);
  const b = new Float32Array(N);
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const vib = 1 + 0.004 * Math.min(1, Math.max(0, (t - 0.35) / 0.5)) * Math.sin(TAU * 5 * t);
    ph = (ph + (fr * vib) / SR) % 1;
    const env = Math.min(1, t / a) * Math.min(1, Math.max(0, (sec - t) / r));
    b[i] = env * (Math.sin(TAU * ph) + 0.12 * Math.sin(2 * TAU * ph) + 0.07 * breath[i]);
  }
  return b;
}

// ---------- percussion ----------
function kick(vel = 1) {
  const b = new Float32Array(len(0.5));
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const fr = 46 + 90 * expDecay(t, 30);
    ph += fr / SR;
    b[i] = vel * Math.sin(TAU * ph) * expDecay(t, 7) * Math.min(1, t / 0.002);
  }
  return b;
}
function tick(vel = 1) {
  const x = filt(noise(0.06), "hp", 7500, 0.7);
  for (let i = 0; i < x.length; i++) x[i] *= vel * expDecay(i / SR, 70);
  return x;
}
function shaker(vel = 1) {
  const x = filt(noise(0.12), "bp", 6000, 1.2);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] *= vel * Math.min(1, t / 0.012) * expDecay(t, 30);
  }
  return x;
}
function ride(vel = 1, sec = 1.2) {
  const freqs = [2950, 3570, 4210, 5120, 6230, 7020];
  const N = len(sec);
  const b = new Float32Array(N);
  for (const fr of freqs) for (let i = 0; i < N; i++) b[i] += Math.sign(Math.sin((TAU * fr * i) / SR)) / freqs.length;
  const hp = filt(filt(b, "hp", 4800, 0.7), "lp", 9000, 0.7);
  const nz = filt(noise(sec), "hp", 8000, 0.7);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    hp[i] = vel * (0.5 * hp[i] + 0.25 * nz[i]) * (0.25 * expDecay(t, 22) + 0.75 * expDecay(t, 3));
  }
  return hp;
}
function timpani(fr, vel = 1) {
  const sec = 2.2;
  const N = len(sec);
  const b = new Float32Array(N);
  const nz = filt(noise(0.05), "lp", 900, 0.7);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const drop = 1 + 0.03 * expDecay(t, 12);
    p1 += (fr * drop) / SR;
    p2 += (fr * 1.5 * drop) / SR;
    b[i] = vel * (Math.sin(TAU * p1) * expDecay(t, 1.6) + 0.3 * Math.sin(TAU * p2) * expDecay(t, 3)) * Math.min(1, t / 0.004);
    if (i < nz.length) b[i] += vel * nz[i] * 0.6 * (1 - i / nz.length);
  }
  return b;
}
function droplet(fr = 900, vel = 1) {
  const b = new Float32Array(len(0.12));
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    ph += (fr * (1 + 1.4 * (1 - expDecay(t, 60)))) / SR;
    b[i] = vel * Math.sin(TAU * ph) * expDecay(t, 38) * Math.min(1, t / 0.001);
  }
  return b;
}
function chirp(base = 3200, vel = 1) {
  const b = new Float32Array(len(0.11));
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    ph += (base * (1 + 0.45 * Math.sin((Math.PI * t) / 0.11))) / SR;
    b[i] = vel * Math.sin(TAU * ph) * Math.sin((Math.PI * t) / 0.11) * (0.8 + 0.2 * Math.sin(TAU * 60 * t));
  }
  return b;
}

/** Rising filtered-noise swoosh (START opener). */
function swoosh(sec = 1.4, from = 300, to = 7000) {
  const x = filt(noise(sec), "bp", (t) => from * Math.pow(to / from, Math.min(1, t / sec)), 1.2);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR / sec;
    x[i] *= Math.pow(t, 2) * (t > 0.92 ? (1 - t) / 0.08 : 1);
  }
  return x;
}

// ---------- stereo bus ----------
function bus(sec) {
  return { L: new Float32Array(len(sec)), R: new Float32Array(len(sec)) };
}
/** equal-power pan, pan ∈ [-1, 1] */
function add(st, mono, at, gain = 1, pan = 0) {
  const a = ((pan + 1) * Math.PI) / 4;
  const gl = Math.cos(a) * gain;
  const gr = Math.sin(a) * gain;
  const o = Math.floor(at * SR);
  for (let i = 0; i < mono.length; i++) {
    const k = o + i;
    if (k < 0 || k >= st.L.length) continue;
    st.L[k] += mono[i] * gl;
    st.R[k] += mono[i] * gr;
  }
}

function reverbCh(x, { room = 0.86, damp = 0.3, spread = 0 }) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ b: new Float32Array(d + spread), i: 0, f: 0 }));
  const aps = [556, 441, 341, 225].map((d) => ({ b: new Float32Array(d + spread), i: 0 }));
  const out = new Float32Array(x.length);
  for (let s = 0; s < x.length; s++) {
    const inp = x[s] * 0.015;
    let acc = 0;
    for (const c of combs) {
      const y = c.b[c.i];
      c.f = y * (1 - damp) + c.f * damp;
      c.b[c.i] = inp + c.f * room;
      c.i = (c.i + 1) % c.b.length;
      acc += y;
    }
    for (const ap of aps) {
      const bv = ap.b[ap.i];
      const y = -acc + bv;
      ap.b[ap.i] = acc + bv * 0.5;
      ap.i = (ap.i + 1) % ap.b.length;
      acc = y;
    }
    out[s] = acc * 3;
  }
  return out;
}

/** Send a dry bus through a stereo reverb and mix it in. */
function withReverb(st, { wet = 0.3, room = 0.86, damp = 0.3 } = {}) {
  const mono = new Float32Array(st.L.length);
  for (let i = 0; i < mono.length; i++) mono[i] = (st.L[i] + st.R[i]) * 0.5;
  const wl = reverbCh(mono, { room, damp, spread: 0 });
  const wr = reverbCh(mono, { room, damp, spread: 23 });
  for (let i = 0; i < mono.length; i++) {
    st.L[i] = st.L[i] * (1 - wet * 0.5) + wl[i] * wet;
    st.R[i] = st.R[i] * (1 - wet * 0.5) + wr[i] * wet;
  }
  return st;
}

/** Glue + loudness: soft saturation, RMS target, peak ceiling, fades. */
function master(st, { rms = 0.13, fadeIn = 0.01, fadeOut = 4 } = {}) {
  let p = 0, s = 0;
  for (let i = 0; i < st.L.length; i++) {
    s += st.L[i] * st.L[i] + st.R[i] * st.R[i];
    p = Math.max(p, Math.abs(st.L[i]), Math.abs(st.R[i]));
  }
  const r = Math.sqrt(s / (2 * st.L.length)) || 1;
  let g = Math.min(rms / r, 0.98 / (p || 1) * 1.6);
  const drive = 1.25;
  const norm = Math.tanh(drive);
  const fi = len(fadeIn), fo = len(fadeOut), Nn = st.L.length;
  let peak = 0;
  for (const ch of [st.L, st.R]) {
    for (let i = 0; i < Nn; i++) {
      let v = Math.tanh(ch[i] * g * drive) / norm;
      if (i < fi) v *= i / fi;
      if (i > Nn - fo) v *= Math.pow((Nn - i) / fo, 1.6);
      ch[i] = v;
      peak = Math.max(peak, Math.abs(v));
    }
  }
  const k = peak > 0.95 ? 0.95 / peak : 1;
  if (k !== 1) for (const ch of [st.L, st.R]) for (let i = 0; i < Nn; i++) ch[i] *= k;
  return st;
}

// ---------- musical material ----------
const HOOK = ["D5", "A5", "Fs5", "B5", "A5"];
const START_BPM = 112;
const CLOSE_BPM = 66;

/** START harmony (two beats → one bar of 4 beats each): uplifting I–V–vi–IV–ii–V */
const START_CHORDS = [
  { root: "D2", tones: ["D3", "A3", "Fs4", "A4"] },
  { root: "A1", tones: ["Cs3", "A3", "E4", "A4"] },
  { root: "B1", tones: ["D3", "B3", "Fs4", "B4"] },
  { root: "G1", tones: ["D3", "B3", "G4", "B4"] },
  { root: "E2", tones: ["E3", "B3", "G4", "D5"] },
  { root: "A1", tones: ["E3", "Cs4", "G4", "A4"] },
];
const FINAL = ["D2", "A2", "D3", "A3", "E4", "Fs4", "A4", "D5"];

const CLOSE_CHORDS = [
  { root: "G1", tones: ["D3", "B3", "Fs4", "A4"] }, // Gmaj9
  { root: "Fs1", tones: ["D3", "A3", "Cs4", "E4"] }, // Dmaj9/F#
  { root: "E2", tones: ["D3", "G3", "B3", "Fs4"] }, // Em9
  { root: "D2", tones: ["A2", "Fs3", "Cs4", "E4"] }, // Dmaj9
];

/** Builds a START: energising groove with the hook in front. */
function buildStart(style) {
  reseed({ system: 101, nature: 202, jazz: 303, orchestral: 404 }[style]);
  const beat = 60 / START_BPM;
  const t0 = 1.1;
  const bar = 4 * beat;
  const st = bus(LEN + 1);
  const end = t0 + START_CHORDS.length * bar;
  const swing = style === "jazz" ? beat * 0.17 : 0;
  const eighth = (b, k) => t0 + b * bar + k * (beat / 2) + (k % 2 ? swing : 0);

  // opener
  add(st, swoosh(1.3, style === "nature" ? 500 : 250, style === "orchestral" ? 4000 : 8000), 0, style === "jazz" ? 0.18 : 0.32, 0);

  START_CHORDS.forEach((c, b) => {
    const at = t0 + b * bar;
    const lift = 0.7 + 0.3 * (b / (START_CHORDS.length - 1)); // gentle crescendo
    // harmony bed
    if (style === "system") add(st, sustained(c.tones.map(f), bar + 0.4, { a: 0.08, r: 0.35, cutoff: 1400 + b * 250, voices: 4 }), at, 0.22 * lift, 0);
    if (style === "orchestral") add(st, sustained(c.tones.map(f), bar + 0.6, { a: 0.35, r: 0.5, cutoff: 1800, voices: 5, detune: 0.004, vibrato: 0.002 }), at, 0.28 * lift, 0);
    if (style === "jazz") [0, 1.5, 2.5].forEach((bt) => c.tones.forEach((tn, k) => add(st, rhodes(f(tn), 0.9, 0.5), at + bt * beat + (bt % 1 ? swing : 0) + k * 0.006, 0.13 * lift, -0.2 + k * 0.13)));
    if (style === "nature") add(st, sustained(c.tones.slice(0, 3).map(f), bar + 0.5, { a: 0.3, r: 0.6, cutoff: 900, voices: 3 }), at, 0.12 * lift, 0);
    // bass
    if (style === "jazz") [0, 1, 2, 3].forEach((bt) => {
      const walk = [c.root, c.root, n(c.root) + 7, n(c.root) + 5][bt];
      add(st, pluck(typeof walk === "string" ? f(walk) : midi(walk), 0.9, { bright: 0.35, decay: 0.997, body: 700 }), at + bt * beat, 0.5, 0.05);
    });
    else if (style === "orchestral") add(st, pluck(f(c.root) * 2, 1.2, { bright: 0.4, decay: 0.995, body: 900 }), at, 0.5, 0.1);
    else add(st, sustained([f(c.root) * 2], bar, { a: 0.02, r: 0.3, cutoff: 500, voices: 2 }), at, style === "system" ? 0.34 : 0.22, 0);
    // pulse
    for (let k = 0; k < 8; k++) {
      const tn = c.tones[[0, 2, 1, 3, 2, 1, 3, 2][k]];
      const tt = eighth(b, k);
      if (style === "system") add(st, synthPluck(f(tn) * 2, 0.4, { cutoff: 2600 + b * 400 }), tt, 0.16 * lift, k % 2 ? 0.45 : -0.45);
      if (style === "nature") add(st, marimba(f(tn) * 2, 0.6, 0.7), tt, 0.22 * lift, k % 2 ? 0.35 : -0.35);
      if (style === "orchestral") add(st, pluck(f(tn) * 2, 0.35, { bright: 0.55, decay: 0.985 }), tt, 0.2 * lift, k % 2 ? 0.4 : -0.4);
    }
    // percussion
    if (style === "system") {
      for (let k = 0; k < 4; k++) add(st, kick(0.9), at + k * beat, 0.32 * lift, 0);
      for (let k = 0; k < 8; k++) add(st, tick(k % 2 ? 1 : 0.55), eighth(b, k), 0.05 * lift, 0.25);
    }
    if (style === "nature") {
      for (let k = 0; k < 8; k++) add(st, shaker(k % 2 ? 0.6 : 1), eighth(b, k), 0.07 * lift, -0.2);
      if (b % 2 === 0) add(st, droplet(1000 + 250 * b, 0.8), at + 3.3 * beat, 0.14, 0.5);
    }
    if (style === "jazz") {
      for (let k = 0; k < 4; k++) {
        add(st, ride(0.9, 1.0), at + k * beat, 0.04, 0.35);
        if (k % 2) add(st, ride(0.5, 0.5), at + k * beat + beat * 0.67, 0.03, 0.35);
      }
    }
    if (style === "orchestral" && b % 2 === 0) add(st, timpani(f(c.root) * 2, 0.8), at, 0.3 * lift, 0);
  });

  // the hook: bar 1 and again (lifted) in bar 3 & 5
  const hookRhythm = [0, 0.5, 1, 1.75, 2.5];
  const playHook = (bAt, octave, gain, final = false) =>
    HOOK.forEach((tn, k) => {
      const tt = bAt + hookRhythm[k] * beat + (style === "jazz" && k % 2 ? swing : 0);
      const fr = f(tn) * octave * (final && k === 4 ? 2 ** (5 / 12) : 1); // last repeat ends on D6
      const durN = k === 4 ? 2.2 : 0.7;
      if (style === "system") add(st, fmBell(fr, durN + 1.2, { ratio: 3.5, index: 2.6, decay: 2.2 }), tt, gain, 0.1);
      if (style === "nature") {
        add(st, marimba(fr, durN + 1, 0.9), tt, gain * 1.05, 0.15);
        add(st, kalimba(fr * 2, 1.2), tt, gain * 0.25, -0.3);
      }
      if (style === "jazz") add(st, piano(fr, durN + 1.5, 0.8), tt, gain * 1.2, 0.15);
      if (style === "orchestral") {
        add(st, sustained([fr], durN + 0.25, { a: 0.045, r: 0.22, cutoff: 2600, voices: 3, detune: 0.003, vibrato: 0.003, vibDelay: 0.25, brassy: 0.09 }), tt, gain * 1.1, 0.1);
        add(st, fmBell(fr * 2, 1.2, { ratio: 3.5, index: 1.2, decay: 3 }), tt, gain * 0.18, -0.4);
      }
    });
  playHook(t0, 1, 0.42);
  playHook(t0 + 2 * bar, 1, 0.44);
  playHook(t0 + 4 * bar, 1, 0.48, true);

  // landing: wide, bright final chord + sparkle
  const land = end;
  if (style === "system") add(st, sustained(FINAL.map(f), LEN - land, { a: 0.03, r: 5, cutoff: 3200, voices: 5, detune: 0.007 }), land, 0.3, 0);
  if (style === "orchestral") add(st, sustained(FINAL.map(f), LEN - land, { a: 0.25, r: 5, cutoff: 2400, voices: 6, detune: 0.004, vibrato: 0.002 }), land, 0.36, 0);
  if (style === "jazz") FINAL.slice(2).forEach((tn, k) => add(st, piano(f(tn), 6, 0.6), land + k * 0.035, 0.22, -0.3 + k * 0.1));
  if (style === "nature") FINAL.slice(2).forEach((tn, k) => add(st, marimba(f(tn), 3, 0.6), land + k * 0.05, 0.18, -0.4 + k * 0.13));
  add(st, sustained([f("D2"), f("D3")], 6, { a: 0.02, r: 4, cutoff: 400, voices: 2 }), land, 0.3, 0);
  if (style === "system") add(st, kick(1), land, 0.45, 0);
  if (style === "orchestral") add(st, timpani(f("D2") * 2, 1), land, 0.42, 0);
  if (style === "jazz") add(st, ride(1, 3), land, 0.12, 0.35);
  ["D6", "Fs6", "A6", "D7"].forEach((tn, k) => {
    const fr = f(tn);
    const tt = land + 0.12 + k * 0.09;
    if (style === "nature") add(st, chirp(2600 + k * 500, 0.7), tt + 0.4, 0.06, k % 2 ? 0.6 : -0.6);
    add(st, style === "jazz" ? piano(fr / 2, 2, 0.5) : fmBell(fr / (style === "nature" ? 2 : 1), 2.5, { ratio: 3.5, index: 1.4, decay: 2.4 }), tt, 0.1, k % 2 ? 0.5 : -0.5);
  });
  if (style === "nature") [0.6, 1.4, 2.6].forEach((dt, k) => add(st, chirp(3000 + k * 400, 0.6), t0 + dt, 0.04, k % 2 ? 0.7 : -0.7));

  withReverb(st, { wet: style === "orchestral" ? 0.42 : style === "jazz" ? 0.25 : 0.32, room: 0.86 });
  const out = { L: st.L.subarray(0, len(LEN)), R: st.R.subarray(0, len(LEN)) };
  return master(out, { rms: 0.15, fadeIn: 0.005, fadeOut: 4 });
}

/** Builds a CLOSE: same opening notes, slow, resolving down, long calm fade. */
function buildClose(style) {
  reseed({ system: 111, nature: 222, jazz: 333, orchestral: 444 }[style]);
  const beat = 60 / CLOSE_BPM;
  const t0 = 0.9;
  const bar = 4 * beat;
  const st = bus(LEN + 2);

  // ambient bed
  if (style === "nature") {
    const waves = filt(noise(LEN), "lp", (t) => 380 + 700 * Math.pow(0.5 - 0.5 * Math.cos((TAU * t) / 7), 2), 0.6);
    for (let i = 0; i < waves.length; i++) waves[i] *= (0.3 + 0.7 * Math.pow(0.5 - 0.5 * Math.cos((TAU * (i / SR)) / 7), 1.5)) * Math.min(1, i / SR / 2);
    add(st, waves, 0, 0.14, -0.3);
    add(st, waves.slice().reverse(), 0, 0.1, 0.35);
  }
  if (style === "jazz") {
    const brush = filt(filt(noise(LEN), "bp", 2400, 0.6), "lp", 5000, 0.7);
    for (let i = 0; i < brush.length; i++) brush[i] *= (0.7 + 0.3 * Math.sin((TAU * (i / SR)) / (beat * 2))) * Math.min(1, i / SR / 2);
    add(st, brush, 0, 0.006, 0.3);
  }
  if (style === "system") {
    const air = filt(noise(LEN), "bp", (t) => 2600 - t * 90, 0.9);
    add(st, air, 0, 0.005, 0);
  }

  CLOSE_CHORDS.forEach((c, b) => {
    const at = t0 + b * bar;
    const lastBar = b === CLOSE_CHORDS.length - 1;
    const dur = lastBar ? LEN - at : bar + 1.2;
    const soften = 1 - b * 0.08;
    if (style === "system") add(st, sustained(c.tones.map(f), dur, { a: 1.2, r: lastBar ? 6 : 1.4, cutoff: (lastBar ? 900 : 1400) - b * 120, voices: 4, detune: 0.006 }), at - 0.4, 0.26 * soften, 0);
    if (style === "orchestral") add(st, sustained(c.tones.map(f), dur, { a: 1.6, r: lastBar ? 7 : 1.6, cutoff: 1500 - b * 120, voices: 6, detune: 0.004, vibrato: 0.0025 }), at - 0.6, 0.32 * soften, 0);
    if (style === "jazz") c.tones.forEach((tn, k) => add(st, rhodes(f(tn), lastBar ? 8 : bar + 1, 0.4), at + k * 0.05, 0.13 * soften, -0.25 + k * 0.16));
    if (style === "nature") add(st, sustained(c.tones.slice(0, 3).map(f), dur, { a: 1.5, r: lastBar ? 6 : 1.5, cutoff: 700, voices: 3 }), at - 0.4, 0.13 * soften, 0);
    // bass: long, soft
    if (style === "jazz") add(st, pluck(f(c.root) * 2, bar + 1, { bright: 0.25, decay: 0.9985, body: 600 }), at, 0.5, 0);
    else add(st, sustained([f(c.root) * 2], dur, { a: 0.8, r: lastBar ? 6 : 1.2, cutoff: 380, voices: 2 }), at - 0.2, 0.28, 0);
    // harp / kalimba arpeggio, descending, slow
    const arp = [...c.tones].reverse();
    if (style === "orchestral" || style === "nature" || style === "system")
      arp.forEach((tn, k) => {
        const fr = f(tn) * 2;
        const tt = at + beat * 2 + k * beat * 0.5;
        if (style === "orchestral") add(st, pluck(fr, 3, { bright: 0.25, decay: 0.9975, body: 3000 }), tt, 0.16, -0.5 + k * 0.3);
        if (style === "nature") add(st, kalimba(fr, 3), tt, 0.12, -0.5 + k * 0.3);
        if (style === "system") add(st, fmBell(fr, 3, { ratio: 2, index: 0.8, decay: 1.4 }), tt, 0.07, -0.5 + k * 0.3);
      });
  });

  // the hook, slow: same first three notes, then resolves E → D
  const notes = ["D5", "A5", "Fs5", "E5", "D5"];
  const rhythm = [0, 1, 2, 3.5, 4.5]; // beats
  const durs = [1.2, 1.2, 1.6, 1.1, 4.5];
  const playHook = (start, octave, gain) =>
    notes.forEach((tn, k) => {
      const fr = f(tn) * octave;
      const tt = start + rhythm[k] * beat;
      const d = durs[k] * beat;
      if (style === "system") add(st, fmBell(fr, d + 2.5, { ratio: 2, index: 1.1, decay: 1.1 }), tt, gain, 0.1);
      if (style === "nature") add(st, flute(fr, d + 0.6, { a: 0.18, r: 0.7 }), tt, gain * 0.9, 0.1);
      if (style === "jazz") add(st, piano(fr, d + 3, 0.5), tt + (k ? 0.04 * Math.sin(k * 3) : 0), gain * 1.2, 0.1);
      if (style === "orchestral") add(st, sustained([fr], d + 0.6, { a: 0.28, r: 0.6, cutoff: 1500, voices: 3, detune: 0.002, vibrato: 0.004, vibDelay: 0.3 }), tt, gain * 1.1, 0.1);
    });
  playHook(t0 + 0.2, 1, 0.34);
  // answer: an octave lower, softer
  playHook(t0 + 2 * bar + 0.2, 0.5, 0.22);

  // final chime on the tonic
  const chimeAt = t0 + 3 * bar + beat * 2.5;
  add(st, style === "jazz" ? piano(f("D6"), 6, 0.35) : fmBell(f("D6"), 6, { ratio: 3.5, index: 0.9, decay: 0.9 }), chimeAt, 0.12, 0.3);
  if (style === "nature") [0, 0.25, 0.5].forEach((dt) => add(st, droplet(700, 0.4), chimeAt + 1.5 + dt * 2, 0.06, -0.4));

  withReverb(st, { wet: style === "jazz" ? 0.34 : 0.48, room: 0.9, damp: 0.35 });
  const out = { L: st.L.subarray(0, len(LEN)), R: st.R.subarray(0, len(LEN)) };
  return master(out, { rms: 0.11, fadeIn: 0.8, fadeOut: 6.5 });
}

export const STYLES = ["system", "nature", "jazz", "orchestral"];
export function makePair(style) {
  return { start: buildStart(style), close: buildClose(style) };
}
export { SR };
