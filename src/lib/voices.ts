import type { CollectionVoice, ElevenSettings } from "./types";

/** The model a voice speaks with: its own choice from the collection, otherwise the default model. */
export function modelFor(e: Pick<ElevenSettings, "voiceId" | "voices" | "modelId">, voiceId?: string): string {
  const id = voiceId || e.voiceId;
  return e.voices?.find((v) => v.id === id)?.modelId || e.modelId;
}

/**
 * Voice IDs from pasted text. Pasting on iOS can bring invisible characters (zero-width spaces, smart
 * punctuation, a whole URL), so IDs are picked out of the text instead of validating it as a whole.
 */
export function parseVoiceIds(text: string): string[] {
  const clean = text.normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
  return [...new Set(clean.match(/[A-Za-z0-9]{15,40}/g) ?? [])];
}

export function addToCollection(x: { voices?: CollectionVoice[] }, add: CollectionVoice[]) {
  const list = x.voices ?? [];
  for (const v of add) {
    const have = list.find((y) => y.id === v.id);
    if (!have) list.push(v);
    else if (v.modelId && !have.modelId) have.modelId = v.modelId;
  }
  x.voices = list;
}
