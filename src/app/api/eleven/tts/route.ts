import { NextResponse } from "next/server";
import { consumeChars, ELEVEN_BASE, elevenKey, guard, relayAudio } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODELS_WITH_LANGUAGE_CODE = new Set(["eleven_flash_v2_5", "eleven_turbo_v2_5", "eleven_v3"]);

/**
 * Proxy for ElevenLabs Text to Speech: POST /v1/text-to-speech/{voice_id}
 * The client sends one paragraph at a time; pauses are produced as real silence in the montage,
 * so no pause markers ever reach this endpoint.
 */
export async function POST(req: Request) {
  const denied = guard(req, { paid: true });
  if (denied) return denied;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }
  const text = typeof b.text === "string" ? b.text.trim() : "";
  const voiceId = typeof b.voice_id === "string" ? b.voice_id.trim() : "";
  if (!text || text.length > 2500) return NextResponse.json({ error: "Tekst musi mieć 1–2500 znaków." }, { status: 400 });
  if (/\[(pauza|cisza|pause)/i.test(text)) return NextResponse.json({ error: "Znaczniki pauz nie są wysyłane do TTS." }, { status: 400 });
  if (!/^[A-Za-z0-9]{10,40}$/.test(voiceId)) return NextResponse.json({ error: "Wybierz głos w ustawieniach." }, { status: 400 });
  if (!consumeChars(text.length)) return NextResponse.json({ error: "Osiągnięto dzienny limit znaków ustawiony na serwerze." }, { status: 429 });

  const modelId = typeof b.model_id === "string" && /^[a-z0-9_]+$/.test(b.model_id) ? b.model_id : "eleven_multilingual_v2";
  const vs = (b.voice_settings ?? {}) as Record<string, unknown>;
  const num = (v: unknown, d: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, typeof v === "number" ? v : d));
  const payload: Record<string, unknown> = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: num(vs.stability, 0.6, 0, 1),
      similarity_boost: num(vs.similarity_boost, 0.75, 0, 1),
      style: num(vs.style, 0.1, 0, 1),
      use_speaker_boost: true,
      speed: num(vs.speed, 0.9, 0.7, 1.2),
    },
  };
  if (MODELS_WITH_LANGUAGE_CODE.has(modelId)) payload.language_code = "pl";
  if (typeof b.previous_text === "string" && b.previous_text) payload.previous_text = b.previous_text.slice(-600);
  if (typeof b.next_text === "string" && b.next_text) payload.next_text = b.next_text.slice(0, 600);

  const logging = b.enable_logging === true ? "true" : "false";
  const upstream = await fetch(
    `${ELEVEN_BASE}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128&enable_logging=${logging}`,
    {
      method: "POST",
      headers: { "xi-api-key": elevenKey()!, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(payload),
    },
  );
  return relayAudio(upstream);
}
