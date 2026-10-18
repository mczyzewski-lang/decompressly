"use client";

import { deleteBlob, getBlob, putBlob } from "../db";
import { generateSpeech } from "../eleven-client";
import { getState } from "../store";
import type { AudioRef, Background, Motif } from "../types";
import { decodeAny, encodeMp3, fetchDecode, renderMontage, type MontagePart } from "./render";
import { refUrl } from "./engine";
import { speechSegments, textKey, type Segment } from "./segments";

export function segmentId(text: string): string {
  const e = getState().eleven;
  return textKey(text, e.voiceId, e.modelId);
}

/** Which paragraphs still need paid generation (already generated ones are reused for free). */
export async function missingSegments(segments: Segment[]): Promise<{ texts: string[]; chars: number }> {
  const texts: string[] = [];
  for (const t of speechSegments(segments)) {
    if (!(await getBlob(segmentId(t)))) texts.push(t);
  }
  return { texts: [...new Set(texts)], chars: texts.reduce((a, t) => a + t.length, 0) };
}

/**
 * Generate missing narration paragraphs one by one. Each paragraph is sent with its neighbours
 * as previous/next context for natural intonation. Pause markers never reach the API.
 */
export async function generateMissing(segments: Segment[], onProgress: (done: number, total: number) => void, force = false): Promise<void> {
  const all = speechSegments(segments);
  const todo: number[] = [];
  for (let i = 0; i < all.length; i++) {
    const id = segmentId(all[i]);
    if (force) await deleteBlob(id);
    if (force || !(await getBlob(id))) todo.push(i);
  }
  const seen = new Set<string>();
  let done = 0;
  onProgress(0, todo.length);
  for (const i of todo) {
    const id = segmentId(all[i]);
    if (seen.has(id)) continue;
    seen.add(id);
    const blob = await generateSpeech(all[i], { previous: all[i - 1], next: all[i + 1] });
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
export async function renderSessionFile(
  segments: Segment[],
  opts: { background: Background; motif: Motif; label: string },
  onProgress: (stage: string, p?: number) => void,
): Promise<{ blobId: string; durationSec: number }> {
  onProgress("Przygotowuję fragmenty…");
  const parts: MontagePart[] = [];
  for (const seg of segments) {
    if (seg.kind === "pause") parts.push({ type: "silence", seconds: seg.seconds });
    else {
      const rec = await getBlob(segmentId(seg.text));
      if (!rec) throw new Error("Brakuje wygenerowanego fragmentu. Wygeneruj narrację ponownie.");
      parts.push({ type: "speech", buffer: await decodeAny(rec.blob) });
    }
  }
  const bg = opts.background !== "none" ? await fetchDecode(BACKGROUND_URL[opts.background]) : null;
  const mref = await motifRef(opts.motif);
  const murl = await refUrl(mref);
  const motifBuf = murl ? await fetchDecode(murl) : null;
  onProgress("Montuję audio…");
  const mixed = await renderMontage({
    parts,
    background: bg,
    backgroundGain: 0.2,
    motif: motifBuf && opts.motif !== "none" ? { buffer: motifBuf, position: opts.motif === "start" ? "start" : "end" } : undefined,
    sampleRate: 22050,
  });
  onProgress("Zapisuję plik…", 0);
  const mp3 = await encodeMp3(mixed, 64, (p) => onProgress("Zapisuję plik…", p));
  const blobId = await putBlob(mp3, "session", opts.label, { duration: mixed.duration });
  return { blobId, durationSec: mixed.duration };
}

/** Single short clip (voice cue, mantra, closing narration). */
export async function generateClip(text: string, kind: "cue" | "tts", label: string): Promise<string> {
  const blob = await generateSpeech(text);
  return putBlob(blob, kind, label, { text });
}
