import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeKey } from "./access";
import { rateLimited } from "./rate-limit";

export { normalizeKey, mismatchHint } from "./access";

// overridable only for local testing against a mock
export const ELEVEN_BASE = process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io";

export function elevenKey(): string | null {
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

/** The client URI-encodes the code so any character survives the HTTP header. */
export function providedKey(req: Request): string {
  const raw = req.headers.get("x-decompressly-key") ?? "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* sent unencoded by an older version */
  }
  return normalizeKey(decoded);
}

export function configuredKey(): string {
  return normalizeKey(process.env.APP_ACCESS_KEY);
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** In production the paid endpoints require APP_ACCESS_KEY; locally (next dev) they work without it. */
export function accessRequired(): boolean {
  return Boolean(configuredKey()) || process.env.NODE_ENV === "production";
}

/** Returns an error response, or null when the request may proceed. */
/** `provider` names the upstream whose server key must be configured (default: ElevenLabs). */
export function guard(req: Request, opts: { paid: boolean; provider?: "eleven" | "anthropic" }): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = Number(process.env.RATE_LIMIT_PER_MIN) || (opts.paid ? 240 : 120);
  const wait = rateLimited(`${opts.paid ? "paid" : "free"}:${ip}`, limit);
  if (wait) {
    return NextResponse.json(
      { error: `Zbyt wiele żądań naraz. Generowanie wznowi się za ${wait} s.`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  const required = configuredKey();
  if (accessRequired()) {
    if (!required) {
      return NextResponse.json(
        { error: "Serwer nie ma ustawionego APP_ACCESS_KEY — płatne funkcje są wyłączone dla bezpieczeństwa." },
        { status: 503 },
      );
    }
    if (!safeEqual(providedKey(req), required)) {
      return NextResponse.json({ error: "Nieprawidłowy kod dostępu. Sprawdź go w Ustawieniach → ElevenLabs." }, { status: 401 });
    }
  }
  if (opts.paid && req.headers.get("x-confirm-paid") !== "1") {
    return NextResponse.json({ error: "Płatna generacja wymaga potwierdzenia w aplikacji." }, { status: 428 });
  }
  if (opts.provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Brak ANTHROPIC_API_KEY na serwerze.", code: "no_key" }, { status: 503 });
  } else if (!elevenKey()) {
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

const PERMISSION_LABELS: Record<string, string> = {
  voices_read: "Voices → Read",
  text_to_speech: "Text to Speech",
  sound_generation: "Sound Effects",
  models_read: "Models → Read",
};

/**
 * Turns an ElevenLabs error into a clear Polish message. Upstream auth errors are returned as 502,
 * so they are never confused with the app's own access-code 401.
 */
export async function elevenError(upstream: Response): Promise<NextResponse> {
  let status = "";
  let message = "";
  try {
    const j = await upstream.json();
    const d = j?.detail ?? j;
    status = typeof d?.status === "string" ? d.status : "";
    message = typeof d === "string" ? d : typeof d?.message === "string" ? d.message : JSON.stringify(d);
  } catch {
    message = await upstream.text().catch(() => "");
  }
  let error = `ElevenLabs ${upstream.status}: ${message}`.trim();
  if (status === "missing_permissions" || /missing.*permission/i.test(message)) {
    const perm = Object.keys(PERMISSION_LABELS).find((p) => message.includes(p));
    error = `Klucz API ElevenLabs nie ma uprawnienia${perm ? ` „${PERMISSION_LABELS[perm]}”` : ""}. W ElevenLabs → Developers → API Keys edytuj klucz i włącz je (albo ustaw dostęp bez ograniczeń), a potem odśwież.`;
  } else if (status === "invalid_api_key" || (upstream.status === 401 && /invalid|api key/i.test(message))) {
    error = "Klucz ELEVENLABS_API_KEY na serwerze jest nieprawidłowy albo wygasł. Wklej go ponownie w zmiennych hostingu i wdróż aplikację.";
  } else if (status === "voice_not_found" || /voice.*not.*found/i.test(message)) {
    error = "Nie znaleziono głosu o tym ID na Twoim koncie ElevenLabs.";
  } else if (status === "quota_exceeded" || /quota/i.test(message)) {
    error = "Brak kredytów na koncie ElevenLabs.";
  } else if (upstream.status === 429 || status === "too_many_concurrent_requests" || status === "system_busy") {
    error = "ElevenLabs jest chwilowo zajęty (limit równoczesnych żądań). Generowanie wznowi się za chwilę.";
  }
  const headers: Record<string, string> = {};
  const retry = upstream.headers.get("retry-after");
  if (retry) headers["Retry-After"] = retry;
  const busy = upstream.status === 429 || status === "system_busy";
  return NextResponse.json(
    { error, code: status || undefined },
    { status: busy ? 429 : upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status, headers },
  );
}

export async function relayAudio(upstream: Response): Promise<Response> {
  if (!upstream.ok) return elevenError(upstream);
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
