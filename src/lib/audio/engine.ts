"use client";

import type { AudioRef } from "../types";
import { blobUrl, getBlob } from "../db";

/**
 * Audio helpers tuned for iOS Safari / standalone PWA:
 *  - everything starts from a user gesture (autoplay restrictions),
 *  - long-form playback uses HTMLAudioElement (keeps playing with the screen locked, respects Media Session),
 *  - spoken phrases play through their own <audio> element (like START/CLOSE): Web Audio can be silenced by the
 *    iPhone mute switch, media elements are not,
 *  - soft tones use a shared AudioContext; navigator.audioSession = "playback" helps on iOS 17+,
 *  - every spoken word comes from the chosen ElevenLabs voice (see voice.ts) — the system voice is never used.
 */
let ctx: AudioContext | null = null;

export function audioContext(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export async function unlockAudio() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* ignore */
  }
  const c = audioContext();
  if (c.state !== "running") {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
  // a silent buffer fully unlocks output on older iOS versions
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(0);
  // prime the voice element inside the user gesture, so later phrases can play without one
  try {
    const el = voiceElement();
    el.src = silentWavUrl();
    await el.play();
  } catch {
    /* ignore */
  }
}

let silentUrl: string | null = null;
function silentWavUrl(): string {
  if (silentUrl) return silentUrl;
  const n = 2205; // 0.1 s at 22.05 kHz
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 22050, true);
  v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
  silentUrl = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  return silentUrl;
}

let voiceEl: HTMLAudioElement | null = null;
function voiceElement(): HTMLAudioElement {
  if (!voiceEl) {
    voiceEl = new Audio();
    voiceEl.preload = "auto";
  }
  return voiceEl;
}

/** Plays one spoken phrase; resolves when it ends, is stopped, or fails. */
export function playVoiceUrl(url: string, volume = 0.9): Promise<boolean> {
  return new Promise((resolve) => {
    const el = voiceElement();
    const done = (ok: boolean) => {
      el.onended = el.onpause = el.onerror = null;
      resolve(ok);
    };
    el.onended = () => done(true);
    el.onpause = () => done(true);
    el.onerror = () => done(false);
    el.src = url;
    el.volume = volume;
    el.currentTime = 0;
    el.play().catch(() => done(false));
  });
}

export async function refUrl(ref: AudioRef | undefined | null): Promise<string | null> {
  if (!ref) return null;
  if (ref.kind === "static") return ref.url;
  return blobUrl(ref.id);
}

/** A single shared element for ritual sounds, so START/CLOSE never overlap. */
let ritualEl: HTMLAudioElement | null = null;

export async function playRef(ref: AudioRef | undefined | null, volume = 0.9): Promise<HTMLAudioElement | null> {
  const url = await refUrl(ref);
  if (!url) return null;
  if (!ritualEl) ritualEl = new Audio();
  ritualEl.pause();
  ritualEl.src = url;
  ritualEl.volume = volume;
  ritualEl.currentTime = 0;
  try {
    await ritualEl.play();
  } catch (e) {
    console.warn("Odtwarzanie zablokowane", e);
    return null;
  }
  return ritualEl;
}

export function stopRitualSound() {
  ritualEl?.pause();
}

/** Soft sine tone with long attack and release — never sharp or loud. */
export function softTone(freq: number, duration = 1.2, gain = 0.08) {
  const c = audioContext();
  const t = c.currentTime + 0.01;
  const o = c.createOscillator();
  const o2 = c.createOscillator();
  const g = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  o.type = "sine";
  o2.type = "sine";
  o.frequency.value = freq;
  o2.frequency.value = freq * 2.001;
  const g2 = c.createGain();
  g2.gain.value = 0.18;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g);
  o2.connect(g2).connect(g);
  g.connect(lp).connect(c.destination);
  o.start(t);
  o2.start(t);
  o.stop(t + duration + 0.05);
  o2.stop(t + duration + 0.05);
}

/** Gentle bell for the end of a timer. */
export function softBell() {
  softTone(523.25, 3.2, 0.07);
  setTimeout(() => softTone(659.25, 3.5, 0.05), 380);
}

// ---------- decoded clips (voice cues, segments) ----------
const decoded = new Map<string, AudioBuffer>();

export async function decodeBlob(id: string): Promise<AudioBuffer | null> {
  const hit = decoded.get(id);
  if (hit) return hit;
  const rec = await getBlob(id);
  if (!rec) return null;
  const buf = await audioContext().decodeAudioData(await rec.blob.arrayBuffer());
  decoded.set(id, buf);
  return buf;
}

export function forgetDecoded(id: string) {
  decoded.delete(id);
}

const activeVoices = new Set<{ src: AudioBufferSourceNode; done: () => void }>();

/** Plays a decoded clip; resolves when it ends or is stopped with stopVoice(). */
export function playBuffer(buf: AudioBuffer, gain = 0.9): Promise<void> {
  return new Promise((resolve) => {
    const c = audioContext();
    const s = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = gain;
    s.buffer = buf;
    s.connect(g).connect(c.destination);
    const entry = { src: s, done: resolve };
    activeVoices.add(entry);
    s.onended = () => {
      activeVoices.delete(entry);
      resolve();
    };
    s.start();
  });
}

/** Stops every voice clip that is currently playing. */
export function stopVoice() {
  voiceEl?.pause();
  for (const v of activeVoices) {
    try {
      v.src.stop();
    } catch {
      /* already stopped */
    }
    v.done();
  }
  activeVoices.clear();
}
