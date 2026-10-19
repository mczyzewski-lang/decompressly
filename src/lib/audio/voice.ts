"use client";

import { getBlob, putBlob } from "../db";
import { generateSpeech } from "../eleven-client";
import { getState } from "../store";
import { toast } from "../ui-store";
import { segmentId } from "./narration";
import { decodeBlob, playBuffer, stopVoice } from "./engine";

/**
 * The only voice in the app is the chosen ElevenLabs voice. Every phrase is generated once
 * (per text + voice + model), stored offline and reused; nothing falls back to the system voice.
 */
const inflight = new Map<string, Promise<string | null>>();
let lastNotice = 0;

function notice(text: string) {
  if (Date.now() - lastNotice < 8000) return;
  lastNotice = Date.now();
  toast(text, 4500);
}

export function voiceConfigured(): boolean {
  return !!getState().eleven.voiceId;
}

/** Blob id of the recording for this text, generating it on first use. Null when not possible. */
export async function ensureVoice(text: string, label = text.slice(0, 50)): Promise<string | null> {
  if (!voiceConfigured()) {
    notice("Wybierz głos ElevenLabs w Ustawieniach, żeby aplikacja mogła mówić.");
    return null;
  }
  const id = segmentId(text);
  if (await getBlob(id)) return id;
  const running = inflight.get(id);
  if (running) return running;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notice("Brak internetu — ten fragment nie był jeszcze nagrany.");
    return null;
  }
  const p = generateSpeech(text)
    .then((blob) => putBlob(blob, "cue", label, { text }, id))
    .catch((e) => {
      notice(e instanceof Error ? e.message : "Nie udało się wygenerować głosu.");
      return null;
    })
    .finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

/** Speaks with the ElevenLabs voice. Resolves when finished; false if it could not speak. */
export async function say(text: string, opts: { gain?: number; legacyId?: string } = {}): Promise<boolean> {
  let id: string | null = null;
  if (opts.legacyId && (await getBlob(opts.legacyId))) id = opts.legacyId;
  else id = await ensureVoice(text);
  if (!id) return false;
  try {
    const buf = await decodeBlob(id);
    if (!buf) return false;
    await playBuffer(buf, opts.gain ?? 0.9);
    return true;
  } catch {
    return false;
  }
}

/** Generates (in order, in the background) everything a session is about to say. */
export async function prefetchVoice(texts: string[]): Promise<boolean> {
  let ok = true;
  for (const t of texts) ok = (await ensureVoice(t)) !== null && ok;
  return ok;
}

export { stopVoice };
