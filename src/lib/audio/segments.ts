/**
 * Script format (editable in the app):
 *  - paragraphs separated by a blank line are spoken as separate segments,
 *  - a line "[pauza 8]" (or "[pauza 8s]", "[cisza 60]") inserts real silence of N seconds,
 *  - a bare "[pauza]" means 5 seconds.
 * Pause markers are never sent to text-to-speech — they become silence in the montage.
 */
export type Segment = { kind: "speech"; text: string } | { kind: "pause"; seconds: number } | { kind: "motif"; which: "start" | "close" };

/** How much a motif adds to the timeline (sound length minus the overlap with the next words). */
export const MOTIF_SECONDS = 17.5;

export const DEFAULT_GAP = 1.2; // seconds between consecutive spoken paragraphs
export const WORDS_PER_SECOND = 2.0; // calm Polish narration at speed ≈ 0.9

const PAUSE_RE = /^\[(?:pauza|cisza|pause)(?:\s+(\d+(?:[.,]\d+)?)\s*s?)?\]$/i;
const MOTIF_RE = /^\[(?:motyw|motif|dźwięk|dzwiek)(?:\s+(start|close|stop|koniec|początek|poczatek))?\]$/i;
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
      out.push({ kind: "motif", which: w === "close" || w === "stop" || w === "koniec" ? "close" : "start" });
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
    else if (s.kind === "motif") total += MOTIF_SECONDS;
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
export function withMotif(segments: Segment[], motif: "none" | "start" | "close"): Segment[] {
  if (segments.some((s) => s.kind === "motif") || motif === "none") return segments;
  return motif === "start" ? [{ kind: "motif", which: "start" }, ...segments] : [...segments, { kind: "motif", which: "close" }];
}

export function hasScriptMotif(segments: Segment[]): boolean {
  return segments.some((s) => s.kind === "motif");
}

/** Silences and motif positions — everything except the spoken words. */
export function layoutKey(segments: Segment[]): string {
  return segments.map((s) => (s.kind === "speech" ? "s" : s.kind === "pause" ? `p${s.seconds}` : `m${s.which}`)).join(",");
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
