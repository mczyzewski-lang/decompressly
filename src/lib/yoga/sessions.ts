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
  category: "length" | "neck" | "morning" | "evening" | "afterwork";
  steps: SessionStep[];
}

export const TRANSITION_SECONDS = 10; // last seconds of every step: calm transition
export const SIDE_SWITCH_SECONDS = 8; // window around the midpoint of two-sided poses

export const YOGA_SESSIONS: YogaSession[] = [
  {
    id: "s10",
    title: "10 minut",
    subtitle: "Krótka, spokojna sekwencja na każdy dzień",
    category: "length",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "catcow", seconds: 60 },
      { poseId: "child", seconds: 60 },
      { poseId: "shoulders", seconds: 60 },
      { poseId: "butterfly", seconds: 60 },
      { poseId: "twist", seconds: 120, sides: 2 },
      { poseId: "constructive", seconds: 60 },
      { poseId: "savasana", seconds: 120 },
    ],
  },
  {
    id: "s20",
    title: "20 minut",
    subtitle: "Pełniejsze rozluźnienie pleców, bioder i nóg",
    category: "length",
    steps: [
      { poseId: "seated", seconds: 90 },
      { poseId: "catcow", seconds: 90 },
      { poseId: "child", seconds: 120 },
      { poseId: "needle", seconds: 180, sides: 2 },
      { poseId: "butterfly", seconds: 180 },
      { poseId: "hamstring", seconds: 180, sides: 2 },
      { poseId: "twist", seconds: 180, sides: 2 },
      { poseId: "savasana", seconds: 180 },
    ],
  },
  {
    id: "s30",
    title: "30 minut",
    subtitle: "Długa, regeneracyjna praktyka z dłuższą shavasaną",
    category: "length",
    steps: [
      { poseId: "seated", seconds: 180 },
      { poseId: "catcow", seconds: 120 },
      { poseId: "child", seconds: 180 },
      { poseId: "needle", seconds: 240, sides: 2 },
      { poseId: "butterfly", seconds: 240 },
      { poseId: "twist", seconds: 240, sides: 2 },
      { poseId: "chair", seconds: 240 },
      { poseId: "savasana", seconds: 360 },
    ],
  },
  {
    id: "neck",
    title: "Kark i ramiona",
    subtitle: "10 minut · po dniu przy biurku",
    category: "neck",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "shoulders", seconds: 120 },
      { poseId: "catcow", seconds: 90 },
      { poseId: "needle", seconds: 120, sides: 2 },
      { poseId: "child", seconds: 90 },
      { poseId: "constructive", seconds: 120 },
    ],
  },
  {
    id: "morning",
    title: "Spokojny poranek",
    subtitle: "10 minut · łagodne obudzenie ciała",
    category: "morning",
    steps: [
      { poseId: "seated", seconds: 60 },
      { poseId: "shoulders", seconds: 60 },
      { poseId: "catcow", seconds: 120 },
      { poseId: "child", seconds: 90 },
      { poseId: "kneeschest", seconds: 90 },
      { poseId: "twist", seconds: 120, sides: 2 },
      { poseId: "constructive", seconds: 60 },
    ],
  },
  {
    id: "evening",
    title: "Wieczorna regeneracja",
    subtitle: "15 minut · przed snem",
    category: "evening",
    steps: [
      { poseId: "child", seconds: 120 },
      { poseId: "butterfly", seconds: 180 },
      { poseId: "twist", seconds: 180, sides: 2 },
      { poseId: "kneeschest", seconds: 90 },
      { poseId: "chair", seconds: 180 },
      { poseId: "savasana", seconds: 150 },
    ],
  },
  {
    id: "afterwork",
    title: "Relaksacja po dniu pracy",
    subtitle: "12 minut · zejście z trybu zadaniowego",
    category: "afterwork",
    steps: [
      { poseId: "seated", seconds: 90 },
      { poseId: "shoulders", seconds: 90 },
      { poseId: "catcow", seconds: 90 },
      { poseId: "chair", seconds: 180 },
      { poseId: "constructive", seconds: 90 },
      { poseId: "savasana", seconds: 180 },
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
