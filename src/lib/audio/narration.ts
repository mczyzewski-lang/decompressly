"use client";

import { deleteBlob, getBlob, putBlob } from "../db";
import { generateSpeech } from "../eleven-client";
import { getState } from "../store";
import { modelFor } from "../voices";
import type { AudioRef, Background, Motif } from "../types";
import { decodeAny, encodeMp3, fetchDecode, renderMontage, type MontagePart } from "./render";
import { refUrl } from "./engine";
import { DEFAULT_GAP, speechSegments, textKey, type Segment } from "./segments";

export function segmentId(text: string, voiceId?: string): string {
  const e = getState().eleven;
  return textKey(text, voiceId || e.voiceId, modelFor(e, voiceId));
}

/** Which paragraphs still need paid generation (already generated ones are reused for free). */
export async function missingSegments(segments: Segment[], voiceId?: string): Promise<{ texts: string[]; chars: number }> {
  const texts: string[] = [];
  for (const t of speechSegments(segments)) {
    if (!(await getBlob(segmentId(t, voiceId)))) texts.push(t);
  }
  return { texts: [...new Set(texts)], chars: texts.reduce((a, t) => a + t.length, 0) };
}

/**
 * Generate missing narration paragraphs one by one. Each paragraph is sent with its neighbours
 * as previous/next context for natural intonation. Pause markers never reach the API.
 */
export async function generateMissing(segments: Segment[], onProgress: (done: number, total: number) => void, force = false, voiceId?: string): Promise<void> {
  const all = speechSegments(segments);
  const todo: number[] = [];
  for (let i = 0; i < all.length; i++) {
    const id = segmentId(all[i], voiceId);
    if (force) await deleteBlob(id);
    if (force || !(await getBlob(id))) todo.push(i);
  }
  const seen = new Set<string>();
  let done = 0;
  onProgress(0, todo.length);
  for (const i of todo) {
    const id = segmentId(all[i], voiceId);
    if (seen.has(id)) continue;
    seen.add(id);
    const blob = await generateSpeech(all[i], { previous: all[i - 1], next: all[i + 1], voiceId });
    await putBlob(blob, "tts", all[i].slice(0, 60), { text: all[i] }, id);
    onProgress(++done, todo.length);
  }
}

export const BACKGROUND_URL: Record<Exclude<Background, "none">, string> = {
  nature: "/sounds/bg-nature.mp3",
  jazz: "/sounds/bg-jazz.mp3",
  system: "/sounds/bg-system.mp3",
  orchestral: "/sounds/bg-orchestral.mp3",
};

export async function motifRef(motif: Motif): Promise<AudioRef | null> {
  if (motif === "none") return null;
  const s = getState();
  const set = s.soundSets.find((x) => x.id === s.activeSoundSetId);
  return (motif === "start" ? set?.start : set?.close) ?? null;
}

/** Montage from cached paragraphs → one MP3 blob stored for offline playback. */
/**
 * Montage from cached paragraphs → one MP3 blob stored for offline playback. Motifs are part of the
 * segment list (see withMotif), so they play exactly where the script shows them.
 */
export async function renderSessionFile(
  segments: Segment[],
  opts: { background: Background; label: string; gap?: number; voiceId?: string; targetSec?: number },
  onProgress: (stage: string, p?: number) => void,
): Promise<{ blobId: string; durationSec: number }> {
  onProgress("Przygotowuję fragmenty…");
  const motifs: Partial<Record<"start" | "close", AudioBuffer | null>> = {};
  const motifBuffer = async (which: "start" | "close") => {
    if (!(which in motifs)) {
      const url = await refUrl(await motifRef(which));
      motifs[which] = url ? await fetchDecode(url) : null;
    }
    return motifs[which] ?? null;
  };
  const parts: MontagePart[] = [];
  for (const seg of segments) {
    if (seg.kind === "pause") parts.push({ type: "silence", seconds: seg.seconds });
    else if (seg.kind === "motif") {
      const buffer = await motifBuffer(seg.which);
      if (buffer) parts.push({ type: "motif", buffer, level: seg.level });
    } else {
      const rec = await getBlob(segmentId(seg.text, opts.voiceId));
      if (!rec) throw new Error("Brakuje wygenerowanego fragmentu. Wygeneruj narrację ponownie.");
      parts.push({ type: "speech", buffer: await decodeAny(rec.blob) });
    }
  }
  if (opts.targetSec) fitSilences(parts, opts.targetSec, opts.gap ?? DEFAULT_GAP);
  const bg = opts.background !== "none" ? await fetchDecode(BACKGROUND_URL[opts.background]) : null;
  onProgress("Montuję audio…");
  const mixed = await renderMontage({ parts, background: bg, backgroundGain: 0.2, gap: opts.gap, sampleRate: 22050 });
  onProgress("Zapisuję plik…", 0);
  const mp3 = await encodeMp3(mixed, 64, (p) => onProgress("Zapisuję plik…", p));
  const blobId = await putBlob(mp3, "session", opts.label, { duration: mixed.duration });
  return { blobId, durationSec: mixed.duration };
}

/**
 * The pauses were sized from an estimate of speaking speed; now that the real recordings are known,
 * stretch or shrink the silences (within reason) so the session lands close to the chosen length.
 */
export function fitSilences(parts: MontagePart[], targetSec: number, gap: number) {
  let silence = 0;
  let fixed = 1.5;
  parts.forEach((p, i) => {
    if (p.type === "silence") silence += p.seconds;
    else if (p.type === "speech") fixed += p.buffer.duration + (parts[i + 1]?.type === "speech" ? gap : 0);
    else if ((p.level ?? 1) >= 1) fixed += p.buffer.duration;
  });
  if (silence <= 0) return;
  const f = Math.min(1.6, Math.max(0.7, (targetSec - fixed) / silence));
  for (const p of parts) if (p.type === "silence") p.seconds = Math.round(p.seconds * f * 10) / 10;
}

/** Single short clip (voice cue, mantra, closing narration). */
export async function generateClip(text: string, kind: "cue" | "tts", label: string): Promise<string> {
  const blob = await generateSpeech(text);
  return putBlob(blob, kind, label, { text });
}
