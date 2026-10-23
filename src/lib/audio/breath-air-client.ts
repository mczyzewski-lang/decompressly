"use client";

import { getBlob, putBlob } from "../db";
import { generateSound } from "../eleven-client";
import { AIR_PROMPTS, airLevel, airSampleId, airUrl, shapeRecording, type AirPhase } from "./breath-air";
import { decodeAny } from "./render";

/**
 * Makes sure a real breath recording exists for both phases of a pattern (ElevenLabs Sound Effects,
 * generated once per phase length and kept offline). Returns false when it could not be made —
 * the breath then uses the synthesized air instead.
 */
export async function prepareAirSamples(pattern: { inhale: number; exhale: number }): Promise<boolean> {
  let ok = true;
  for (const phase of ["inhale", "exhale"] as AirPhase[]) {
    const seconds = pattern[phase];
    const id = airSampleId(phase, seconds);
    if (await getBlob(id)) continue;
    try {
      const blob = await generateSound(AIR_PROMPTS[phase], { duration: Math.max(0.5, seconds), promptInfluence: 0.7 });
      await putBlob(blob, "sfx", phase === "inhale" ? `Odgłos wdechu ${seconds} s` : `Odgłos wydechu ${seconds} s`, { phase, seconds }, id);
    } catch (e) {
      console.warn("Odgłos oddechu", e);
      ok = false;
    }
  }
  return ok;
}

const urls = new Map<string, string>();

/** URL of the breath sound for a phase: the real recording if there is one, otherwise synthesized air. */
export async function resolveAirUrl(phase: AirPhase, seconds: number, volume: number): Promise<string> {
  const key = `${phase}|${seconds}|${volume.toFixed(2)}`;
  const hit = urls.get(key);
  if (hit) return hit;
  const rec = await getBlob(airSampleId(phase, seconds));
  if (rec) {
    try {
      const buf = await decodeAny(rec.blob);
      const channels = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i));
      const url = URL.createObjectURL(new Blob([shapeRecording(channels, buf.sampleRate, airLevel(volume))], { type: "audio/wav" }));
      urls.set(key, url);
      return url;
    } catch (e) {
      console.warn("Odgłos oddechu — nie udało się odczytać nagrania", e);
    }
  }
  return airUrl(phase, seconds, volume);
}
