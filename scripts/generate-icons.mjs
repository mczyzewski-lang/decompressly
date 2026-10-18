#!/usr/bin/env node
// Rasterises public/icons/icon.svg into PNG icons using the bundled Chromium (Playwright).
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const svg = readFileSync(join(dir, "icon.svg"), "utf8");
const exe = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
const shots = [
  { name: "icon-192.png", size: 192, full: false },
  { name: "icon-512.png", size: 512, full: false },
  { name: "apple-touch-icon.png", size: 180, full: true },
  { name: "maskable-512.png", size: 512, full: true },
];
for (const s of shots) {
  // full-bleed variants (iOS adds its own rounded mask; maskable needs a safe zone)
  const body = s.full ? svg.replace('rx="112"', 'rx="0"').replace(/r="150"/g, 'r="128"').replace('r="72"', 'r="62"') : svg;
  await page.setViewportSize({ width: s.size, height: s.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${body.replace("<svg ", `<svg width="${s.size}" height="${s.size}" `)}</body></html>`);
  await page.screenshot({ path: join(dir, s.name), omitBackground: !s.full });
  console.log("✓", s.name);
}
await browser.close();
