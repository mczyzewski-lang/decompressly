import { NextResponse } from "next/server";
import { accessRequired, elevenKey, safeEqual } from "@/lib/server/eleven";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const required = accessRequired();
  const configuredKey = process.env.APP_ACCESS_KEY;
  const provided = req.headers.get("x-decompressly-key") ?? "";
  return NextResponse.json(
    {
      elevenConfigured: Boolean(elevenKey()),
      accessRequired: required,
      accessConfigured: Boolean(configuredKey),
      accessOk: !required || (Boolean(configuredKey) && safeEqual(provided, configuredKey!)),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
