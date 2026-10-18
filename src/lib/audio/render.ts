"use client";

import { Mp3Encoder } from "@breezystack/lamejs";
import { audioContext } from "./engine";
import { DEFAULT_GAP } from "./segments";

export type MontagePart = { type: "speech"; buffer: AudioBuffer } | { type: "silence"; seconds: number };

export interface MontageOptions {
  parts: MontagePart[];
  motif?: { buffer: AudioBuffer; position: "start" | "end" };
  background?: AudioBuffer | null;
  backgroundGain?: number; // relative to narration (~0.15–0.3)
  sampleRate?: number;
}

const OfflineCtx = () =>
  (window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext) as typeof OfflineAudioContext;

function rmsOf(buffers: AudioBuffer[]): number {
  let sum = 0;
  let n = 0;
  for (const b of buffers) {
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i];
      if (Math.abs(v) > 0.003) {
        sum += v * v;
        n++;
      }
    }
  }
  return n ? Math.sqrt(sum / n) : 0.1;
}

function peakOf(buffers: AudioBuffer[]): number {
  let p = 0;
  for (const b of buffers) {
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
  }
  return p || 1;
}

/**
 * Builds the final session audio: optional motif, narration paragraphs separated by real
 * silences, a quiet looping background with fades and gentle ducking under speech, and
 * loudness normalisation so narration always sits clearly above the background.
 */
export async function renderMontage(o: MontageOptions): Promise<AudioBuffer> {
  const sr = o.sampleRate ?? 24000;
  const speech = o.parts.filter((p): p is { type: "speech"; buffer: AudioBuffer } => p.type === "speech").map((p) => p.buffer);
  const targetRms = 0.12;
  let narrGain = targetRms / rmsOf(speech);
  narrGain = Math.min(narrGain, 0.92 / peakOf(speech));

  // timeline
  let t = 0;
  const placements: { buffer: AudioBuffer; at: number; gain: number }[] = [];
  const speechSpans: [number, number][] = [];
  if (o.motif?.position === "start") {
    placements.push({ buffer: o.motif.buffer, at: 0, gain: 0.75 });
    t = Math.max(1.5, o.motif.buffer.duration - 2);
  } else {
    t = 1.5;
  }
  for (let i = 0; i < o.parts.length; i++) {
    const p = o.parts[i];
    if (p.type === "silence") {
      t += p.seconds;
    } else {
      placements.push({ buffer: p.buffer, at: t, gain: narrGain });
      speechSpans.push([t, t + p.buffer.duration]);
      t += p.buffer.duration;
      if (o.parts[i + 1]?.type === "speech") t += DEFAULT_GAP;
    }
  }
  t += 2.5;
  if (o.motif?.position === "end") {
    placements.push({ buffer: o.motif.buffer, at: t, gain: 0.75 });
    t += o.motif.buffer.duration + 0.5;
  }
  const total = Math.ceil(t * sr);

  const Ctx = OfflineCtx();
  const ctx = new Ctx(1, total, sr);

  if (o.background) {
    const bg = ctx.createBufferSource();
    bg.buffer = o.background;
    bg.loop = true;
    const g = ctx.createGain();
    const level = o.backgroundGain ?? 0.22;
    const duck = level * 0.6;
    g.gain.setValueAtTime(0, 0);
    g.gain.linearRampToValueAtTime(level, 5);
    for (const [a, b] of speechSpans) {
      if (a < 5) continue;
      g.gain.setTargetAtTime(duck, a - 0.4, 0.35);
      g.gain.setTargetAtTime(level, b + 0.3, 0.9);
    }
    const end = total / sr;
    g.gain.setTargetAtTime(level, Math.max(5, end - 9), 0.5);
    g.gain.linearRampToValueAtTime(0, end);
    bg.connect(g).connect(ctx.destination);
    bg.start(0);
  }

  for (const p of placements) {
    const s = ctx.createBufferSource();
    s.buffer = p.buffer;
    const g = ctx.createGain();
    g.gain.value = p.gain;
    s.connect(g).connect(ctx.destination);
    s.start(p.at);
  }

  const out = await ctx.startRendering();
  // safety limiter
  const d = out.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0.97) {
    const k = 0.97 / peak;
    for (let i = 0; i < d.length; i++) d[i] *= k;
  }
  return out;
}

/** Encode a mono/stereo AudioBuffer to MP3 (mono), yielding to the UI between chunks. */
export async function encodeMp3(buffer: AudioBuffer, kbps = 64, onProgress?: (p: number) => void): Promise<Blob> {
  const sr = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const enc = new Mp3Encoder(1, sr, kbps);
  const block = 1152 * 20;
  const chunks: BlobPart[] = [];
  const pcm = new Int16Array(block);
  for (let i = 0; i < data.length; i += block) {
    const len = Math.min(block, data.length - i);
    for (let j = 0; j < len; j++) {
      const v = Math.max(-1, Math.min(1, data[i + j]));
      pcm[j] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    const mp3 = enc.encodeBuffer(len === block ? pcm : pcm.subarray(0, len));
    if (mp3.length) chunks.push(new Uint8Array(mp3));
    if ((i / block) % 25 === 0) {
      onProgress?.(i / data.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const end = enc.flush();
  if (end.length) chunks.push(new Uint8Array(end));
  onProgress?.(1);
  return new Blob(chunks, { type: "audio/mpeg" });
}

export async function decodeAny(blob: Blob): Promise<AudioBuffer> {
  return audioContext().decodeAudioData(await blob.arrayBuffer());
}

export async function fetchDecode(url: string): Promise<AudioBuffer> {
  const r = await fetch(url);
  return audioContext().decodeAudioData(await r.arrayBuffer());
}

export type VariantKind = "calmer" | "brighter" | "reverse";

export const VARIANT_LABELS: Record<VariantKind, string> = {
  calmer: "Spokojniejszy — niżej, ciemniej, dłuższe wybrzmienie (dobry CLOSE ze START)",
  brighter: "Jaśniejszy — wyżej i lżej (dobry START z CLOSE)",
  reverse: "Odwrócony w czasie (eksperymentalny)",
};

function impulse(ctx: BaseAudioContext, seconds: number) {
  const len = Math.floor(seconds * ctx.sampleRate);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < len; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = ((seed / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return b;
}

/**
 * Derive a companion sound from one base motif, locally and for free. This is how a matching
 * START/CLOSE pair can share exactly the same musical material.
 */
export async function makeVariant(src: AudioBuffer, kind: VariantKind, seconds = 10): Promise<AudioBuffer> {
  const sr = 44100;
  const Ctx = OfflineCtx();
  const ctx = new Ctx(1, Math.ceil(seconds * sr), sr);
  let input = src;
  if (kind === "reverse") {
    input = ctx.createBuffer(1, src.length, src.sampleRate);
    const s = src.getChannelData(0);
    const d = input.getChannelData(0);
    for (let i = 0; i < s.length; i++) d[i] = s[s.length - 1 - i];
  }
  const node = ctx.createBufferSource();
  node.buffer = input;
  node.playbackRate.value = kind === "calmer" ? 0.8909 : kind === "brighter" ? 1.1225 : 1; // ∓2 semitones
  const lp = ctx.createBiquadFilter();
  lp.type = kind === "brighter" ? "highshelf" : "lowpass";
  lp.frequency.value = kind === "brighter" ? 3500 : 2400;
  if (kind === "brighter") lp.gain.value = 3;
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx, kind === "calmer" ? 3.5 : 2);
  dry.gain.value = 0.8;
  wet.gain.value = kind === "calmer" ? 0.35 : 0.2;
  const env = ctx.createGain();
  env.gain.setValueAtTime(kind === "reverse" ? 0 : 1, 0);
  if (kind === "reverse") env.gain.linearRampToValueAtTime(1, 1.5);
  env.gain.setValueAtTime(1, seconds - 4);
  env.gain.linearRampToValueAtTime(0, seconds);
  node.connect(lp);
  lp.connect(dry).connect(env);
  lp.connect(conv).connect(wet).connect(env);
  env.connect(ctx.destination);
  node.start(0);
  const out = await ctx.startRendering();
  const d = out.getChannelData(0);
  let p = 0;
  for (let i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
  const k = p > 0 ? 0.89 / p : 1;
  for (let i = 0; i < d.length; i++) d[i] *= k;
  return out;
}
