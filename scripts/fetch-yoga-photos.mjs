#!/usr/bin/env node
/**
 * Legal yoga photos from Wikimedia Commons — with a human review step.
 *
 *   npm run fetch:yoga-photos              → downloads license-checked candidates to ./yoga-photo-review
 *                                            and writes yoga-photo-review/index.html for review
 *   npm run fetch:yoga-photos -- approve <poseId> <n>
 *                                          → converts candidate n to WebP in public/yoga/photos/,
 *                                            records author/license/source in src/data/yoga-photos.json (approved: true)
 *   npm run fetch:yoga-photos -- revoke <poseId>
 *
 * Only freely reusable licenses are accepted (CC0, Public Domain, CC BY, CC BY-SA). Nothing is shown in
 * the app until you approve it — so a photo that only resembles a pose never slips in automatically.
 * Requires network access to commons.wikimedia.org / upload.wikimedia.org and ffmpeg (for WebP).
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW = join(ROOT, "yoga-photo-review");
const PUBLIC = join(ROOT, "public", "yoga", "photos");
const MANIFEST = join(ROOT, "src", "data", "yoga-photos.json");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "Decompressly/1.0 (private wellbeing app; yoga pose photo licensing check)";

const POSE_QUERIES = {
  seated: { categories: ["Sukhasana"], search: ["sukhasana easy pose yoga"] },
  catcow: { categories: ["Marjaryasana", "Bitilasana"], search: ["cat cow pose yoga marjaryasana"] },
  child: { categories: ["Balasana"], search: ["balasana child's pose"] },
  shoulders: { categories: [], search: ["shoulder rolls exercise seated"] },
  butterfly: { categories: ["Baddha Konasana"], search: ["baddha konasana bound angle pose"] },
  twist: { categories: ["Supta Matsyendrasana"], search: ["supine spinal twist yoga"] },
  constructive: { categories: [], search: ["constructive rest position lying knees bent"] },
  savasana: { categories: ["Shavasana"], search: ["savasana corpse pose yoga"] },
  needle: { categories: [], search: ["thread the needle yoga pose"] },
  hamstring: { categories: ["Supta Padangusthasana"], search: ["supta padangusthasana strap"] },
  chair: { categories: ["Viparita Karani"], search: ["legs on chair restorative yoga"] },
  kneeschest: { categories: ["Apanasana"], search: ["apanasana knees to chest pose"] },
};

const OK_LICENSE = /^(cc0|public domain|pd|cc[ -]by(-sa)?[ -]?\d(\.\d)?|cc by(-sa)? \d(\.\d)?)/i;

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`Commons API ${r.status}`);
  return r.json();
}

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function candidatesFor(q) {
  const titles = new Set();
  for (const c of q.categories) {
    const j = await api({ action: "query", list: "categorymembers", cmtitle: `Category:${c}`, cmtype: "file", cmlimit: "12" });
    for (const m of j.query?.categorymembers ?? []) titles.add(m.title);
  }
  for (const s of q.search) {
    const j = await api({ action: "query", list: "search", srsearch: `${s} filetype:bitmap`, srnamespace: "6", srlimit: "8" });
    for (const m of j.query?.search ?? []) titles.add(m.title);
  }
  const list = [...titles].slice(0, 20);
  if (!list.length) return [];
  const j = await api({ action: "query", titles: list.join("|"), prop: "imageinfo", iiprop: "url|extmetadata|mime|size", iiurlwidth: "1400" });
  return Object.values(j.query?.pages ?? {})
    .map((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii) return null;
      const md = ii.extmetadata ?? {};
      const license = strip(md.LicenseShortName?.value);
      return {
        title: p.title,
        url: ii.thumburl ?? ii.url,
        source: ii.descriptionurl,
        mime: ii.mime,
        width: ii.width,
        license,
        licenseUrl: md.LicenseUrl?.value ?? "",
        author: strip(md.Artist?.value) || "nieznany autor",
        attributionRequired: md.AttributionRequired?.value !== "false",
        description: strip(md.ImageDescription?.value).slice(0, 300),
      };
    })
    .filter((c) => c && /image\/(jpeg|png|webp)/.test(c.mime) && OK_LICENSE.test(c.license));
}

async function fetchAll() {
  mkdirSync(REVIEW, { recursive: true });
  const report = {};
  for (const [pose, q] of Object.entries(POSE_QUERIES)) {
    process.stdout.write(`${pose}… `);
    try {
      const cands = (await candidatesFor(q)).slice(0, 6);
      mkdirSync(join(REVIEW, pose), { recursive: true });
      report[pose] = [];
      for (let i = 0; i < cands.length; i++) {
        const c = cands[i];
        const r = await fetch(c.url, { headers: { "User-Agent": UA } });
        if (!r.ok) continue;
        const ext = c.mime === "image/png" ? "png" : c.mime === "image/webp" ? "webp" : "jpg";
        const file = join(REVIEW, pose, `${i + 1}.${ext}`);
        writeFileSync(file, Buffer.from(await r.arrayBuffer()));
        report[pose].push({ n: i + 1, file: `${pose}/${i + 1}.${ext}`, ...c });
      }
      console.log(`${report[pose].length} kandydatów`);
    } catch (e) {
      console.log(`błąd: ${e.message}`);
    }
  }
  writeFileSync(join(REVIEW, "candidates.json"), JSON.stringify(report, null, 2));
  const html = `<!doctype html><meta charset="utf-8"><title>Przegląd zdjęć jogi</title>
<style>body{font:14px -apple-system,sans-serif;margin:24px;background:#faf8f4;color:#2e302f}h2{margin-top:40px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}figure{margin:0;background:#fff;padding:10px;border-radius:12px}img{width:100%;height:220px;object-fit:contain;background:#eee}code{background:#eee;padding:2px 4px}</style>
<h1>Kandydaci — sprawdź poprawność pozycji i licencję</h1><p>Zatwierdź: <code>npm run fetch:yoga-photos -- approve &lt;poza&gt; &lt;numer&gt;</code></p>
${Object.entries(report)
  .map(
    ([pose, list]) => `<h2>${pose}</h2><div class="g">${list
      .map((c) => `<figure><img src="${c.file}"><figcaption><b>#${c.n}</b> ${c.title}<br>${c.license} · ${c.author}<br><a href="${c.source}">źródło</a><br><small>${c.description}</small></figcaption></figure>`)
      .join("") || "<p>Brak kandydatów z odpowiednią licencją — aplikacja użyje ilustracji SVG.</p>"}</div>`,
  )
  .join("")}`;
  writeFileSync(join(REVIEW, "index.html"), html);
  console.log(`\nOtwórz ${join(REVIEW, "index.html")} i zatwierdź wybrane zdjęcia.`);
}

function loadManifest() {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { photos: {} };
}

function approve(pose, n) {
  const report = JSON.parse(readFileSync(join(REVIEW, "candidates.json"), "utf8"));
  const c = report[pose]?.find((x) => x.n === Number(n));
  if (!c) throw new Error(`Brak kandydata ${pose} #${n}`);
  mkdirSync(PUBLIC, { recursive: true });
  const out = join(PUBLIC, `${pose}.webp`);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(REVIEW, c.file), "-vf", "scale='min(1400,iw)':-2", "-quality", "78", out]);
  } catch {
    copyFileSync(join(REVIEW, c.file), out.replace(/\.webp$/, "." + c.file.split(".").pop()));
  }
  const m = loadManifest();
  m.photos[pose] = {
    file: `/yoga/photos/${pose}.webp`,
    author: c.author,
    license: c.license,
    licenseUrl: c.licenseUrl,
    source: c.source,
    attribution: `Fot. ${c.author}, ${c.license}, Wikimedia Commons`,
    approved: true,
  };
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
  console.log(`✓ ${pose}: ${m.photos[pose].attribution}`);
}

function revoke(pose) {
  const m = loadManifest();
  delete m.photos[pose];
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
  console.log(`✓ ${pose}: wrócono do ilustracji SVG`);
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === "approve") approve(a, b);
else if (cmd === "revoke") revoke(a);
else await fetchAll();
