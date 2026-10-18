import type { BreathModeId } from "./types";

export interface BreathPattern {
  inhale: number; // seconds
  exhale: number; // seconds
}

export const BREATH_MODES: { id: BreathModeId; label: string; description: string; pattern: BreathPattern | null }[] = [
  { id: "calm", label: "Spokojny oddech", description: "Wdech 4 s, wydech 6 s. Bez zatrzymywania.", pattern: { inhale: 4, exhale: 6 } },
  { id: "gentle", label: "Łagodny oddech", description: "Wdech 3 s, wydech 4 s. Lżejsze tempo.", pattern: { inhale: 3, exhale: 4 } },
  { id: "natural", label: "Naturalny oddech", description: "Bez narzuconego tempa. Tylko spokojna wskazówka.", pattern: null },
  { id: "custom", label: "Własny rytm", description: "Ustaw wdech i wydech po swojemu.", pattern: null },
];

/** Comfortable bounds. No breath holds, nothing faster than 2 s or slower than 8 s per phase. */
export const PHASE_MIN = 2;
export const PHASE_MAX = 8;

export function clampPhase(v: number) {
  return Math.min(PHASE_MAX, Math.max(PHASE_MIN, Math.round(v * 2) / 2));
}

export function patternFor(mode: BreathModeId, custom: BreathPattern): BreathPattern | null {
  if (mode === "custom") return { inhale: clampPhase(custom.inhale), exhale: clampPhase(custom.exhale) };
  return BREATH_MODES.find((m) => m.id === mode)?.pattern ?? null;
}

export type Phase = "inhale" | "exhale";

export interface BreathFrame {
  phase: Phase | null;
  /** 0..1 progress inside the current phase */
  progress: number;
  /** 0..1 visual size of the circle */
  size: number;
  cycle: number;
  /** seconds left in the current phase (for subtle counters) */
  phaseRemaining: number;
}

const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

/** Natural-mode drift: a very slow, small-amplitude swell with no instructions attached. */
const NATURAL_PERIOD = 11;

export function frameAt(elapsedMs: number, pattern: BreathPattern | null): BreathFrame {
  const t = Math.max(0, elapsedMs) / 1000;
  if (!pattern) {
    const p = (t % NATURAL_PERIOD) / NATURAL_PERIOD;
    const size = 0.35 + 0.3 * (0.5 - 0.5 * Math.cos(2 * Math.PI * p));
    return { phase: null, progress: p, size, cycle: Math.floor(t / NATURAL_PERIOD), phaseRemaining: 0 };
  }
  const cycleLen = pattern.inhale + pattern.exhale;
  const cycle = Math.floor(t / cycleLen);
  const inCycle = t - cycle * cycleLen;
  if (inCycle < pattern.inhale) {
    const progress = inCycle / pattern.inhale;
    return { phase: "inhale", progress, size: easeInOutSine(progress), cycle, phaseRemaining: pattern.inhale - inCycle };
  }
  const progress = (inCycle - pattern.inhale) / pattern.exhale;
  // exhale: softer, slightly longer tail
  const size = 1 - easeInOutSine(progress);
  return { phase: "exhale", progress, size, cycle, phaseRemaining: cycleLen - inCycle };
}

/** Session length rounded up so the session always ends after a full exhale. */
export function sessionLengthMs(minutes: number, pattern: BreathPattern | null): number {
  const total = minutes * 60_000;
  if (!pattern) return total;
  const cycleMs = (pattern.inhale + pattern.exhale) * 1000;
  return Math.ceil(total / cycleMs) * cycleMs;
}

/**
 * Pause-aware clock based on performance.now(). Time spent paused (including while the
 * app sits in the background, which the UI turns into a pause) is never "caught up".
 */
export class SessionClock {
  private startedAt = 0;
  private accumulated = 0;
  running = false;
  constructor(private now: () => number = () => performance.now()) {}

  start() {
    this.accumulated = 0;
    this.startedAt = this.now();
    this.running = true;
  }
  pause() {
    if (!this.running) return;
    this.accumulated += this.now() - this.startedAt;
    this.running = false;
  }
  resume() {
    if (this.running) return;
    this.startedAt = this.now();
    this.running = true;
  }
  /** Shift elapsed time (e.g. skip ahead or extend). Positive = forward. */
  shift(ms: number) {
    this.accumulated = Math.max(0, this.accumulated + ms);
  }
  set(ms: number) {
    this.accumulated = Math.max(0, ms);
    if (this.running) this.startedAt = this.now();
  }
  elapsed(): number {
    return this.accumulated + (this.running ? this.now() - this.startedAt : 0);
  }
}
