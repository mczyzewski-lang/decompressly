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

/**
 * Loudness envelope over one phase (0..1 progress). Breath noise follows airflow: an inhale starts
 * quickly, carries on and tapers just before the top; an exhale releases at once and fades out.
 */
export function airEnvelope(phase: AirPhase, p: number): number {
  if (p <= 0 || p >= 1) return 0;
  if (phase === "inhale") return smooth(Math.min(1, p / 0.16)) * (1 - 0.35 * p) * smooth(Math.min(1, (1 - p) / 0.14));
  return smooth(Math.min(1, p / 0.08)) * Math.pow(1 - p, 0.9) * smooth(Math.min(1, (1 - p) / 0.06));
}

/**
 * Mono samples for one phase of `seconds` length at a peak level of `level` (0..1 of full scale).
 */
export function renderAir(phase: AirPhase, seconds: number, level: number, rate = AIR_RATE): Float32Array {
  const n = Math.max(1, Math.round(seconds * rate));
  const out = new Float32Array(n);
  const rnd = rng(phase === "inhale" ? 0x1a2b3c : 0x4d5e6f);
  // breath is turbulent air shaped by the nose or mouth: white noise through a few resonances,
  // without the low rumble that makes filtered noise sound like the sea
  const bands =
    phase === "inhale"
      ? [ { f: 2600, q: 1.3, g: 1 }, { f: 4300, q: 1.6, g: 0.7 }, { f: 1300, q: 1.1, g: 0.35 } ]
      : [ { f: 950, q: 1.3, g: 1 }, { f: 1750, q: 1.5, g: 0.8 }, { f: 2800, q: 1.7, g: 0.4 } ];
  const st = bands.map(() => ({ x1: 0, x2: 0, y1: 0, y2: 0, c: bandpass(1000, 1, rate) }));
  let hpIn = 0, hpOut = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    if (i % 64 === 0) {
      // the resonances drift a little as the airway opens (inhale) or relaxes (exhale)
      const shift = phase === "inhale" ? 1 + 0.08 * t : 1 - 0.1 * t;
      bands.forEach((b, k) => (st[k].c = bandpass(b.f * shift, b.q, rate)));
    }
    const w = rnd();
    let mix = 0;
    bands.forEach((b, k) => {
      const z = st[k];
      const y = z.c.b0 * w + z.c.b2 * z.x2 - z.c.a1 * z.y1 - z.c.a2 * z.y2;
      z.x2 = z.x1; z.x1 = w; z.y2 = z.y1; z.y1 = y;
      mix += y * b.g;
    });
    // one-pole high-pass (~300 Hz)
    hpOut = 0.918 * (hpOut + mix - hpIn);
    hpIn = mix;
    const flutter = 1 + 0.05 * Math.sin(2 * Math.PI * 5.3 * (i / rate)) + 0.04 * Math.sin(2 * Math.PI * 1.1 * (i / rate));
    out[i] = hpOut * airEnvelope(phase, t) * flutter;
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

/** The slider's 0..1 mapped to a peak level — audible, but never louder than ~75% of full scale. */
export const airLevel = (volume: number) => 0.75 * Math.max(0, Math.min(1, volume)) ** 1.2;

const urls = new Map<string, string>();

/** Object URL of the synthesized WAV for a phase, cached per phase/length/volume. */
export function airUrl(phase: AirPhase, seconds: number, volume: number): string {
  const key = `${phase}|${seconds}|${volume.toFixed(2)}`;
  let u = urls.get(key);
  if (!u) {
    u = URL.createObjectURL(new Blob([encodeWav(renderAir(phase, seconds, airLevel(volume)))], { type: "audio/wav" }));
    urls.set(key, u);
  }
  return u;
}

/* ---------- real breath recordings (ElevenLabs Sound Effects), made once per phase length ---------- */

export const AIR_PROMPTS: Record<AirPhase, string> = {
  inhale:
    "Close-up microphone recording of one calm, slow human inhale through the nose, soft and natural, relaxed meditation breathing, quiet room, no music, no voice",
  exhale:
    "Close-up microphone recording of one slow, relaxed human exhale through slightly open mouth, soft gentle sigh of relief, meditation breathing, quiet room, no music, no voice",
};

/** Stored recording of one breath phase of a given length. */
export const airSampleId = (phase: AirPhase, seconds: number) => `air-${phase}-${seconds}-v1`;

/** Peak-normalized mono WAV of a recording, with a short fade at the end so phases never click. */
export function shapeRecording(channels: Float32Array[], sampleRate: number, level: number): ArrayBuffer {
  const n = channels[0]?.length ?? 0;
  const mono = new Float32Array(n);
  for (const ch of channels) for (let i = 0; i < n; i++) mono[i] += ch[i] / channels.length;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(mono[i]));
  const g = peak > 0 ? level / peak : 0;
  const fade = Math.min(n, Math.round(sampleRate * 0.25));
  for (let i = 0; i < n; i++) mono[i] *= g * (i >= n - fade ? (n - i) / fade : 1);
  return encodeWav(mono, sampleRate);
}
