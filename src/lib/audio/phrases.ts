import { POSES } from "../yoga/poses";

/** Every fixed sentence the app speaks. Recordings are keyed by exact text, so these are shared. */
export const BREATH_INTRO = "Zamknij oczy. Oddychaj spokojnie i wygodnie. Będę prowadzić Cię głosem.";
export const BREATH_INHALE = "Wdech.";
export const BREATH_EXHALE = "Wydech.";
export const BREATH_END = "Możesz wrócić do swojego dnia.";
export const YOGA_SWITCH = "Spokojnie zmień stronę.";
export const YOGA_END = "Sesja zakończona. Możesz jeszcze chwilę poleżeć.";

export const poseText = (p: { name: string; cue: string }) => `${p.name}. ${p.cue}`;

export function allGuidancePhrases(): string[] {
  return [BREATH_INTRO, BREATH_INHALE, BREATH_EXHALE, BREATH_END, YOGA_SWITCH, YOGA_END, ...POSES.map(poseText)];
}
