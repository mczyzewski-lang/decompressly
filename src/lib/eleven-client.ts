"use client";

import { getState } from "./store";
import { modelFor } from "./voices";
import { askConfirm } from "./ui-store";

export interface ServerStatus {
  elevenConfigured: boolean;
  accessRequired: boolean;
  accessConfigured: boolean;
  accessOk: boolean;
  accessHint?: "empty" | "case" | "length" | "chars" | null;
}

function headers(paid: boolean): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const key = getState().eleven.accessKey.trim();
  // URI-encoded so that any character (also Polish letters) survives the HTTP header
  if (key) h["x-decompressly-key"] = encodeURIComponent(key);
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
  // by default generation starts immediately; the confirmation is an opt-in in Settings → ElevenLabs
  if (!getState().eleven.confirmBeforeGenerate) return true;
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

export async function generateSpeech(text: string, ctx: { previous?: string; next?: string; voiceId?: string } = {}): Promise<Blob> {
  const s = getState();
  const voiceId = ctx.voiceId || s.eleven.voiceId;
  if (!voiceId) throw new ElevenError("Najpierw wybierz głos w Ustawieniach → ElevenLabs.");
  const r = await fetch("/api/eleven/tts", {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      model_id: modelFor(s.eleven, voiceId),
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

export async function listVoices(scope: "mine" | "all" = "mine"): Promise<Voice[]> {
  const r = await fetch(`/api/eleven/voices?scope=${scope}`, { headers: headers(false), cache: "no-store" });
  if (!r.ok) throw new ElevenError(await errorText(r));
  return ((await r.json()) as { voices: Voice[] }).voices;
}

export interface ModelInfo {
  id: string;
  name: string;
  polish: boolean;
}

export async function listModels(): Promise<ModelInfo[]> {
  const r = await fetch("/api/eleven/models", { headers: headers(false), cache: "no-store" });
  if (!r.ok) throw new ElevenError(await errorText(r));
  return ((await r.json()) as { models: ModelInfo[] }).models;
}

/** Rough credit estimate: TTS ≈ 1 credit per character on multilingual v2 (varies by plan/model). */
export function describeChars(n: number): string {
  return `${n.toLocaleString("pl-PL")} znaków (orientacyjnie ok. ${n.toLocaleString("pl-PL")} kredytów; zależy od modelu i planu).`;
}
