import { POSES, POSE_BY_ID } from "../yoga/poses";
import { YOGA_SESSIONS } from "../yoga/sessions";
import type { NameForms } from "../names";

/**
 * Every fixed sentence the app speaks. Recordings are keyed by exact text, so the same builders are
 * used for playback and for recording ahead of time. The name (in the vocative, "Marku") appears
 * now and then — at the start, at the end and occasionally in between — never in every sentence.
 */
// full Polish sentences: a lone "Wydech." was read with English pronunciation ("why-dec")
export const BREATH_INHALE = "Spokojnie wciągnij powietrze.";
export const BREATH_EXHALE = "I powoli je wypuść.";
export const breathIntro = (n: NameForms) => `${n.voc}, zamknij oczy. To jest Twój czas. Oddychaj spokojnie i wygodnie, będę prowadzić Cię głosem.`;
export const breathEnd = (n: NameForms) => `Możesz wrócić do swojego dnia, ${n.voc}.`;

export const YOGA_SWITCH = "Spokojnie zmień stronę.";
export const yogaEnd = (n: NameForms) => `To był dobry czas, ${n.voc}. Sesja zakończona. Możesz jeszcze chwilę poleżeć.`;

/** Pose instruction; the first pose greets by name, every third adds a quiet personal line. */
export function poseText(p: { name: string; cue: string }, index: number, n: NameForms): string {
  if (index === 0) return `${n.voc}, zaczynamy. ${p.name}. ${p.cue}`;
  if (index % 3 === 2) return `${p.name}. ${p.cue} Nie spiesz się, ${n.voc}.`;
  return `${p.name}. ${p.cue}`;
}

export const thoughtsIntro = (n: NameForms) => `${n.voc}, posłuchaj spokojnie. Nic nie musisz z tym robić.`;

export const closeNarration = (message: string, n: NameForms) => `${n.voc}. ${message.replace(/\n+/g, " ")}`;

/** Everything the breath and yoga guidance can say — for "record all now". */
export function allGuidancePhrases(n: NameForms): string[] {
  const yoga = YOGA_SESSIONS.flatMap((s) => s.steps.map((st, i) => poseText(POSE_BY_ID[st.poseId], i, n)));
  const singles = POSES.map((p) => poseText(p, 1, n));
  return [...new Set([breathIntro(n), BREATH_INHALE, BREATH_EXHALE, breathEnd(n), YOGA_SWITCH, yogaEnd(n), ...yoga, ...singles])];
}
