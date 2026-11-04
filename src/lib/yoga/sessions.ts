import { POSE_BY_ID } from "./poses";

export interface SessionStep {
  poseId: string;
  seconds: number;
  /** two-sided pose: the side switch happens at the midpoint */
  sides?: 2;
}

export interface YogaSession {
  id: string;
  title: string;
  subtitle: string;
  category: "length" | "theme";
  /** themed sessions: the theme they belong to, and their length in minutes */
  theme?: string;
  minutes?: number;
  steps: SessionStep[];
}

export const TRANSITION_SECONDS = 10; // last seconds of every step: calm transition
export const SIDE_SWITCH_SECONDS = 8; // window around the midpoint of two-sided poses

/* ---------------- tematyczne: każdy temat w trzech długościach ---------------- */

/** A step of a theme pool: `from` = the shortest session length (10, 20 or 30 minutes) that includes it. */
interface PoolStep {
  poseId: string;
  seconds: number;
  sides?: 2;
  from: 10 | 20 | 30;
}

export interface YogaTheme {
  id: string;
  title: string;
  subtitle: string;
  pool: PoolStep[];
}

export const THEME_LENGTHS = [10, 20, 30] as const;

const p = (poseId: string, seconds: number, from: 10 | 20 | 30 = 10, sides?: 2): PoolStep => ({ poseId, seconds, from, ...(sides ? { sides } : {}) });
const b = (poseId: string, seconds: number, from: 10 | 20 | 30 = 10): PoolStep => p(poseId, seconds, from, 2);

export const YOGA_THEMES: YogaTheme[] = [
  {
    id: "neck",
    title: "Kark i ramiona",
    subtitle: "po dniu przy biurku",
    pool: [p("seated", 60), p("catcow", 90), p("mountain", 30, 30), p("upwardsalute", 30, 30), b("eagle", 60, 20), b("needle", 120), p("puppy", 60), p("dolphin", 40, 30), p("child", 60), p("cobra", 30, 20), p("sphinx", 60), b("seatedtwist", 60, 20), b("twist", 90), p("savasana", 60)],
  },
  {
    id: "morning",
    title: "Spokojny poranek",
    subtitle: "łagodne obudzenie ciała",
    pool: [p("mountain", 30), p("upwardsalute", 30), p("forwardfold", 45), p("halflift", 15), p("chairpose", 30, 20), p("catcow", 60), p("downdog", 45), b("lowlunge", 60), b("highlunge", 60, 30), b("warrior2", 60, 20), b("triangle", 60, 30), p("goddess", 45), p("malasana", 60), b("tree", 60), p("seated", 60), p("bridge", 60, 20), p("kneeschest", 90), p("savasana", 120, 20)],
  },
  {
    id: "energy",
    title: "Przypływ energii",
    subtitle: "dynamiczny przepływ na rozbudzenie",
    pool: [p("mountain", 30), p("upwardsalute", 30), p("forwardfold", 30), p("halflift", 15), p("plank", 30), p("cobra", 30), p("updog", 20, 20), p("downdog", 45), b("lowlunge", 60), b("highlunge", 60), b("warrior1", 60, 20), p("chairpose", 30), b("warrior2", 60), b("reversewarrior", 40, 20), b("triangle", 60, 30), b("sideangle", 60, 30), p("goddess", 45), b("tree", 60), b("eagle", 40, 30), p("boat", 30, 20), p("savasana", 75)],
  },
  {
    id: "standing",
    title: "Bez maty — przerwa w pracy",
    subtitle: "na stojąco, przy biurku albo w hotelu",
    pool: [p("mountain", 60), p("upwardsalute", 40), p("forwardfold", 60), p("halflift", 20), p("chairpose", 40), b("warrior2", 80, 20), b("reversewarrior", 60, 20), b("sideangle", 80, 20), b("triangle", 80, 20), b("pyramid", 80, 30), b("warrior1", 80, 30), b("highlunge", 80, 30), b("tree", 80), b("eagle", 80), b("warrior3", 60, 30), b("dancer", 60, 30), p("goddess", 60), p("widefold", 60), p("forwardfold", 60, 20), p("malasana", 40), p("upwardsalute", 40, 30), p("mountain", 60)],
  },
  {
    id: "balance",
    title: "Równowaga i skupienie",
    subtitle: "stabilne nogi, spokojna głowa",
    pool: [p("mountain", 60), p("upwardsalute", 30, 20), p("forwardfold", 45, 20), b("tree", 80), p("chairpose", 30), b("eagle", 60), b("warrior2", 60), b("reversewarrior", 40, 30), b("sideangle", 60, 20), b("triangle", 60, 30), b("highlunge", 60, 20), b("warrior3", 60), b("halfmoon", 60, 20), b("dancer", 60, 30), p("goddess", 45, 30), b("sideplank", 40, 30), p("boat", 30, 30), p("child", 60), p("seated", 60), p("savasana", 130)],
  },
  {
    id: "strength",
    title: "Siła i równowaga",
    subtitle: "średnio zaawansowana, z pełnym wyciszeniem",
    pool: [p("mountain", 30), p("upwardsalute", 30, 20), p("chairpose", 30), p("plank", 30), p("chaturanga", 15, 20), p("updog", 20, 20), p("downdog", 45), p("dolphin", 40, 20), b("sideplank", 40, 20), b("highlunge", 60, 30), b("warrior1", 60), b("warrior3", 40), b("halfmoon", 50, 20), b("sideangle", 60, 30), b("dancer", 40, 30), b("eagle", 40, 20), p("goddess", 45), p("boat", 30), p("reverseplank", 30, 20), p("locust", 30), p("bow", 30, 20), p("camel", 30, 30), p("child", 60), p("staff", 30, 30), p("seatedfold", 60, 30), b("twist", 60), p("savasana", 140)],
  },
  {
    id: "core",
    title: "Brzuch i stabilizacja",
    subtitle: "mocny środek ciała, bez forsowania",
    pool: [p("catcow", 60), p("plank", 30), p("chaturanga", 15, 20), p("updog", 20, 20), p("downdog", 45), b("lowlunge", 60, 20), b("highlunge", 60, 30), b("sideplank", 40), p("dolphin", 40), p("chairpose", 30, 30), b("warrior3", 40, 30), p("staff", 30, 30), p("boat", 30), p("reverseplank", 30, 20), p("locust", 30), p("bridge", 60), p("seatedfold", 60, 30), b("seatedtwist", 60, 20), p("happybaby", 60, 30), p("kneeschest", 60, 20), p("child", 60), b("twist", 60), p("savasana", 145)],
  },
  {
    id: "hips",
    title: "Biodra i plecy",
    subtitle: "po długim siedzeniu",
    pool: [p("catcow", 60), b("lowlunge", 80), b("lizard", 80), b("halfsplit", 80, 20), p("goddess", 45, 30), p("malasana", 60), b("pigeon", 120), p("butterfly", 60), b("headtoknee", 80, 20), b("seatedtwist", 60, 30), p("happybaby", 60), p("bridge", 60, 20), b("twist", 90, 30), p("savasana", 80)],
  },
  {
    id: "legs",
    title: "Nogi i tył ud",
    subtitle: "rozciąganie po bieganiu, siłowni albo dniu na nogach",
    pool: [p("mountain", 30), p("forwardfold", 45), p("halflift", 15), p("downdog", 60), b("lowlunge", 60), b("lizard", 80, 30), b("halfsplit", 80), b("pyramid", 60), b("triangle", 60, 30), p("widefold", 60, 20), p("staff", 30), p("seatedfold", 90), b("headtoknee", 90, 20), p("butterfly", 60, 30), p("legsupwall", 120, 20), p("savasana", 130)],
  },
  {
    id: "chest",
    title: "Klatka piersiowa i oddech",
    subtitle: "otwarcie po pochylonej pozycji",
    pool: [p("mountain", 30, 30), p("upwardsalute", 30, 30), p("seated", 60), p("catcow", 60), b("lowlunge", 60, 20), p("puppy", 60), p("sphinx", 60), p("cobra", 30), p("locust", 30), p("bow", 30, 20), p("camel", 30, 20), p("child", 45), p("reverseplank", 30, 30), p("bridge", 60), b("twist", 60), p("legsupwall", 120, 30), p("savasana", 135)],
  },
  {
    id: "afterwork",
    title: "Relaksacja po dniu pracy",
    subtitle: "zejście z trybu zadaniowego",
    pool: [p("seated", 60), p("catcow", 60), p("downdog", 45), p("widefold", 45), p("forwardfold", 45, 20), b("lizard", 90, 20), b("halfsplit", 60, 30), b("pigeon", 120), p("child", 60, 20), b("seatedtwist", 60, 30), p("kneeschest", 60), p("legsupwall", 90), p("savasana", 120)],
  },
  {
    id: "evening",
    title: "Wieczorna regeneracja",
    subtitle: "przed snem",
    pool: [p("child", 60), p("puppy", 60, 20), p("sphinx", 60, 30), p("butterfly", 90), b("headtoknee", 120, 20), p("seatedfold", 90, 30), p("happybaby", 60), p("kneeschest", 60, 30), b("twist", 90), p("legsupwall", 180), p("savasana", 120)],
  },
];

const round = (x: number, step: number) => Math.round(x / step) * step;

/**
 * One length of a theme: the steps that belong to it, holds scaled to fill exactly `minutes`, each kept
 * within a sensible range for its pose; whatever is left goes to the restful poses at the end.
 */
export function buildThemeSession(theme: YogaTheme, minutes: (typeof THEME_LENGTHS)[number]): YogaSession {
  const target = minutes * 60;
  const chosen = theme.pool.filter((s) => s.from <= minutes);
  const base = chosen.reduce((a, s) => a + s.seconds, 0);
  const f = target / base;
  const limits = chosen.map((s) => {
    const [lo, hi] = POSE_BY_ID[s.poseId]?.holdRange ?? [15, 120];
    // the hold range of a two-sided pose is per side
    const min = s.sides === 2 ? Math.max(30, 2 * lo) : Math.max(10, Math.min(lo, s.seconds));
    return { min, max: Math.max(min, s.sides === 2 ? 2 * hi : hi) };
  });
  const secs = chosen.map((s, i) => {
    const step = s.sides === 2 ? 10 : 5;
    return Math.min(limits[i].max, Math.max(limits[i].min, round(s.seconds * f, step)));
  });
  let left = target - secs.reduce((a, x) => a + x, 0);
  // fill (or trim) a few seconds at a time, in turns, within each pose's range — no single pose takes it all
  for (let guard = 0; left !== 0 && guard < 1000; guard++) {
    let moved = false;
    for (let i = secs.length - 1; i >= 0 && left !== 0; i--) {
      const step = chosen[i].sides === 2 ? 10 : 5;
      if (left >= step && secs[i] + step <= limits[i].max) {
        secs[i] += step;
        left -= step;
        moved = true;
      } else if (left < 0 && secs[i] - step >= limits[i].min) {
        secs[i] -= step;
        left += step;
        moved = true;
      }
    }
    if (!moved) break;
  }
  // still time left (every pose at its maximum): spread it evenly instead of piling it onto one pose
  for (let guard = 0; left >= 5 && guard < 1000; guard++) {
    for (let i = secs.length - 1; i >= 0 && left >= 5; i--) {
      const step = chosen[i].sides === 2 && left >= 10 ? 10 : 5;
      if (chosen[i].sides === 2 && step === 5) continue;
      secs[i] += step;
      left -= step;
    }
  }
  // a remainder that only fits a one-sided pose
  if (left !== 0) {
    const i = chosen.map((s) => s.sides).lastIndexOf(undefined);
    secs[i] += left;
  }
  return {
    id: `${theme.id}-${minutes}`,
    title: theme.title,
    subtitle: `${minutes} minut · ${theme.subtitle}`,
    category: "theme",
    theme: theme.id,
    minutes,
    steps: chosen.map((s, i) => ({ poseId: s.poseId, seconds: secs[i], ...(s.sides ? { sides: 2 as const } : {}) })),
  };
}

export const THEME_SESSIONS: YogaSession[] = YOGA_THEMES.flatMap((t) => THEME_LENGTHS.map((m) => buildThemeSession(t, m)));

const LENGTH_SESSIONS: YogaSession[] = [
  {
    id: "s10",
    title: "10 minut",
    subtitle: "Łagodny przepływ przez całe ciało — na każdy dzień",
    category: "length",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "catcow", seconds: 60 },
      { poseId: "downdog", seconds: 45 },
      { poseId: "lowlunge", seconds: 60, sides: 2 },
      { poseId: "forwardfold", seconds: 45 },
      { poseId: "mountain", seconds: 30 },
      { poseId: "tree", seconds: 60, sides: 2 },
      { poseId: "child", seconds: 60 },
      { poseId: "twist", seconds: 60, sides: 2 },
      { poseId: "savasana", seconds: 120 },
    ],
  },
  {
    id: "s20",
    title: "20 minut",
    subtitle: "Pełniejsza praktyka: kręgosłup, pozycje stojące, biodra i odpoczynek",
    category: "length",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "catcow", seconds: 60 },
      { poseId: "child", seconds: 45 },
      { poseId: "downdog", seconds: 45 },
      { poseId: "lowlunge", seconds: 90, sides: 2 },
      { poseId: "halfsplit", seconds: 60, sides: 2 },
      { poseId: "mountain", seconds: 30 },
      { poseId: "upwardsalute", seconds: 30 },
      { poseId: "forwardfold", seconds: 30 },
      { poseId: "halflift", seconds: 15 },
      { poseId: "warrior2", seconds: 90, sides: 2 },
      { poseId: "triangle", seconds: 60, sides: 2 },
      { poseId: "tree", seconds: 60, sides: 2 },
      { poseId: "cobra", seconds: 30 },
      { poseId: "sphinx", seconds: 60 },
      { poseId: "bridge", seconds: 60 },
      { poseId: "butterfly", seconds: 60 },
      { poseId: "twist", seconds: 90, sides: 2 },
      { poseId: "savasana", seconds: 225 },
    ],
  },
  {
    id: "s30",
    title: "30 minut",
    subtitle: "Długa praktyka: wojownicy, równowaga, otwieranie bioder i dłuższa shavasana",
    category: "length",
    steps: [
      { poseId: "seated", seconds: 90 },
      { poseId: "catcow", seconds: 90 },
      { poseId: "puppy", seconds: 60 },
      { poseId: "downdog", seconds: 60 },
      { poseId: "mountain", seconds: 30 },
      { poseId: "upwardsalute", seconds: 30 },
      { poseId: "forwardfold", seconds: 45 },
      { poseId: "halflift", seconds: 15 },
      { poseId: "chairpose", seconds: 30 },
      { poseId: "highlunge", seconds: 60, sides: 2 },
      { poseId: "warrior1", seconds: 60, sides: 2 },
      { poseId: "warrior2", seconds: 60, sides: 2 },
      { poseId: "reversewarrior", seconds: 40, sides: 2 },
      { poseId: "sideangle", seconds: 60, sides: 2 },
      { poseId: "triangle", seconds: 60, sides: 2 },
      { poseId: "pyramid", seconds: 60, sides: 2 },
      { poseId: "widefold", seconds: 60 },
      { poseId: "tree", seconds: 60, sides: 2 },
      { poseId: "eagle", seconds: 40, sides: 2 },
      { poseId: "plank", seconds: 30 },
      { poseId: "sphinx", seconds: 60 },
      { poseId: "locust", seconds: 30 },
      { poseId: "child", seconds: 45 },
      { poseId: "pigeon", seconds: 120, sides: 2 },
      { poseId: "seatedfold", seconds: 60 },
      { poseId: "seatedtwist", seconds: 60, sides: 2 },
      { poseId: "bridge", seconds: 60 },
      { poseId: "happybaby", seconds: 60 },
      { poseId: "twist", seconds: 90, sides: 2 },
      { poseId: "savasana", seconds: 175 },
    ],
  },
];

export const YOGA_SESSIONS: YogaSession[] = [...LENGTH_SESSIONS, ...THEME_SESSIONS];

export const SESSION_BY_ID: Record<string, YogaSession> = Object.fromEntries(YOGA_SESSIONS.map((s) => [s.id, s]));

/** Themed sessions used to exist in one length under the bare theme id: keep old links and favourites working. */
for (const t of YOGA_THEMES) SESSION_BY_ID[t.id] ??= SESSION_BY_ID[`${t.id}-10`];

export function sessionTotal(s: Pick<YogaSession, "steps">): number {
  return s.steps.reduce((a, b) => a + b.seconds, 0);
}

export type StepPhase = "settle" | "hold" | "switch" | "transition";

export interface StepState {
  phase: StepPhase;
  side: 1 | 2 | null;
  remaining: number;
  label: string;
}

/** What the person should be doing `t` seconds into a step of `seconds` length. */
export function stepStateAt(step: SessionStep, t: number, isLast: boolean): StepState {
  const remaining = Math.max(0, step.seconds - t);
  const transition = isLast ? 0 : Math.min(TRANSITION_SECONDS, step.seconds * 0.15);
  if (step.sides === 2) {
    const mid = step.seconds / 2;
    const half = SIDE_SWITCH_SECONDS / 2;
    const side: 1 | 2 = t < mid ? 1 : 2;
    if (t >= mid - half && t < mid + half) return { phase: "switch", side, remaining, label: "Spokojnie zmień stronę" };
    if (!isLast && t >= step.seconds - transition) return { phase: "transition", side: 2, remaining, label: "Powoli przejdź do następnej pozycji" };
    return { phase: "hold", side, remaining, label: side === 1 ? "Pierwsza strona" : "Druga strona" };
  }
  if (t < 6) return { phase: "settle", side: null, remaining, label: "Wejdź spokojnie w pozycję" };
  if (!isLast && t >= step.seconds - transition) return { phase: "transition", side: null, remaining, label: "Powoli przejdź do następnej pozycji" };
  return { phase: "hold", side: null, remaining, label: "Zostań i oddychaj" };
}

export function validateSessions(): string[] {
  const errors: string[] = [];
  for (const s of YOGA_SESSIONS) {
    for (const st of s.steps) {
      if (!POSE_BY_ID[st.poseId]) errors.push(`${s.id}: brak pozycji ${st.poseId}`);
      if (st.sides === 2 && !POSE_BY_ID[st.poseId]?.bilateral) errors.push(`${s.id}: ${st.poseId} nie jest dwustronna`);
    }
  }
  return errors;
}
