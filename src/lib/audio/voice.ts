"use client";

import { blobUrl, getBlob, putBlob } from "../db";
import { generateSpeech } from "../eleven-client";
import { getState } from "../store";
import { toast } from "../ui-store";
import { segmentId } from "./narration";
import { playVoiceUrl, stopVoice } from "./engine";

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

export interface VoiceOpts {
  /** another voice from the collection (e.g. the yoga voice); default: the main voice */
  voiceId?: string;
  /** livelier delivery: more expressive and a little faster (recorded separately) */
  lively?: boolean;
  /** background preparation: failures stay silent — the moment of speaking will report them */
  quiet?: boolean;
}

/** Blob id of the recording for this text, generating it on first use. Null when not possible. */
export async function ensureVoice(text: string, label = text.slice(0, 50), opts: VoiceOpts = {}): Promise<string | null> {
  const tell = opts.quiet ? () => {} : notice;
  if (!voiceConfigured()) {
    tell("Wybierz głos ElevenLabs w Ustawieniach, żeby aplikacja mogła mówić.");
    return null;
  }
  const id = segmentId(text, opts.voiceId, opts.lively ? "lively" : undefined);
  if (await getBlob(id)) return id;
  const running = inflight.get(id);
  if (running) return running;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    tell("Brak internetu — ten fragment nie był jeszcze nagrany.");
    return null;
  }
  const p = generateSpeech(text, { voiceId: opts.voiceId, lively: opts.lively })
    .then((blob) => putBlob(blob, "cue", label, { text }, id))
    .catch((e) => {
      tell(e instanceof Error ? e.message : "Nie udało się wygenerować głosu.");
      return null;
    })
    .finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

/** Speaks with the ElevenLabs voice. Resolves when finished; false if it could not speak. */
export async function say(text: string, opts: { gain?: number; legacyId?: string } & VoiceOpts = {}): Promise<boolean> {
  let id: string | null = null;
  if (opts.legacyId && (await getBlob(opts.legacyId))) id = opts.legacyId;
  else id = await ensureVoice(text, undefined, { voiceId: opts.voiceId, lively: opts.lively });
  if (!id) return false;
  const url = await blobUrl(id);
  if (!url) return false;
  return playVoiceUrl(url, Math.min(1, (opts.gain ?? 0.9) + 0.1));
}

/** Generates (in order, in the background) everything a session is about to say. */
export async function prefetchVoice(texts: string[], opts: VoiceOpts = {}): Promise<boolean> {
  let ok = true;
  for (const t of texts) ok = (await ensureVoice(t, undefined, opts)) !== null && ok;
  return ok;
}

export { stopVoice };
