"use client";

import { getState } from "./store";
import { askConfirm } from "./ui-store";

export interface ServerStatus {
  elevenConfigured: boolean;
  accessRequired: boolean;
  accessConfigured: boolean;
  accessOk: boolean;
}

function headers(paid: boolean): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const key = getState().eleven.accessKey;
  if (key) h["x-decompressly-key"] = key;
  if (paid) h["x-confirm-paid"] = "1";
  return h;
}

export async function fetchStatus(): Promise<ServerStatus | null> {
  try {
    const r = await fetch("/api/status", { headers: headers(false), cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as ServerStatus;
  } catch {
    return null; // offline
  }
}

async function errorText(r: Response): Promise<string> {
  try {
    const j = await r.json();
    return j.error ?? `Błąd ${r.status}`;
  } catch {
    return `Błąd ${r.status}`;
  }
}

export class ElevenError extends Error {}

/**
 * Every paid call goes through an explicit confirmation. `approved` lets a caller that has
 * already confirmed a batch (e.g. all paragraphs of one session) skip per-request dialogs.
 */
export async function confirmPaid(what: string, detail: string): Promise<boolean> {
  return askConfirm("Płatna generacja ElevenLabs", `${what}\n\n${detail}\n\nZostaną zużyte kredyty z Twojego konta ElevenLabs.`, "Generuj");
}

export async function generateSound(text: string, opts: { duration?: number; promptInfluence?: number; loop?: boolean }): Promise<Blob> {
  const r = await fetch("/api/eleven/sound", {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ text, duration_seconds: opts.duration ?? 10, prompt_influence: opts.promptInfluence ?? 0.5, loop: opts.loop ?? false }),
  });
  if (!r.ok) throw new ElevenError(await errorText(r));
  return r.blob();
}

export async function generateSpeech(text: string, ctx: { previous?: string; next?: string } = {}): Promise<Blob> {
  const s = getState();
  if (!s.eleven.voiceId) throw new ElevenError("Najpierw wybierz głos w Ustawieniach → ElevenLabs.");
  const r = await fetch("/api/eleven/tts", {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({
      text,
      voice_id: s.eleven.voiceId,
      model_id: s.eleven.modelId,
      voice_settings: { stability: s.eleven.stability, similarity_boost: s.eleven.similarity, style: s.eleven.style, speed: s.eleven.speed },
      previous_text: ctx.previous,
      next_text: ctx.next,
      enable_logging: s.privacy.elevenLogging,
    }),
  });
  if (!r.ok) throw new ElevenError(await errorText(r));
  return r.blob();
}

export interface Voice {
  id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  previewUrl: string;
}

export async function listVoices(): Promise<Voice[]> {
  const r = await fetch("/api/eleven/voices", { headers: headers(false), cache: "no-store" });
  if (!r.ok) throw new ElevenError(await errorText(r));
  return ((await r.json()) as { voices: Voice[] }).voices;
}

/** Rough credit estimate: TTS ≈ 1 credit per character on multilingual v2 (varies by plan/model). */
export function describeChars(n: number): string {
  return `${n.toLocaleString("pl-PL")} znaków (orientacyjnie ok. ${n.toLocaleString("pl-PL")} kredytów; zależy od modelu i planu).`;
}
