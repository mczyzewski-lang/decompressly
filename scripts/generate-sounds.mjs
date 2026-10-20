#!/usr/bin/env node
/**
 * Procedurally synthesises the bundled (offline, license-free) sounds:
 *  - START/CLOSE pairs for four styles (20 s each, shared three-note motif per style),
 *  - four subtle, seamlessly looping backgrounds for guided relaxation.
 * Everything is generated from scratch here, so there are no third-party rights involved.
 * Requires ffmpeg for MP3 encoding. Output: public/sounds/*.mp3
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { makePair, STYLES, SR as PAIR_SR } from "./signature-sounds.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "sounds");
mkdirSync(OUT, { recursive: true });

// ---------- deterministic random ----------
let seed = 1234567;
const rand = () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return ((seed >>> 0) / 4294967296);
};
const reseed = (s) => { seed = s >>> 0 || 1; };

// ---------- helpers ----------
const TAU = Math.PI * 2;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const N = { A2: 45, D2: 38, E2: 40, Fs2: 42, G2: 43, B1: 35, A1: 33, D3: 50, E3: 52, Fs3: 54, G3: 55, A3: 57, B3: 59, Cs4: 61, D4: 62, E4: 64, Fs4: 66, G4: 67, A4: 69, B4: 71, Cs5: 73, D5: 74, E5: 76, Fs5: 78, A5: 81, B5: 83, D6: 86 };

function buf(sec, sr) { return new Float32Array(Math.ceil(sec * sr)); }

function biquad(type, f, q, sr) {
  const w = TAU * f / sr, cs = Math.cos(w), sn = Math.sin(w), a = sn / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
  else if (type === "hp") { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
  else { b0 = a; b1 = 0; b2 = -a; } // band-pass (0 dB peak)
  a0 = 1 + a; a1 = -2 * cs; a2 = 1 - a;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Filter in place with an optionally time-varying cutoff fn(t). `passes` > 1 for cyclic (seamless) filtering. */
function filter(x, sr, type, cutoff, q = 0.707, passes = 1) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const out = new Float32Array(x.length);
  let c = biquad(type, typeof cutoff === "number" ? cutoff : cutoff(0), q, sr);
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < x.length; i++) {
      if (typeof cutoff !== "number" && (i & 63) === 0) c = biquad(type, Math.max(30, Math.min(sr * 0.45, cutoff(i / sr))), q, sr);
      const xi = x[i];
      const y = c.b0 * xi + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
      x2 = x1; x1 = xi; y2 = y1; y1 = y;
      out[i] = y;
    }
  }
  return out;
}

function white(n) { const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = rand() * 2 - 1; return b; }
function pink(n) {
  const b = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = rand() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    b[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
  }
  return b;
}

function addInto(dst, src, at = 0, gain = 1) {
  for (let i = 0; i < src.length && at + i < dst.length; i++) if (at + i >= 0) dst[at + i] += src[i] * gain;
}

function wrapAdd(dst, src, gain = 1) {
  // adds src cyclically into dst: used for seamless loops
  for (let i = 0; i < src.length; i++) dst[i % dst.length] += src[i] * gain;
}

/** Schroeder/Freeverb style mono reverb. */
function reverb(x, sr, { room = 0.84, damp = 0.3, wet = 0.3, tail = 3 } = {}) {
  const n = x.length + Math.floor(tail * sr);
  const input = new Float32Array(n); input.set(x);
  const scale = sr / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ buf: new Float32Array(Math.floor(d * scale)), i: 0, f: 0 }));
  const aps = [556, 441, 341, 225].map((d) => ({ buf: new Float32Array(Math.floor(d * scale)), i: 0 }));
  const out = new Float32Array(n);
  for (let s = 0; s < n; s++) {
    const inp = input[s] * 0.015;
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.f = y * (1 - damp) + c.f * damp;
      c.buf[c.i] = inp + c.f * room;
      c.i = (c.i + 1) % c.buf.length;
      acc += y;
    }
    for (const a of aps) {
      const b = a.buf[a.i];
      const y = -acc + b;
      a.buf[a.i] = acc + b * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      acc = y;
    }
    out[s] = input[s] * (1 - wet) + acc * wet * 3;
  }
  return out;
}

function env(n, sr, { a = 0.01, d = 0, s = 1, r = 0.5, hold }) {
  const e = new Float32Array(n);
  const A = a * sr, D = d * sr, R = r * sr;
  const H = hold !== undefined ? hold * sr : n - R;
  for (let i = 0; i < n; i++) {
    let v;
    if (i < A) v = 0.5 - 0.5 * Math.cos(Math.PI * i / A);
    else if (i < A + D) v = 1 - (1 - s) * ((i - A) / D);
    else if (i < H) v = s;
    else v = s * Math.max(0, 1 - (i - H) / R);
    e[i] = v;
  }
  return e;
}

// ---------- instruments ----------
function kalimba(f, sec, sr) {
  const n = Math.floor(sec * sr), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const atk = Math.min(1, t / 0.004);
    b[i] = atk * (Math.sin(TAU * f * t) * Math.exp(-t * 1.6) + 0.35 * Math.sin(TAU * f * 5.93 * t) * Math.exp(-t * 9) + 0.12 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 3));
  }
  return b;
}

function piano(f, sec, sr, vel = 0.8) {
  const n = Math.floor(sec * sr), b = new Float32Array(n);
  const B = 0.0004; // inharmonicity
  const partials = [1, 0.5, 0.28, 0.16, 0.09, 0.05, 0.03];
  for (let k = 0; k < partials.length; k++) {
    const h = k + 1;
    const fk = f * h * Math.sqrt(1 + B * h * h);
    if (fk > sr * 0.45) break;
    const decay = 0.9 + h * 0.9 + f / 600;
    const amp = partials[k] * (k === 0 ? 1 : vel);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      b[i] += amp * Math.sin(TAU * fk * t + k) * (0.6 * Math.exp(-t * decay) + 0.4 * Math.exp(-t * decay * 0.25));
    }
  }
  for (let i = 0; i < Math.min(n, sr * 0.01); i++) b[i] *= i / (sr * 0.01); // felt-soft attack
  return filter(b, sr, "lp", 2600 + vel * 2000, 0.6);
}

function rhodes(f, sec, sr, vel = 0.6) {
  const n = Math.floor(sec * sr), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const idx = 1.4 * vel * Math.exp(-t * 2.5);
    const amp = Math.min(1, t / 0.006) * Math.exp(-t * 0.7);
    b[i] = amp * Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t)) * (1 + 0.04 * Math.sin(TAU * 4.5 * t));
  }
  return b;
}

function bassPluck(f, sec, sr) {
  const n = Math.floor(sec * sr), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const amp = Math.min(1, t / 0.012) * Math.exp(-t * 1.1);
    b[i] = amp * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 3));
  }
  return filter(b, sr, "lp", 900, 0.7);
}

function synthPad(freqs, sec, sr, { cutoff = 1800, detune = 0.006, voices = 3, wave = "tri", a = 1.5, r = 2.5 } = {}) {
  const n = Math.floor(sec * sr), b = new Float32Array(n);
  for (const f0 of freqs) {
    for (let v = 0; v < voices; v++) {
      const f = f0 * (1 + (v - (voices - 1) / 2) * detune);
      let ph = rand();
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        ph += (f * (1 + 0.0015 * Math.sin(TAU * 5 * t + v))) / sr;
        ph -= Math.floor(ph);
        const s = wave === "saw" ? 2 * ph - 1 : wave === "sine" ? Math.sin(TAU * ph) : 4 * Math.abs(ph - 0.5) - 1;
        b[i] += s / voices;
      }
    }
  }
  const e = env(n, sr, { a, r, s: 1 });
  for (let i = 0; i < n; i++) b[i] *= e[i] / Math.max(1, freqs.length * 0.7);
  return filter(b, sr, "lp", typeof cutoff === "number" ? cutoff : cutoff, 0.6);
}

// ---------- mastering ----------
function fadeEdges(x, sr, fin = 0.02, fout = 1.2) {
  const a = Math.floor(fin * sr), b = Math.floor(fout * sr);
  for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= Math.pow(i / b, 1.5);
  return x;
}

function normalize(x, { peak = 0.89, rms } = {}) {
  let p = 0, s = 0;
  for (const v of x) { p = Math.max(p, Math.abs(v)); s += v * v; }
  const r = Math.sqrt(s / x.length);
  let g = peak / (p || 1);
  if (rms) g = Math.min(g, rms / (r || 1));
  for (let i = 0; i < x.length; i++) x[i] *= g;
  return x;
}

function fit(x, sec, sr) { const out = new Float32Array(Math.floor(sec * sr)); out.set(x.subarray(0, out.length)); return out; }

/** Mono Float32Array or stereo { L, R } → 16-bit PCM WAV. */
function writeWav(path, x, sr) {
  const chans = x.L ? [x.L, x.R] : [x];
  const ch = chans.length, n = chans[0].length, bytes = n * 2 * ch;
  const b = Buffer.alloc(44 + bytes);
  b.write("RIFF", 0); b.writeUInt32LE(36 + bytes, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(ch, 22); b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2 * ch, 28); b.writeUInt16LE(2 * ch, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(bytes, 40);
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(chans[c][i] * 32767))), 44 + (i * ch + c) * 2);
  writeFileSync(path, b);
}

const TMP = join(tmpdir(), `decompressly-sounds-${process.pid}`);
mkdirSync(TMP, { recursive: true });

function encode(name, x, sr, bitrate = "128k") {
  const wav = join(TMP, `${name}.wav`);
  writeWav(wav, x, sr);
  const out = join(OUT, `${name}.mp3`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-b:a", bitrate, "-ac", x.L ? "2" : "1", out]);
  console.log("✓", name);
}

// ---------- START / CLOSE pairs ----------
// Designed in signature-sounds.mjs: one shared five-note hook, energising START, calming CLOSE, stereo.
const only = process.argv[2];
for (const style of STYLES) {
  if (only && only !== style && only !== "pairs") continue;
  const { start, close } = makePair(style);
  encode(`${style}-start`, start, PAIR_SR, "192k");
  encode(`${style}-close`, close, PAIR_SR, "192k");
}

// ---------- seamless backgrounds ----------
const BSR = 32000;
const L = 64; // loop length in seconds
const X = 6; // crossfade length: rendered beyond L, then folded onto the start

/** Equal-power fold of the overhang onto the start: out[0] continues exactly from out[L-1]. */
function loopify(x, sr) {
  const n = L * sr, xf = X * sr;
  const out = new Float32Array(n);
  out.set(x.subarray(0, n));
  for (let i = 0; i < xf; i++) {
    const a = Math.sin((Math.PI / 2) * (i / xf));
    const b = Math.cos((Math.PI / 2) * (i / xf));
    out[i] = x[i] * a + (x[n + i] ?? 0) * b;
  }
  return out;
}

function bgNature() {
  reseed(51);
  const n = (L + X) * BSR;
  const cyc = (t) => 300 + 900 * Math.pow(0.5 - 0.5 * Math.cos((TAU * t) / 8), 2) + 300 * (0.5 - 0.5 * Math.cos((TAU * t) / (64 / 6)));
  const waves = filter(pink(n), BSR, "lp", cyc, 0.6);
  const wind = filter(pink(n), BSR, "bp", (t) => 500 + 200 * Math.sin((TAU * t) / 16), 0.7);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / BSR;
    const swell = 0.35 + 0.65 * Math.pow(0.5 - 0.5 * Math.cos((TAU * t) / 8), 1.6) * (0.75 + 0.25 * Math.cos((TAU * t) / 32));
    out[i] = waves[i] * swell + wind[i] * 0.15;
  }
  return loopify(out, BSR);
}

function bgPad(kind) {
  reseed(kind === "system" ? 61 : kind === "orchestral" ? 71 : 81);
  const len = L + X + 4;
  const dry = buf(len, BSR);
  const at = (sec) => Math.floor(sec * BSR);
  if (kind === "system") {
    addInto(dry, synthPad([N.A2, N.E3, N.B3].map(midi), len, BSR, { a: 0.5, r: 0.5, wave: "tri", voices: 3, cutoff: 900 }), 0, 0.6);
    for (let k = 0; k < 9; k++) {
      const note = [N.E5, N.B4, N.Cs5, N.A4][k % 4];
      addInto(dry, synthPad([midi(note)], 7, BSR, { a: 2.5, r: 4, wave: "sine", voices: 2, cutoff: 4000 }), at(k * 8), 0.12);
    }
    for (let i = 0; i < dry.length; i++) dry[i] *= 0.85 + 0.15 * Math.sin((TAU * (i / BSR)) / 16);
  } else if (kind === "orchestral") {
    const prog = [[N.D3, N.A3, N.Fs4], [47, N.Fs3, N.D4], [N.G2, N.D3, N.B3], [N.A2, N.E3, N.Cs4]];
    for (let k = 0; k < 9; k++) {
      addInto(dry, synthPad(prog[k % 4].map(midi), 11, BSR, { a: 3, r: 4, wave: "saw", voices: 4, detune: 0.004, cutoff: 1100 }), at(k * 8), 0.5);
    }
  } else {
    // jazz: soft Rhodes voicings, one chord every 8 s, gentle bass
    const prog = [[N.Fs3, N.A3, N.Cs4, N.E4], [N.D3, N.Fs3, N.A3, N.Cs4], [N.Fs3, N.A3, N.B3, N.D4], [N.E3, N.G3, N.B3, N.D4]];
    const roots = [N.D2, N.B1, N.G2, N.A1];
    for (let k = 0; k < 9; k++) {
      prog[k % 4].forEach((m, j) => addInto(dry, rhodes(midi(m), 9, BSR, 0.45), at(k * 8 + j * 0.05), 0.25));
      addInto(dry, bassPluck(midi(roots[k % 4]), 8, BSR), at(k * 8), 0.45);
      if (k % 2 === 1) addInto(dry, rhodes(midi([N.A4, N.Fs4, N.E4, N.B4][k % 4]), 5, BSR, 0.35), at(k * 8 + 4.5), 0.15);
    }
  }
  return loopify(reverb(dry, BSR, { wet: 0.4, room: 0.86, tail: 0 }), BSR);
}

if (!only || only === "bg") {
  const bgs = { nature: bgNature(), system: bgPad("system"), orchestral: bgPad("orchestral"), jazz: bgPad("jazz") };
  for (const [k, x] of Object.entries(bgs)) encode(`bg-${k}`, normalize(x, { rms: 0.1 }), BSR, "80k");
}

rmSync(TMP, { recursive: true, force: true });
