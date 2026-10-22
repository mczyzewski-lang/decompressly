/**
 * Soft, synthesized "air" for the breath circle: an inhale (a light, rising draw of air) and an exhale
 * (a longer, lower, falling sigh). Generated locally from filtered noise — no network, no cost — and
 * rendered to WAV so it can play through a media element (not silenced by the iPhone mute switch).
 * The level is baked into the file because iOS ignores `HTMLMediaElement.volume`.
 */

export const AIR_RATE = 22050;

export type AirPhase = "inhale" | "exhale";

/** Deterministic noise, so the same phase always sounds the same. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

/** RBJ band-pass (constant 0 dB peak gain) coefficients. */
function bandpass(freq: number, q: number, rate: number) {
  const w = (2 * Math.PI * freq) / rate;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  return { b0: alpha / a0, b2: -alpha / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - alpha) / a0 };
}

const smooth = (x: number) => x * x * (3 - 2 * x);

/** Loudness envelope over one phase (0..1 progress). */
export function airEnvelope(phase: AirPhase, p: number): number {
  if (p <= 0 || p >= 1) return 0;
  if (phase === "inhale") {
    // swells gently, fullest near the top of the breath, then closes quickly
    const rise = smooth(Math.min(1, p / 0.72));
    const close = smooth(Math.min(1, (1 - p) / 0.2));
    return rise * close;
  }
  // exhale: soft onset, then a long, relaxing fade
  const open = smooth(Math.min(1, p / 0.14));
  const fade = Math.pow(1 - p, 1.25);
  return open * fade;
}

/**
 * Mono samples for one phase of `seconds` length at a peak level of `level` (0..1 of full scale).
 */
export function renderAir(phase: AirPhase, seconds: number, level: number, rate = AIR_RATE): Float32Array {
  const n = Math.max(1, Math.round(seconds * rate));
  const out = new Float32Array(n);
  const rnd = rng(phase === "inhale" ? 0x1a2b3c : 0x4d5e6f);
  // pinkish noise (Paul Kellet's economy filter) — closer to breath than white noise
  let p0 = 0, p1 = 0, p2 = 0;
  // two band-passes: a body resonance and a breathy "hiss" band
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let h1 = 0, h2 = 0, hy1 = 0, hy2 = 0;
  let body = bandpass(800, 0.9, rate);
  let hiss = bandpass(2400, 0.7, rate);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    if (i % 64 === 0) {
      // inhale rises in pitch as the lungs fill; exhale settles lower
      const f = phase === "inhale" ? 650 + 650 * t : 950 - 450 * t;
      body = bandpass(f, 0.9, rate);
      hiss = bandpass(phase === "inhale" ? 2200 + 900 * t : 2000 - 600 * t, 0.7, rate);
    }
    const w = rnd();
    p0 = 0.99765 * p0 + w * 0.099046;
    p1 = 0.963 * p1 + w * 0.2965164;
    p2 = 0.57 * p2 + w * 1.0526913;
    const pink = (p0 + p1 + p2 + w * 0.1848) * 0.2;

    const yb = body.b0 * pink + body.b2 * x2 - body.a1 * y1 - body.a2 * y2;
    x2 = x1; x1 = pink; y2 = y1; y1 = yb;
    const yh = hiss.b0 * w + hiss.b2 * h2 - hiss.a1 * hy1 - hiss.a2 * hy2;
    h2 = h1; h1 = w; hy2 = hy1; hy1 = yh;

    const mix = yb * 1.6 + yh * (phase === "inhale" ? 0.32 : 0.2);
    lp += (mix - lp) * 0.55; // takes the edge off
    // a slow, tiny flutter keeps it from sounding like static
    const flutter = 1 + 0.07 * Math.sin(2 * Math.PI * 3.1 * (i / rate)) + 0.04 * Math.sin(2 * Math.PI * 0.7 * (i / rate));
    out[i] = lp * airEnvelope(phase, t) * flutter;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0 ? level / peak : 0;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

/** 16-bit mono PCM WAV. */
export function encodeWav(samples: Float32Array, rate = AIR_RATE): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return buf;
}

/** Perceived "soft" level: the slider's 0..1 maps to at most ~45% of full scale. */
export const airLevel = (volume: number) => 0.45 * Math.max(0, Math.min(1, volume)) ** 1.5;

const urls = new Map<string, string>();

/** Object URL of the WAV for a phase, cached per phase/length/volume. */
export function airUrl(phase: AirPhase, seconds: number, volume: number): string {
  const key = `${phase}|${seconds}|${volume.toFixed(2)}`;
  let u = urls.get(key);
  if (!u) {
    u = URL.createObjectURL(new Blob([encodeWav(renderAir(phase, seconds, airLevel(volume)))], { type: "audio/wav" }));
    urls.set(key, u);
  }
  return u;
}
