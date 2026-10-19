import { describe, expect, it } from "vitest";
import { SESSION_BY_ID, YOGA_SESSIONS, sessionTotal, stepStateAt, validateSessions } from "@/lib/yoga/sessions";
import { POSES } from "@/lib/yoga/poses";
import { FIGURES } from "@/lib/yoga/figures";
import { SessionClock, frameAt, sessionLengthMs, patternFor, clampPhase } from "@/lib/breath";
import { parseScript, estimateDuration, speechSegments } from "@/lib/audio/segments";
import { AUDIO_SESSIONS, personalize } from "@/lib/audio/scripts";
import { MANTRAS, MANDATORY_MANTRAS, MANTRA_CATEGORIES, mantraForDate } from "@/lib/mantras";
import { goalPhase, isDemobilization } from "@/lib/goal";
import { DEFAULT_GOAL } from "@/lib/defaults";
import { STYLE_PRESETS } from "@/lib/sounds";
import { HEALTH } from "@/lib/health";
import { shiftTime, weekKey, addDays } from "@/lib/dates";

describe("yoga", () => {
  it("has at least 12 complete poses with illustrations", () => {
    expect(POSES.length).toBeGreaterThanOrEqual(12);
    for (const p of POSES) {
      expect(p.name && p.english && p.start && p.exit && p.beginner && p.skipWhen && p.alt).toBeTruthy();
      expect(p.steps.length).toBeGreaterThan(2);
      expect(p.mistakes.length).toBeGreaterThan(0);
      expect(FIGURES[p.id], p.id).toBeDefined();
    }
  });
  it("main sessions are exactly 10/20/30 minutes", () => {
    expect(sessionTotal(SESSION_BY_ID.s10)).toBe(600);
    expect(sessionTotal(SESSION_BY_ID.s20)).toBe(1200);
    expect(sessionTotal(SESSION_BY_ID.s30)).toBe(1800);
  });
  it("sessions reference valid poses and two-sided steps only for bilateral poses", () => {
    expect(validateSessions()).toEqual([]);
    expect(YOGA_SESSIONS.length).toBeGreaterThanOrEqual(7);
  });
  it("schedules a side switch at the midpoint and a transition at the end", () => {
    const step = { poseId: "twist", seconds: 120, sides: 2 as const };
    expect(stepStateAt(step, 30, false).side).toBe(1);
    expect(stepStateAt(step, 60, false).phase).toBe("switch");
    expect(stepStateAt(step, 90, false).side).toBe(2);
    expect(stepStateAt(step, 115, false).phase).toBe("transition");
    expect(stepStateAt(step, 115, true).phase).toBe("hold");
  });
});

describe("breath", () => {
  it("follows 4/6 phases in real time", () => {
    const p = patternFor("calm", { inhale: 4, exhale: 6 })!;
    expect(frameAt(1000, p).phase).toBe("inhale");
    expect(frameAt(3999, p).phase).toBe("inhale");
    expect(frameAt(4001, p).phase).toBe("exhale");
    expect(frameAt(10_001, p).phase).toBe("inhale");
    expect(frameAt(10_001, p).cycle).toBe(1);
    expect(frameAt(4000, p).size).toBeCloseTo(1, 2);
    expect(frameAt(0, p).size).toBeCloseTo(0, 2);
  });
  it("always ends after a full exhale", () => {
    expect(sessionLengthMs(2, { inhale: 4, exhale: 6 })).toBe(120_000);
    expect(sessionLengthMs(2, { inhale: 3, exhale: 4 })).toBe(Math.ceil(120 / 7) * 7000);
  });
  it("custom rhythm is clamped to comfortable bounds (no holds, no extremes)", () => {
    expect(clampPhase(1)).toBe(2);
    expect(clampPhase(20)).toBe(8);
    expect(patternFor("natural", { inhale: 4, exhale: 6 })).toBeNull();
  });
  it("pause-aware clock does not catch up after a pause", () => {
    let now = 0;
    const c = new SessionClock(() => now);
    c.start();
    now = 5000;
    c.pause();
    now = 60_000; // app was in the background
    expect(c.elapsed()).toBe(5000);
    c.resume();
    now = 61_000;
    expect(c.elapsed()).toBe(6000);
  });
});

describe("audio scripts", () => {
  it("parses pauses into silence and never leaves markers in speech", () => {
    const segs = parseScript("Cześć.\n\n[pauza 8]\n\nDalej [pauza] w zdaniu.\n[cisza 2s]");
    expect(segs).toEqual([
      { kind: "speech", text: "Cześć." },
      { kind: "pause", seconds: 8 },
      { kind: "speech", text: "Dalej w zdaniu." },
      { kind: "pause", seconds: 2 },
    ]);
  });
  it("has 7 complete sessions close to their target length, addressed to Marek", () => {
    expect(AUDIO_SESSIONS.length).toBeGreaterThanOrEqual(7);
    for (const s of AUDIO_SESSIONS) {
      const segs = parseScript(personalize(s.script, "Marek"));
      const est = estimateDuration(segs);
      expect(Math.abs(est - s.minutes * 60) / (s.minutes * 60), s.id).toBeLessThan(0.12);
      for (const t of speechSegments(segs)) {
        expect(t).not.toMatch(/\[|\{name\}/);
        expect(t.length).toBeLessThan(2500);
      }
      expect(personalize(s.script, "Marek")).toContain("Marek");
    }
  });
  it("main session contains the requested core passage", () => {
    const demob = AUDIO_SESSIONS.find((s) => s.id === "demob")!.script;
    for (const line of ["Wyobraź sobie leżak w Esteponie.", "Za chwilę możesz pójść na spacer z Leonem.", "Możesz po prostu być.", "Twoja kreatywność nigdzie nie znika."]) expect(demob).toContain(line);
  });
});

describe("mantras", () => {
  it("has 60+ mantras in all 8 categories including all mandatory ones", () => {
    expect(MANTRAS.length).toBeGreaterThanOrEqual(60);
    for (const c of MANTRA_CATEGORIES) expect(MANTRAS.some((m) => m.category === c.id)).toBe(true);
    for (const t of MANDATORY_MANTRAS) expect(MANTRAS.some((m) => m.text === t), t).toBe(true);
  });
  it("is stable per day and respects the override", () => {
    const a = mantraForDate("2026-10-20", { custom: [] });
    expect(mantraForDate("2026-10-20", { custom: [] }).id).toBe(a.id);
    expect(mantraForDate("2026-10-20", { custom: [], override: { date: "2026-10-20", id: "m26" } }).id).toBe("m26");
  });
});

describe("goal", () => {
  it("maps dates to stages", () => {
    const p = goalPhase(DEFAULT_GOAL, "2026-10-18");
    expect(p.kind === "stage" && p.stage.id).toBe("closure");
    expect(isDemobilization(DEFAULT_GOAL, "2026-11-15")).toBe(true);
    const d = goalPhase(DEFAULT_GOAL, "2026-12-31");
    expect(d.kind === "stage" && d.stage.id).toBe("rhythm");
    expect(goalPhase(DEFAULT_GOAL, "2027-01-01").kind).toBe("after");
  });
});

describe("content & helpers", () => {
  it("four sound styles with START and CLOSE prompts", () => {
    expect(STYLE_PRESETS.map((s) => s.id).sort()).toEqual(["jazz", "nature", "orchestral", "system"]);
    for (const s of STYLE_PRESETS) {
      expect(s.start).toMatch(/Ten-second/);
      expect(s.close).toMatch(/Ten-second/);
    }
  });
  it("seven nervous-system categories with actions", () => {
    expect(HEALTH.map((h) => h.title)).toEqual(["Sleep", "Movement", "Breath", "Downshift", "Mindset", "Connection", "Stimulation"]);
  });
  it("time and date helpers", () => {
    expect(shiftTime("23:45", 30)).toBe("00:15");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(weekKey("2026-10-18")).toBe("2026-W42");
  });
});

import { THOUGHTS, THOUGHT_CATEGORIES, REFLECTION_QUESTIONS, pickThought, homeContext, contextsOf, normalizeSearch, PRESSURE_CONTEXTS, CONTEXTS } from "@/lib/thoughts";
import thoughtSnapshot from "./fixtures/thought-ids.json";

const noPrefs = { hidden: [] as string[], edits: {}, custom: [] };

describe("Moje myśli", () => {
  it("keeps all 130 thoughts, 18 questions and 12 categories with unique ids", () => {
    expect(THOUGHTS.length).toBe(130);
    expect(REFLECTION_QUESTIONS.length).toBe(18);
    expect(THOUGHT_CATEGORIES.length).toBe(12);
    expect(new Set(THOUGHTS.map((t) => t.id)).size).toBe(130);
    expect(THOUGHTS.filter((t) => t.star).length).toBe(12);
    for (const t of THOUGHTS) expect(t.text).not.toMatch(/^(★|~)/);
  });
  it("ids never move to a different thought — user edits survive app updates", () => {
    const snap = thoughtSnapshot as Record<string, string>;
    for (const [id, text] of Object.entries(snap)) expect(THOUGHTS.find((t) => t.id === id)?.text, id).toBe(text);
  });
  it("every thought has display contexts; every context has thoughts", () => {
    for (const t of THOUGHTS) expect(contextsOf(t, {}).length, t.id).toBeGreaterThan(0);
    for (const c of CONTEXTS) expect(pickThought(c.id, "2026-10-20", noPrefs), c.id).not.toBeNull();
  });
  it("one stable thought per day and moment, skipping hidden ones", () => {
    const a = pickThought("idea", "2026-10-20", noPrefs)!;
    expect(pickThought("idea", "2026-10-20", noPrefs)!.id).toBe(a.id);
    expect(["fomo", "create"]).toContain(a.category);
    expect(pickThought("idea", "2026-10-20", { ...noPrefs, hidden: [a.id] })!.id).not.toBe(a.id);
    expect(["demob", "fomo"]).toContain(pickThought("idea", "2026-11-03", noPrefs, { november: true })!.category);
  });
  it("respects the user's own choice of moments", () => {
    const t = THOUGHTS.find((x) => x.id === "energy-01")!;
    expect(contextsOf(t, { contexts: { "energy-01": ["trip"] } })).toEqual(["trip"]);
  });
  it("never shows gentle reminders about childhood in decision moments", () => {
    const gentle = THOUGHTS.filter((t) => t.gentle);
    expect(gentle.length).toBe(2);
    for (const t of gentle) {
      for (const c of PRESSURE_CONTEXTS) expect(contextsOf(t, { contexts: { [t.id]: [c] } })).not.toContain(c);
    }
  });
  it("picks the home moment from the time of day and the day's state", () => {
    expect(homeContext({ hour: 8, mode: "work", workState: "idle" })).toBe("morning");
    expect(homeContext({ hour: 13, mode: "work", workState: "working" })).toBe("idea");
    expect(homeContext({ hour: 16, mode: "work", workState: "working" })).toBe("workend");
    const closedAt = Date.now() - 20 * 60_000;
    expect(homeContext({ hour: 16, mode: "work", workState: "after", closedAt, now: Date.now() })).toBe("workend");
    expect(homeContext({ hour: 18, mode: "work", workState: "after", closedAt: Date.now() - 3 * 3600_000, now: Date.now() })).toBe("family");
    expect(homeContext({ hour: 11, mode: "rest" })).toBe("rest");
    expect(homeContext({ hour: 18, mode: "sick" })).toBe("family");
    expect(homeContext({ hour: 9, mode: "trip" })).toBe("trip");
  });
  it("search ignores case and Polish diacritics", () => {
    expect(normalizeSearch("Łagodność ŻYCIA")).toBe("lagodnosc zycia");
  });
});
