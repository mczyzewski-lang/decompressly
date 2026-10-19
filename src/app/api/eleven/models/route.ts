import { NextResponse } from "next/server";
import { ELEVEN_BASE, elevenError, elevenKey, guard } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";

/** Text-to-speech models available on the account (free call), with a flag for Polish support. */
export async function GET(req: Request) {
  const denied = guard(req, { paid: false });
  if (denied) return denied;
  const r = await fetch(`${ELEVEN_BASE}/v1/models`, { headers: { "xi-api-key": elevenKey()! } });
  if (!r.ok) return elevenError(r);
  const list = (await r.json()) as { model_id: string; name: string; description?: string; can_do_text_to_speech?: boolean; languages?: { language_id: string }[] }[];
  const models = list
    .filter((m) => m.can_do_text_to_speech !== false)
    .map((m) => ({ id: m.model_id, name: m.name, polish: (m.languages ?? []).some((l) => l.language_id === "pl") }));
  return NextResponse.json({ models }, { headers: { "Cache-Control": "no-store" } });
}
