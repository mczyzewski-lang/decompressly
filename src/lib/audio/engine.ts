"use client";

import type { AudioRef } from "../types";
import { blobUrl, getBlob } from "../db";

/**
 * Audio helpers tuned for iOS Safari / standalone PWA:
 *  - everything starts from a user gesture (autoplay restrictions),
 *  - long-form playback uses HTMLAudioElement (keeps playing with the screen locked, respects Media Session),
 *  - short cues use a shared AudioContext; navigator.audioSession = "playback" lets cues sound with the mute switch on (iOS 17+).
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

// ---------- speech ----------
let plVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (plVoice !== undefined && plVoice !== null) return plVoice;
  const voices = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  const pl = voices.filter((v) => v.lang?.toLowerCase().startsWith("pl"));
  plVoice = pl.find((v) => /zosia|ewa|paulina|premium|enhanced/i.test(v.name)) ?? pl[0] ?? null;
  return plVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => {
    plVoice = undefined;
    pickVoice();
  };
}

export function hasSystemVoice(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak with the system voice (offline fallback). Resolves when finished or cancelled. */
export function speak(text: string, opts: { rate?: number; volume?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!hasSystemVoice()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pl-PL";
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = opts.rate ?? 0.85;
    u.pitch = 0.95;
    u.volume = opts.volume ?? 0.9;
    const done = () => resolve();
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

export function cancelSpeech() {
  if (hasSystemVoice()) speechSynthesis.cancel();
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

export function playBuffer(buf: AudioBuffer, gain = 0.9): Promise<void> {
  return new Promise((resolve) => {
    const c = audioContext();
    const s = c.createBufferSource();
    const g = c.createGain();
    g.gain.value = gain;
    s.buffer = buf;
    s.connect(g).connect(c.destination);
    s.onended = () => resolve();
    s.start();
  });
}

/** Voice cue: generated ElevenLabs clip if available, otherwise the system voice. */
export async function playCue(blobId: string | undefined, fallbackText: string, gain = 0.8): Promise<void> {
  if (blobId) {
    try {
      const b = await decodeBlob(blobId);
      if (b) return playBuffer(b, gain);
    } catch {
      /* fall back */
    }
  }
  return speak(fallbackText, { volume: gain });
}
