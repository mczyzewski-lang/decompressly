import { NextResponse } from "next/server";
import { ELEVEN_BASE, elevenKey, guard } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";

/** Lists voices available on the ElevenLabs account (free call). */
export async function GET(req: Request) {
  const denied = guard(req, { paid: false });
  if (denied) return denied;
  const r = await fetch(`${ELEVEN_BASE}/v1/voices`, { headers: { "xi-api-key": elevenKey()! } });
  if (!r.ok) return NextResponse.json({ error: `ElevenLabs: ${r.status}` }, { status: 502 });
  const j = (await r.json()) as { voices?: { voice_id: string; name: string; labels?: Record<string, string>; preview_url?: string; category?: string }[] };
  const voices = (j.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    category: v.category ?? "",
    labels: v.labels ?? {},
    previewUrl: v.preview_url ?? "",
  }));
  return NextResponse.json({ voices }, { headers: { "Cache-Control": "no-store" } });
}
