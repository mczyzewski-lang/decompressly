/**
 * Script format (editable in the app):
 *  - paragraphs separated by a blank line are spoken as separate segments,
 *  - a line "[pauza 8]" (or "[pauza 8s]", "[cisza 60]") inserts real silence of N seconds,
 *  - a bare "[pauza]" means 5 seconds.
 * Pause markers are never sent to text-to-speech — they become silence in the montage.
 */
/** level < 1 = a quiet echo that plays under the following silence (does not add time) */
export type Segment = { kind: "speech"; text: string } | { kind: "pause"; seconds: number } | { kind: "motif"; which: "start" | "close"; level?: number };

/** Quiet echoes of the motif in the second half (softest → a little louder), then the full motif at the end. */
export const MOTIF_ECHO_MIN = 0.1;
export const MOTIF_ECHO_MAX = 0.25;
/** Echoes never come more often than this (and the last one keeps this distance from the final motif). */
export const MOTIF_ECHO_SPACING = 120;

/** Session lengths offered for every recording, in minutes. */
export const LENGTHS = [10, 15, 20, 30] as const;

/** The offered length closest to a session's natural length (rounding up). */
export function defaultLength(minutes: number): number {
  return LENGTHS.find((l) => l >= minutes) ?? LENGTHS[LENGTHS.length - 1];
}

/**
 * Length variants in one script: "[od 20]" … "[/od]" is spoken only in sessions of 20 minutes or more,
 * "[do 15]" … "[/do]" only in sessions of 15 minutes or less. Markers stand on their own lines.
 */
export function selectLength(script: string, minutes: number): string {
  let out = script;
  // innermost blocks first, so blocks can be nested
  const re = /^[ \t]*\[(od|do)\s+(\d+)\][ \t]*\n((?:(?!^[ \t]*\[(?:od|do)\s+\d+\])[\s\S])*?)^[ \t]*\[\/(?:od|do)\][ \t]*$/im;
  for (let guard = 0; guard < 500; guard++) {
    const m = re.exec(out);
    if (!m) break;
    const n = Number(m[2]);
    const keep = m[1].toLowerCase() === "od" ? minutes >= n : minutes <= n;
    out = out.slice(0, m.index) + (keep ? m[3] : "") + out.slice(m.index + m[0].length);
  }
  return out.replace(/^[ \t]*\[\/?(?:od|do)(?:\s+\d+)?\][ \t]*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Pause multiplier that brings the whole session close to the chosen length (roughly — it is not a stopwatch). */
export function fitPauseScale(segments: Segment[], minutes: number, gap = DEFAULT_GAP): number {
  const pauses = segments.reduce((a, s) => a + (s.kind === "pause" ? s.seconds : 0), 0);
  if (pauses <= 0) return 1;
  const fixed = estimateDuration(segments, gap) - pauses;
  const scale = (minutes * 60 - fixed) / pauses;
  return Math.round(Math.min(4, Math.max(0.6, scale)) * 100) / 100;
}

/** How much a motif adds to the timeline (sound length minus the overlap with the next words). */
export const MOTIF_SECONDS = 17.5;

export const DEFAULT_GAP = 1.2; // seconds between consecutive spoken paragraphs
export const WORDS_PER_SECOND = 2.0; // calm Polish narration at speed ≈ 0.9

const PAUSE_RE = /^\[(?:pauza|cisza|pause)(?:\s+(\d+(?:[.,]\d+)?)\s*s?)?\]$/i;
const MOTIF_RE = /^\[(?:motyw|motif|dźwięk|dzwiek)(?:\s+(start|close|stop|koniec|początek|poczatek))?(?:\s+(\d{1,3})\s*%)?\]$/i;
const INLINE_PAUSE_RE = /\[(?:pauza|cisza|pause)(?:\s+\d+(?:[.,]\d+)?\s*s?)?\]/gi;

export function parseScript(script: string): Segment[] {
  const out: Segment[] = [];
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (text) out.push({ kind: "speech", text });
    buffer = [];
  };
  for (const rawLine of script.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const mm = line.match(MOTIF_RE);
    if (mm) {
      flush();
      const w = (mm[1] ?? "start").toLowerCase();
      const level = mm[2] ? Math.min(100, Math.max(5, Number(mm[2]))) / 100 : 1;
      out.push({ kind: "motif", which: w === "close" || w === "stop" || w === "koniec" ? "close" : "start", ...(level < 1 ? { level } : {}) });
      continue;
    }
    const m = line.match(PAUSE_RE);
    if (m) {
      flush();
      const secs = m[1] ? Number(m[1].replace(",", ".")) : 5;
      const last = out[out.length - 1];
      if (last?.kind === "pause") last.seconds += secs;
      else out.push({ kind: "pause", seconds: secs });
      continue;
    }
    // inline markers inside a sentence are stripped defensively — never spoken
    buffer.push(line.replace(INLINE_PAUSE_RE, " ").trim());
  }
  flush();
  return out;
}

export interface Pacing {
  pauseScale: number;
  gap: number;
}

export const DEFAULT_PACING: Pacing = { pauseScale: 1, gap: DEFAULT_GAP };

/** Longer (or shorter) silences without touching the spoken text — no new TTS needed. */
export function applyPacing(segments: Segment[], pacing: Pacing): Segment[] {
  if (pacing.pauseScale === 1) return segments;
  return segments.map((s) => (s.kind === "pause" ? { kind: "pause", seconds: Math.round(s.seconds * pacing.pauseScale * 10) / 10 } : s));
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateSpeechSeconds(text: string): number {
  return wordCount(text) / WORDS_PER_SECOND;
}

/** Estimated total duration of a parsed script, in seconds. */
export function estimateDuration(segments: Segment[], gap = DEFAULT_GAP): number {
  let total = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.kind === "pause") total += s.seconds;
    else if (s.kind === "motif") total += (s.level ?? 1) < 1 ? 0 : MOTIF_SECONDS;
    else {
      total += estimateSpeechSeconds(s.text);
      if (segments[i + 1]?.kind === "speech") total += gap;
    }
  }
  return total;
}

/**
 * The session's motif setting places START at the beginning or CLOSE at the end — unless the
 * script already says where motifs go ("[motyw start]", "[motyw close]"), which always wins.
 */
export function withMotif(segments: Segment[], motif: "none" | "start" | "close", opts: { ramp?: boolean; gap?: number } = {}): Segment[] {
  if (segments.some((s) => s.kind === "motif") || motif === "none") return segments;
  if (motif === "start") return [{ kind: "motif", which: "start" }, ...segments];
  if (!opts.ramp) return [...segments, { kind: "motif", which: "close" }];
  // growing echoes: at long silences of the second half, never closer than MOTIF_ECHO_SPACING to each other or
  // to the final motif — e.g. a 5-minute second half gets two quiet echoes
  const total = estimateDuration(segments, opts.gap);
  const gap = opts.gap ?? DEFAULT_GAP;
  const starts: number[] = [];
  let t = 0;
  segments.forEach((s, i) => {
    starts.push(t);
    if (s.kind === "pause") t += s.seconds;
    else if (s.kind === "speech") t += estimateSpeechSeconds(s.text) + (segments[i + 1]?.kind === "speech" ? gap : 0);
  });
  const half = total / 2;
  const END_GAP = 60; // the last echo keeps a little distance from the full motif
  const candidates = segments
    .map((s, i) => ({ s, i, at: starts[i] }))
    .filter((c) => c.s.kind === "pause" && c.s.seconds >= 8 && c.at >= half && total - c.at >= END_GAP);
  let n = Math.floor(half / MOTIF_ECHO_SPACING);
  while (n > 0 && half - END_GAP - (n - 1) * MOTIF_ECHO_SPACING < 0) n--;
  const slack = half - END_GAP - (n - 1) * MOTIF_ECHO_SPACING;
  const picks: number[] = [];
  let last = -Infinity;
  for (let k = 0; k < n; k++) {
    const target = Math.max(half + slack / 2 + k * MOTIF_ECHO_SPACING, last + MOTIF_ECHO_SPACING);
    const ok = candidates.filter((c) => c.at - last >= MOTIF_ECHO_SPACING);
    const best = ok.find((c) => c.at >= target) ?? ok.filter((c) => c.at < target).at(-1);
    if (!best) continue;
    picks.push(best.i);
    last = best.at;
  }
  picks.sort((a, b) => a - b);
  const levels = picks.map((_, k) => (picks.length === 1 ? MOTIF_ECHO_MIN : MOTIF_ECHO_MIN + ((MOTIF_ECHO_MAX - MOTIF_ECHO_MIN) * k) / (picks.length - 1)));
  levels.forEach((l, k) => (levels[k] = Math.round(l * 100) / 100));
  const out: Segment[] = [];
  segments.forEach((s, i) => {
    const k = picks.indexOf(i);
    if (k >= 0) out.push({ kind: "motif", which: "close", level: levels[k] });
    out.push(s);
  });
  out.push({ kind: "motif", which: "close" });
  return out;
}

export function hasScriptMotif(segments: Segment[]): boolean {
  return segments.some((s) => s.kind === "motif");
}

/** Silences and motif positions — everything except the spoken words. */
export function layoutKey(segments: Segment[]): string {
  return segments.map((s) => (s.kind === "speech" ? "s" : s.kind === "pause" ? `p${s.seconds}` : `m${s.which}${s.level ?? ""}`)).join(",");
}

export function speechSegments(segments: Segment[]): string[] {
  return segments.filter((s): s is { kind: "speech"; text: string } => s.kind === "speech").map((s) => s.text);
}

export function totalCharacters(segments: Segment[]): number {
  return speechSegments(segments).reduce((a, t) => a + t.length, 0);
}

/** Small stable hash for caching generated segments by their exact text + voice. */
export function textKey(text: string, voiceId: string, modelId: string): string {
  let h = 5381;
  const s = `${voiceId}|${modelId}|${text}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `seg-${(h >>> 0).toString(36)}-${s.length}`;
}
