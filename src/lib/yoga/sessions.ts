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
  category: "length" | "neck" | "morning" | "evening" | "afterwork" | "hips" | "strength";
  steps: SessionStep[];
}

export const TRANSITION_SECONDS = 10; // last seconds of every step: calm transition
export const SIDE_SWITCH_SECONDS = 8; // window around the midpoint of two-sided poses

export const YOGA_SESSIONS: YogaSession[] = [
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
  {
    id: "neck",
    title: "Kark i ramiona",
    subtitle: "10 minut · po dniu przy biurku",
    category: "neck",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "catcow", seconds: 90 },
      { poseId: "needle", seconds: 120, sides: 2 },
      { poseId: "puppy", seconds: 60 },
      { poseId: "child", seconds: 60 },
      { poseId: "sphinx", seconds: 60 },
      { poseId: "twist", seconds: 90, sides: 2 },
      { poseId: "savasana", seconds: 60 },
    ],
  },
  {
    id: "morning",
    title: "Spokojny poranek",
    subtitle: "10 minut · łagodne obudzenie ciała",
    category: "morning",
    steps: [
      { poseId: "mountain", seconds: 30 },
      { poseId: "upwardsalute", seconds: 30 },
      { poseId: "forwardfold", seconds: 45 },
      { poseId: "halflift", seconds: 15 },
      { poseId: "catcow", seconds: 60 },
      { poseId: "downdog", seconds: 45 },
      { poseId: "lowlunge", seconds: 60, sides: 2 },
      { poseId: "goddess", seconds: 45 },
      { poseId: "malasana", seconds: 60 },
      { poseId: "tree", seconds: 60, sides: 2 },
      { poseId: "seated", seconds: 60 },
      { poseId: "kneeschest", seconds: 90 },
    ],
  },
  {
    id: "evening",
    title: "Wieczorna regeneracja",
    subtitle: "15 minut · przed snem",
    category: "evening",
    steps: [
      { poseId: "child", seconds: 90 },
      { poseId: "butterfly", seconds: 120 },
      { poseId: "headtoknee", seconds: 120, sides: 2 },
      { poseId: "happybaby", seconds: 60 },
      { poseId: "twist", seconds: 120, sides: 2 },
      { poseId: "legsupwall", seconds: 240 },
      { poseId: "savasana", seconds: 150 },
    ],
  },
  {
    id: "afterwork",
    title: "Relaksacja po dniu pracy",
    subtitle: "12 minut · zejście z trybu zadaniowego",
    category: "afterwork",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "catcow", seconds: 60 },
      { poseId: "downdog", seconds: 45 },
      { poseId: "widefold", seconds: 45 },
      { poseId: "lizard", seconds: 90, sides: 2 },
      { poseId: "pigeon", seconds: 120, sides: 2 },
      { poseId: "kneeschest", seconds: 60 },
      { poseId: "legsupwall", seconds: 120 },
      { poseId: "savasana", seconds: 120 },
    ],
  },
  {
    id: "hips",
    title: "Biodra i plecy",
    subtitle: "15 minut · po długim siedzeniu",
    category: "hips",
    steps: [
      { poseId: "catcow", seconds: 60 },
      { poseId: "lowlunge", seconds: 90, sides: 2 },
      { poseId: "lizard", seconds: 90, sides: 2 },
      { poseId: "halfsplit", seconds: 90, sides: 2 },
      { poseId: "malasana", seconds: 60 },
      { poseId: "pigeon", seconds: 120, sides: 2 },
      { poseId: "butterfly", seconds: 90 },
      { poseId: "headtoknee", seconds: 90, sides: 2 },
      { poseId: "happybaby", seconds: 60 },
      { poseId: "bridge", seconds: 60 },
      { poseId: "savasana", seconds: 90 },
    ],
  },
  {
    id: "strength",
    title: "Siła i równowaga",
    subtitle: "20 minut · średnio zaawansowana, z pełnym wyciszeniem na końcu",
    category: "strength",
    steps: [
      { poseId: "mountain", seconds: 30 },
      { poseId: "upwardsalute", seconds: 30 },
      { poseId: "chairpose", seconds: 30 },
      { poseId: "plank", seconds: 30 },
      { poseId: "chaturanga", seconds: 15 },
      { poseId: "updog", seconds: 20 },
      { poseId: "downdog", seconds: 45 },
      { poseId: "dolphin", seconds: 40 },
      { poseId: "sideplank", seconds: 40, sides: 2 },
      { poseId: "warrior1", seconds: 60, sides: 2 },
      { poseId: "warrior3", seconds: 40, sides: 2 },
      { poseId: "halfmoon", seconds: 50, sides: 2 },
      { poseId: "dancer", seconds: 40, sides: 2 },
      { poseId: "eagle", seconds: 40, sides: 2 },
      { poseId: "goddess", seconds: 45 },
      { poseId: "boat", seconds: 30 },
      { poseId: "reverseplank", seconds: 30 },
      { poseId: "locust", seconds: 30 },
      { poseId: "bow", seconds: 30 },
      { poseId: "camel", seconds: 30 },
      { poseId: "child", seconds: 60 },
      { poseId: "staff", seconds: 30 },
      { poseId: "seatedfold", seconds: 60 },
      { poseId: "twist", seconds: 90, sides: 2 },
      { poseId: "savasana", seconds: 255 },
    ],
  },
];

export const SESSION_BY_ID: Record<string, YogaSession> = Object.fromEntries(YOGA_SESSIONS.map((s) => [s.id, s]));

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
