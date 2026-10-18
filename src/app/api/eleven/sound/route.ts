import { NextResponse } from "next/server";
import { ELEVEN_BASE, elevenKey, guard, relayAudio } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Proxy for ElevenLabs Text to Sound Effects: POST /v1/sound-generation
 * Body: { text, duration_seconds (0.5–30), prompt_influence (0–1), model_id: "eleven_text_to_sound_v2", loop? }
 */
export async function POST(req: Request) {
  const denied = guard(req, { paid: true });
  if (denied) return denied;
  let body: { text?: unknown; duration_seconds?: unknown; prompt_influence?: unknown; loop?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 1000) return NextResponse.json({ error: "Opis dźwięku musi mieć 1–1000 znaków." }, { status: 400 });
  const duration = Math.min(30, Math.max(0.5, Number(body.duration_seconds ?? 10) || 10));
  const influence = Math.min(1, Math.max(0, Number(body.prompt_influence ?? 0.5)));

  const upstream = await fetch(`${ELEVEN_BASE}/v1/sound-generation?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": elevenKey()!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      duration_seconds: duration,
      prompt_influence: influence,
      model_id: "eleven_text_to_sound_v2",
      loop: body.loop === true,
    }),
  });
  return relayAudio(upstream);
}
