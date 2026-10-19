import { NextResponse } from "next/server";
import { ELEVEN_BASE, elevenError, elevenKey, guard } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";

interface RawVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
  preview_url?: string;
  category?: string;
}

const map = (v: RawVoice) => ({
  id: v.voice_id,
  name: v.name,
  category: v.category ?? "",
  labels: v.labels ?? {},
  previewUrl: v.preview_url ?? "",
});

/**
 * Lists voices (free call). scope=mine → "My Voices" (cloned, generated, professional, saved),
 * scope=all → also ElevenLabs' default voices. Uses /v2/voices with a /v1 fallback.
 */
export async function GET(req: Request) {
  const denied = guard(req, { paid: false });
  if (denied) return denied;
  const mine = new URL(req.url).searchParams.get("scope") !== "all";
  const headers = { "xi-api-key": elevenKey()! };

  const qs = new URLSearchParams({ page_size: "100" });
  if (mine) qs.set("voice_type", "personal");
  let r = await fetch(`${ELEVEN_BASE}/v2/voices?${qs}`, { headers });
  if (r.status === 401 || r.status === 403) return elevenError(r);
  if (r.ok) {
    const j = (await r.json()) as { voices?: RawVoice[] };
    const voices = (j.voices ?? []).map(map);
    if (voices.length || !mine) return NextResponse.json({ voices, scope: mine ? "mine" : "all" }, { headers: { "Cache-Control": "no-store" } });
  }
  // fallback: v1 lists everything; "mine" = everything that is not a premade voice
  r = await fetch(`${ELEVEN_BASE}/v1/voices`, { headers });
  if (!r.ok) return elevenError(r);
  const j = (await r.json()) as { voices?: RawVoice[] };
  const voices = (j.voices ?? []).filter((v) => !mine || v.category !== "premade").map(map);
  return NextResponse.json({ voices, scope: mine ? "mine" : "all" }, { headers: { "Cache-Control": "no-store" } });
}
