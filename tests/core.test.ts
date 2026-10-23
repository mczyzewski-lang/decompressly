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
      const segs = parseScript(personalize(s.script, { nom: "Marek", voc: "Marku" }));
      const est = estimateDuration(segs);
      expect(Math.abs(est - s.minutes * 60) / (s.minutes * 60), s.id).toBeLessThan(0.12);
      for (const t of speechSegments(segs)) {
        expect(t).not.toMatch(/\[|\{name\}/);
        expect(t.length).toBeLessThan(2500);
      }
      expect(personalize(s.script, { nom: "Marek", voc: "Marku" })).toContain("Marku");
    }
  });
  it("main session contains the requested core passage", () => {
    const demob = AUDIO_SESSIONS.find((s) => s.id === "demob")!.script;
    for (const line of ["Wyobraź sobie leżak w Esteponie.", "Za chwilę możesz pójść na spacer z Leonem.", "Możesz po prostu być", "Twoja kreatywność nigdzie nie znika.", "To jest ten czas, {imię}."]) expect(demob).toContain(line);
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
      expect(s.start).toMatch(/^Twenty-second .*energizing/i);
      expect(s.close).toMatch(/^Twenty-second .*(calming|relaxing)/i);
      expect(s.start).toMatch(/five-note signature melody/);
      expect(s.close).toMatch(/same .*five-note signature melody/);
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

import { normalizeKey, mismatchHint } from "@/lib/server/access";

describe("access code", () => {
  it("ignores whitespace, newlines, wrapping quotes and iOS smart punctuation", () => {
    expect(normalizeKey("  abc-123\n")).toBe("abc-123");
    expect(normalizeKey('"abc-123"')).toBe("abc-123");
    expect(normalizeKey("abc–123​")).toBe("abc-123");
    expect(normalizeKey("“kod”")).toBe("kod");
  });
  it("gives a coarse hint without revealing the code", () => {
    expect(mismatchHint("Abc", "abc")).toBe("case");
    expect(mismatchHint("abcd", "abc")).toBe("length");
    expect(mismatchHint("abd", "abc")).toBe("chars");
    expect(mismatchHint("", "abc")).toBe("empty");
    expect(mismatchHint("abc", "abc")).toBeNull();
  });
});

import { applyPacing } from "@/lib/audio/segments";
import { promptForDuration } from "@/lib/sounds";

describe("pacing and sound length", () => {
  it("longer pauses scale only silences", () => {
    const segs = parseScript("A.\n\n[pauza 10]\n\nB.");
    expect(applyPacing(segs, { pauseScale: 3, gap: 6 })).toEqual([
      { kind: "speech", text: "A." },
      { kind: "pause", seconds: 30 },
      { kind: "speech", text: "B." },
    ]);
    expect(estimateDuration(parseScript("A.\n\nB."), 6)).toBeGreaterThan(estimateDuration(parseScript("A.\n\nB.")) + 4);
  });
  it("prompt mentions the requested length", () => {
    expect(promptForDuration("Ten-second calm sound.", 20)).toBe("Twenty-second calm sound.");
    expect(promptForDuration("Twenty-second calm sound.", 30)).toBe("Thirty-second calm sound.");
    expect(promptForDuration("Calm sound.", 30)).toMatch(/^Thirty-second/);
  });
});

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

describe("voice", () => {
  it("the app never uses the system speech synthesizer", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f)) files.push(p);
      }
    };
    walk(join(__dirname, "..", "src"));
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/speechSynthesis|SpeechSynthesisUtterance/);
  });
});

import { vocative, fillName } from "@/lib/names";

describe("polish vocative", () => {
  it("declines common names", () => {
    expect(vocative("Marek")).toBe("Marku");
    expect(vocative("Piotr")).toBe("Piotrze");
    expect(vocative("Paweł")).toBe("Pawle");
    expect(vocative("Łukasz")).toBe("Łukaszu");
    expect(vocative("Monika")).toBe("Moniko");
    expect(vocative("Gaja")).toBe("Gajo");
    expect(vocative("Leon")).toBe("Leonie");
    expect(vocative("Krzysztof")).toBe("Krzysztofie");
    expect(vocative("Andrzej")).toBe("Andrzeju");
    expect(vocative("Robert")).toBe("Robercie");
  });
  it("fills both forms", () => {
    expect(fillName("{imię}, to jest ten czas, {imię_m}.", { nom: "Marek", voc: "Marku" })).toBe("Marku, to jest ten czas, Marek.");
    expect(fillName("{name}", { nom: "Marek", voc: "Marku" })).toBe("Marku");
  });
});

import { withMotif, layoutKey, MOTIF_SECONDS } from "@/lib/audio/segments";

describe("motifs in the script", () => {
  it("parses motif markers and shows them in the timeline", () => {
    const segs = parseScript("Cześć.\n\n[motyw start]\n\nDalej.\n[motyw close]");
    expect(segs).toEqual([
      { kind: "speech", text: "Cześć." },
      { kind: "motif", which: "start" },
      { kind: "speech", text: "Dalej." },
      { kind: "motif", which: "close" },
    ]);
    expect(estimateDuration(segs)).toBeGreaterThan(2 * MOTIF_SECONDS);
  });
  it("places the session motif unless the script already does", () => {
    const plain = parseScript("A.\n\nB.");
    expect(withMotif(plain, "start")[0]).toEqual({ kind: "motif", which: "start" });
    expect(withMotif(plain, "close").at(-1)).toEqual({ kind: "motif", which: "close" });
    const marked = parseScript("A.\n[motyw close]\nB.");
    expect(withMotif(marked, "start")).toEqual(marked);
    expect(layoutKey(withMotif(plain, "start"))).toBe("mstart,s,s");
  });
});

import { MOTIF_RAMP } from "@/lib/audio/segments";
import { AUDIO_BY_ID } from "@/lib/audio/scripts";

describe("growing motif", () => {
  it("echoes the CLOSE motif quietly in the second half and plays it fully at the end", () => {
    const segs = withMotif(parseScript(personalize(AUDIO_BY_ID.demob.script, { nom: "Marek", voc: "Marku" })), "close", { ramp: true });
    const motifs = segs.filter((s): s is { kind: "motif"; which: "close" | "start"; level?: number } => s.kind === "motif");
    expect(motifs.map((m) => m.level ?? 1)).toEqual([...MOTIF_RAMP, 1]);
    expect(segs.at(-1)).toEqual({ kind: "motif", which: "close" });
    // the first echo sits in the second half
    const firstIdx = segs.findIndex((s) => s.kind === "motif");
    expect(estimateDuration(segs.slice(0, firstIdx))).toBeGreaterThan(estimateDuration(segs) / 2 - 30);
  });
  it("markers can set the level", () => {
    expect(parseScript("[motyw close 35%]")).toEqual([{ kind: "motif", which: "close", level: 0.35 }]);
  });
});

import { airEnvelope, airLevel, encodeWav, renderAir, AIR_RATE } from "@/lib/audio/breath-air";

describe("breath air sound", () => {
  it("is soft, smooth at the edges and exactly one phase long", () => {
    for (const phase of ["inhale", "exhale"] as const) {
      const x = renderAir(phase, 4, airLevel(0.4));
      expect(x.length).toBe(4 * AIR_RATE);
      let peak = 0;
      for (const v of x) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak).toBeLessThanOrEqual(airLevel(0.4) + 1e-6);
      expect(peak).toBeLessThan(0.2);
      expect(Math.abs(x[0])).toBeLessThan(1e-3);
      expect(Math.abs(x[x.length - 1])).toBeLessThan(1e-3);
    }
  });
  it("inhale peaks late, exhale early", () => {
    const peakAt = (ph: "inhale" | "exhale") => {
      let best = 0, at = 0;
      for (let p = 0; p <= 1; p += 0.01) if (airEnvelope(ph, p) > best) [best, at] = [airEnvelope(ph, p), p];
      return at;
    };
    expect(peakAt("inhale")).toBeGreaterThan(0.6);
    expect(peakAt("exhale")).toBeLessThan(0.3);
  });
  it("never exceeds a gentle ceiling, even at 100%", () => {
    expect(airLevel(1)).toBeLessThanOrEqual(0.45);
    expect(encodeWav(new Float32Array(10)).byteLength).toBe(64);
  });
});

import { PATHS, parsePathSessionId, sanitizeReflection, stepOpen, currentStep, threadFor, weaveEcho } from "@/lib/paths";
import type { PathRun } from "@/lib/types";

describe("paths: audio → reflection → audio", () => {
  const path = PATHS[0];
  const run = (notes: PathRun["notes"]): PathRun => ({ id: "r", pathId: path.id, startedAt: 0, notes });

  it("every step has an {echo} place, a question, and parses as a session id", () => {
    for (const s of path.steps) {
      expect(s.script).toContain("{echo}");
      expect(s.question.length).toBeGreaterThan(5);
      expect(parsePathSessionId(`p.${path.id}.${s.n}`)?.step.n).toBe(s.n);
    }
    expect(parsePathSessionId("demob")).toBeNull();
  });

  it("the next session quotes the previous reflection, sanitized", () => {
    const r = run({ 1: { text: "Ciągle myślę o pracy [pauza 99] {imię}\n\ni o tym, co nie wyszło.", at: 1 } });
    const script = weaveEcho(path.steps[1].script, path.steps[1], r);
    expect(script).toContain("„Ciągle myślę o pracy pauza 99 imię i o tym, co nie wyszło.”");
    expect(script).not.toContain("{echo}");
    const segs = parseScript(script);
    expect(segs.filter((s) => s.kind === "pause" && s.seconds === 99)).toHaveLength(0);
  });

  it("private and skipped reflections are never quoted; the thread falls back to earlier ones", () => {
    const r = run({ 1: { text: "Pierwsza myśl", at: 1 }, 2: { text: "Tajne", at: 2, private: true }, 3: { text: "", at: 3 } });
    expect(threadFor(r, 4)).toMatchObject({ last: "Pierwsza myśl", lastStep: 1 });
    expect(weaveEcho(path.steps[3].script, path.steps[3], r)).not.toContain("Tajne");
    expect(weaveEcho(path.steps[1].script, path.steps[1], run({}))).toContain("Przypomnij sobie");
  });

  it("the closing step recalls the first and the latest sentence", () => {
    const last = path.steps[path.steps.length - 1];
    const both = weaveEcho(last.script, last, run({ 1: { text: "Początek", at: 1 }, 6: { text: "Koniec", at: 6 } }));
    expect(both).toContain("„Początek”");
    expect(both).toContain("„Koniec”");
    const single = weaveEcho(last.script, last, run({ 6: { text: "Koniec", at: 6 } }));
    expect(single).toContain("„Koniec”");
    expect(single).not.toContain("„”");
  });

  it("steps open one after another and the first step has no empty paragraphs", () => {
    const r = run({ 1: { text: "a", at: 1 } });
    expect(stepOpen(r, 2)).toBe(true);
    expect(stepOpen(r, 3)).toBe(false);
    expect(currentStep(path, r)).toBe(2);
    expect(weaveEcho(path.steps[0].script, path.steps[0], undefined)).not.toMatch(/\n{3,}/);
    expect(sanitizeReflection("„cytat”")).toBe("cytat");
  });
});

import { modelFor, parseVoiceIds } from "@/lib/voices";
import { migrate as migrateState } from "@/lib/store";

describe("voices: collection with a model per voice", () => {
  it("picks voice IDs out of messy pasted text", () => {
    expect(parseVoiceIds("Hf6cweL2QiwvPv7zuh5B")).toEqual(["Hf6cweL2QiwvPv7zuh5B"]);
    expect(parseVoiceIds("​Hf6cweL2Qiwv​Pv7zuh5B ")).toEqual(["Hf6cweL2QiwvPv7zuh5B"]);
    expect(parseVoiceIds("https://elevenlabs.io/app/voice-library?voiceId=Hf6cweL2QiwvPv7zuh5B, abcDEF1234567890xyz")).toEqual(["Hf6cweL2QiwvPv7zuh5B", "abcDEF1234567890xyz"]);
    expect(parseVoiceIds("Marek")).toEqual([]);
  });
  it("a voice speaks with its own model, otherwise the default", () => {
    const e = { voiceId: "A", modelId: "eleven_multilingual_v2", voices: [{ id: "A", name: "a" }, { id: "B", name: "b", modelId: "eleven_v3" }] };
    expect(modelFor(e)).toBe("eleven_multilingual_v2");
    expect(modelFor(e, "B")).toBe("eleven_v3");
  });
  it("the requested voice is added to the collection with Eleven v3, keeping an existing default", () => {
    const base = migrateState({});
    const s = migrateState({ ...base, eleven: { ...base.eleven, voiceId: "OldVoice123456789012", voiceName: "Stary", voices: [] }, migrations: [] });
    expect(s.eleven.voices).toContainEqual({ id: "Hf6cweL2QiwvPv7zuh5B", name: "Nowy głos (v3)", modelId: "eleven_v3" });
    expect(s.eleven.voiceId).toBe("OldVoice123456789012");
    expect(modelFor(s.eleven, "Hf6cweL2QiwvPv7zuh5B")).toBe("eleven_v3");
    const fresh = migrateState({ ...base, eleven: { ...base.eleven, voiceId: "", voices: [] }, migrations: [] });
    expect(fresh.eleven.voiceId).toBe("Hf6cweL2QiwvPv7zuh5B");
    // runs once: removing the voice later is respected
    const again = migrateState({ ...s, eleven: { ...s.eleven, voices: [] } });
    expect(again.eleven.voices?.some((v) => v.id === "Hf6cweL2QiwvPv7zuh5B")).toBe(false);
  });
});
