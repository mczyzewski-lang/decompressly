"use client";

import type { Background } from "../types";
import { audioContext, refUrl } from "./engine";
import { BACKGROUND_URL, motifRef } from "./narration";
import { fetchDecode } from "./render";

/**
 * Sound for a yoga session, all through Web Audio so it can fade smoothly, loop without a gap and
 * be paused with everything else: a quiet music bed (the bundled 64-second seamless loops), a calmer
 * bed for the last pose with the CLOSE motif growing in as an anchor, and soft Balinese-style bells.
 */
const LOOP = 64; // the bundled backgrounds are seamless 64 s loops

const buffers = new Map<string, Promise<AudioBuffer | null>>();
function load(url: string): Promise<AudioBuffer | null> {
  let p = buffers.get(url);
  if (!p) {
    p = fetchDecode(url).catch(() => null);
    buffers.set(url, p);
  }
  return p;
}

interface Bed {
  kind: Exclude<Background, "none">;
  buffer: AudioBuffer;
  src: AudioBufferSourceNode | null;
  gain: GainNode;
  /** ctx time at which the loop position was `offset` */
  startedAt: number;
  offset: number;
  volume: number;
}

let bed: Bed | null = null;
let token = 0;
const oneShots = new Set<AudioBufferSourceNode>();

function loopEnd(buf: AudioBuffer) {
  return Math.min(buf.duration, LOOP);
}

function startSource(b: Bed, offset: number, fadeIn: number) {
  const c = audioContext();
  const src = c.createBufferSource();
  src.buffer = b.buffer;
  src.loop = true;
  src.loopStart = 0;
  src.loopEnd = loopEnd(b.buffer);
  src.connect(b.gain);
  const now = c.currentTime;
  b.gain.gain.cancelScheduledValues(now);
  b.gain.gain.setValueAtTime(0, now);
  b.gain.gain.setTargetAtTime(b.volume, now, fadeIn / 3);
  src.start(now, offset % src.loopEnd);
  b.src = src;
  b.startedAt = now;
  b.offset = offset;
}

function fadeOutAndStop(b: Bed, seconds: number) {
  const c = audioContext();
  const now = c.currentTime;
  b.gain.gain.cancelScheduledValues(now);
  b.gain.gain.setTargetAtTime(0, now, seconds / 3);
  try {
    b.src?.stop(now + seconds + 0.1);
  } catch {
    /* already stopped */
  }
  b.src = null;
}

/** Plays (or crossfades to) a music bed. `volume` 0..1 from Settings; the bed always stays under the voice. */
export async function startMusic(kind: Background, volume: number) {
  const my = ++token;
  if (kind === "none" || volume <= 0) {
    stopMusic(1.5);
    return;
  }
  const level = 0.55 * Math.min(1, volume);
  if (bed && bed.kind === kind) {
    bed.volume = level;
    if (bed.src) bed.gain.gain.setTargetAtTime(level, audioContext().currentTime, 0.3);
    return;
  }
  const buffer = await load(BACKGROUND_URL[kind]);
  if (!buffer || my !== token) return;
  const c = audioContext();
  if (bed) fadeOutAndStop(bed, 3);
  const gain = c.createGain();
  gain.connect(c.destination);
  bed = { kind, buffer, src: null, gain, startedAt: 0, offset: 0, volume: level };
  startSource(bed, 0, 3);
}

/** Whether the bed is playing (also used by the end-to-end tests). */
export function musicState(): { kind: string | null; playing: boolean } {
  return { kind: bed?.kind ?? null, playing: !!bed?.src };
}
if (typeof window !== "undefined") (window as unknown as { __dcMusic?: typeof musicState }).__dcMusic = musicState;

export function pauseMusic() {
  token++;
  if (!bed?.src) return;
  const c = audioContext();
  bed.offset = bed.offset + (c.currentTime - bed.startedAt);
  fadeOutAndStop(bed, 0.25);
  stopOneShots();
}

export function resumeMusic() {
  const c = audioContext();
  // iOS may have suspended the context while everything was silent
  if (c.state !== "running") void c.resume().catch(() => undefined);
  if (bed && !bed.src) startSource(bed, bed.offset, 1.2);
}

export function stopMusic(fade = 2) {
  token++;
  if (bed) {
    fadeOutAndStop(bed, fade);
    bed = null;
  }
}

/** The CLOSE motif of the active sound set at a given level (0..1) — quiet echoes grow into the full motif. */
export async function playCloseMotif(level: number) {
  const url = await refUrl(await motifRef("close"));
  if (!url) return;
  const buffer = await load(url);
  if (!buffer) return;
  const c = audioContext();
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = 0.75 * level;
  src.connect(g).connect(c.destination);
  src.onended = () => oneShots.delete(src);
  oneShots.add(src);
  src.start();
}

/** Seconds the full CLOSE motif lasts (to let it end with the session). */
export async function closeMotifSeconds(): Promise<number> {
  const url = await refUrl(await motifRef("close"));
  const buffer = url ? await load(url) : null;
  return buffer?.duration ?? 20;
}

export function stopOneShots() {
  for (const s of oneShots) {
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
  }
  oneShots.clear();
}

/**
 * A soft Balinese-style bell (gamelan-like, slightly inharmonic partials): two short "pik" and a long
 * "piiik" mark the end of a pose. Deliberately quiet.
 */
export function yogaBell(kind: "tick" | "long") {
  const c = audioContext();
  const t = c.currentTime + 0.01;
  const base = kind === "tick" ? 1046.5 : 1318.5;
  const decay = kind === "tick" ? 0.5 : 2.6;
  const out = c.createGain();
  out.gain.value = kind === "tick" ? 0.05 : 0.065;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6000;
  out.connect(lp).connect(c.destination);
  // partial ratios of a small metal bar (bonang-like), each with its own decay
  const partials: [number, number, number][] = [
    [1, 1, 1],
    [2.01, 0.35, 0.6],
    [2.76, 0.22, 0.45],
    [4.07, 0.1, 0.3],
  ];
  for (const [ratio, amp, dk] of partials) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = base * ratio;
    // a hint of shimmer, like two bells tuned slightly apart
    o.detune.value = ratio === 1 ? 6 : 0;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay * dk + 0.05);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay * dk + 0.1);
  }
}
