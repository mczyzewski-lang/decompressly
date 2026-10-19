"use client";

import { getBlob, putBlob } from "../db";
import { generateSpeech, confirmPaid, describeChars } from "../eleven-client";
import { getState } from "../store";
import { segmentId } from "./narration";
import { playRef, stopRitualSound, unlockAudio } from "./engine";
import { ensureVoice, stopVoice } from "./voice";

/**
 * Thoughts are recorded per exact text + voice + model. Editing a thought therefore never plays an
 * outdated recording, and re-recording happens only when you ask for it.
 */
export async function hasRecording(text: string): Promise<boolean> {
  if (!getState().eleven.voiceId) return false;
  return !!(await getBlob(segmentId(text)));
}

/** Plays the thought in the calm ElevenLabs voice, recording it first if needed. */
export async function listenThought(text: string): Promise<void> {
  await unlockAudio();
  stopVoice();
  stopRitualSound();
  const id = await ensureVoice(text, `Myśl: ${text.slice(0, 50)}`);
  if (!id) return;
  const el = await playRef({ kind: "blob", id }, 1);
  if (!el) return;
  await new Promise<void>((resolve) => {
    el.addEventListener("ended", () => resolve(), { once: true });
    el.addEventListener("pause", () => resolve(), { once: true });
  });
}

export function stopListening() {
  stopVoice();
  stopRitualSound();
}

/** Records the given thoughts after one explicit confirmation. Already recorded texts are skipped. */
export async function recordThoughts(texts: string[], onProgress?: (done: number, total: number) => void): Promise<number> {
  const s = getState();
  if (!s.eleven.voiceId) throw new Error("Najpierw wybierz głos w Ustawieniach → ElevenLabs.");
  const todo: string[] = [];
  for (const t of texts) if (!(await getBlob(segmentId(t)))) todo.push(t);
  if (!todo.length) return 0;
  const chars = todo.reduce((a, t) => a + t.length, 0);
  const ok = await confirmPaid(
    todo.length === 1 ? `Nagranie myśli: „${todo[0]}”` : `Nagranie ${todo.length} myśli spokojnym głosem ${s.eleven.voiceName || ""}.`.trim(),
    describeChars(chars),
  );
  if (!ok) return 0;
  let done = 0;
  onProgress?.(0, todo.length);
  for (const t of todo) {
    const blob = await generateSpeech(t);
    await putBlob(blob, "tts", `Myśl: ${t.slice(0, 50)}`, { text: t }, segmentId(t));
    done++;
    onProgress?.(done, todo.length);
  }
  return done;
}
