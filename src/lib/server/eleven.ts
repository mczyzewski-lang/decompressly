import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const ELEVEN_BASE = "https://api.elevenlabs.io";

export function elevenKey(): string | null {
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** In production the paid endpoints require APP_ACCESS_KEY; locally (next dev) they work without it. */
export function accessRequired(): boolean {
  return Boolean(process.env.APP_ACCESS_KEY) || process.env.NODE_ENV === "production";
}

const hits = new Map<string, number[]>();

function rateLimited(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > limit;
}

/** Returns an error response, or null when the request may proceed. */
export function guard(req: Request, opts: { paid: boolean }): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "Zbyt wiele żądań. Spróbuj za chwilę." }, { status: 429 });

  const required = process.env.APP_ACCESS_KEY;
  if (accessRequired()) {
    if (!required) {
      return NextResponse.json(
        { error: "Serwer nie ma ustawionego APP_ACCESS_KEY — płatne funkcje są wyłączone dla bezpieczeństwa." },
        { status: 503 },
      );
    }
    const provided = req.headers.get("x-decompressly-key") ?? "";
    if (!safeEqual(provided, required)) return NextResponse.json({ error: "Nieprawidłowy kod dostępu." }, { status: 401 });
  }
  if (opts.paid && req.headers.get("x-confirm-paid") !== "1") {
    return NextResponse.json({ error: "Płatna generacja wymaga potwierdzenia w aplikacji." }, { status: 428 });
  }
  if (!elevenKey()) {
    return NextResponse.json({ error: "Brak ELEVENLABS_API_KEY na serwerze." }, { status: 503 });
  }
  return null;
}

// Per-instance daily character budget (simple cost guard; resets on cold start or new day).
let budgetDay = "";
let usedChars = 0;
export function consumeChars(n: number): boolean {
  const limit = Number(process.env.ELEVENLABS_DAILY_CHAR_LIMIT || 0);
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) {
    budgetDay = today;
    usedChars = 0;
  }
  if (limit > 0 && usedChars + n > limit) return false;
  usedChars += n;
  return true;
}

export async function relayAudio(upstream: Response): Promise<Response> {
  if (!upstream.ok) {
    let detail = "";
    try {
      const j = await upstream.json();
      detail = typeof j?.detail === "string" ? j.detail : j?.detail?.message ?? JSON.stringify(j?.detail ?? j);
    } catch {
      detail = await upstream.text().catch(() => "");
    }
    return NextResponse.json({ error: `ElevenLabs: ${upstream.status} ${detail}`.trim() }, { status: upstream.status === 401 ? 502 : upstream.status });
  }
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
      "x-character-count": upstream.headers.get("character-cost") ?? upstream.headers.get("x-character-count") ?? "",
    },
  });
}
