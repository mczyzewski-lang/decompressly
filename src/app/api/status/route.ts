import { NextResponse } from "next/server";
import { accessRequired, configuredKey, elevenKey, mismatchHint, providedKey, safeEqual } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const required = accessRequired();
  const expected = configuredKey();
  const provided = providedKey(req);
  const ok = !required || (Boolean(expected) && safeEqual(provided, expected));
  return NextResponse.json(
    {
      elevenConfigured: Boolean(elevenKey()),
      accessRequired: required,
      accessConfigured: Boolean(expected),
      accessOk: ok,
      // only a coarse, non-secret reason, so typos can be fixed without exposing the code
      accessHint: ok ? null : mismatchHint(provided, expected),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
