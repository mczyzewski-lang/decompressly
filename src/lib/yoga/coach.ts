import type { NameForms } from "../names";

/**
 * The yoga voice as a coach beside you: a word of praise or a breath reminder while you hold a pose,
 * "ten more seconds", "next exercise coming up", then three soft bells. Pure scheduling — the session
 * screen fires each cue once when the pose's clock passes its moment (so pausing simply holds them).
 */
export type CueKind = "praise" | "praise2" | "tenLeft" | "nextUp" | "bell1" | "bell2" | "bell3";

export interface Cue {
  kind: CueKind;
  /** seconds into the pose */
  at: number;
}

export function coachCues(dur: number, opts: { last: boolean; bilateral: boolean }): Cue[] {
  const cues: Cue[] = [];
  const praiseAt = opts.bilateral ? dur * 0.25 : Math.max(14, dur * 0.45);
  if (dur >= 30 && praiseAt <= dur - 14) cues.push({ kind: "praise", at: praiseAt });
  // two-sided poses: a second word after the side switch
  if (opts.bilateral && dur >= 60 && dur * 0.75 <= dur - 14) cues.push({ kind: "praise2", at: dur * 0.75 });
  if (!opts.last) {
    if (dur >= 25) cues.push({ kind: "tenLeft", at: dur - 10 });
    if (dur >= 15) cues.push({ kind: "nextUp", at: dur - 6.5 });
  }
  // pik, pik, piiik — the last three seconds
  if (dur >= 6) cues.push({ kind: "bell1", at: dur - 3 }, { kind: "bell2", at: dur - 2 }, { kind: "bell3", at: dur - 1 });
  return cues.sort((a, b) => a.at - b.at);
}

const PRAISE = (n: NameForms) => [
  `Bardzo dobrze, ${n.voc}.`,
  "Zwróć uwagę na oddech.",
  "Świetnie. Rozluźnij barki i oddychaj spokojnie.",
  `Właśnie tak, ${n.voc}. Zostań w tym jeszcze chwilę.`,
  "Niech wydech będzie odrobinę dłuższy.",
  "Pięknie. Poczuj, jak ciało pracuje.",
  `Dobrze Ci idzie, ${n.voc}. Oddychaj.`,
];

const PRAISE_LAST = (n: NameForms) => [`Pozwól ciału odpocząć, ${n.voc}.`, "Nic już nie musisz. Po prostu oddychaj.", "Z każdym wydechem coraz ciężej i spokojniej."];

/** What the coach says for a cue (null: the cue is a sound, not words). */
export function coachText(kind: CueKind, ctx: { index: number; last: boolean; nextPose?: string; forms: NameForms }): string | null {
  const pick = (list: string[], k: number) => list[k % list.length];
  switch (kind) {
    case "praise":
      return ctx.last ? pick(PRAISE_LAST(ctx.forms), 0) : pick(PRAISE(ctx.forms), ctx.index * 2);
    case "praise2":
      return ctx.last ? pick(PRAISE_LAST(ctx.forms), 1) : pick(PRAISE(ctx.forms), ctx.index * 2 + 1);
    case "tenLeft":
      return `Jeszcze dziesięć sekund, ${ctx.forms.voc}.`;
    case "nextUp":
      return ctx.nextPose ? `Za chwilę przejdziemy do pozycji ${ctx.nextPose}.` : "Za chwilę przejdziemy dalej.";
    default:
      return null;
  }
}

/** Every sentence the coach may say in a session — for recording ahead of time. */
export function allCoachTexts(steps: { name: string; bilateral: boolean; seconds: number }[], forms: NameForms): string[] {
  const out = new Set<string>();
  steps.forEach((s, i) => {
    const last = i === steps.length - 1;
    for (const c of coachCues(s.seconds, { last, bilateral: s.bilateral })) {
      const t = coachText(c.kind, { index: i, last, nextPose: steps[i + 1]?.name, forms });
      if (t) out.add(t);
    }
    // the duration can be extended during the session: keep the countdown phrases ready too
    if (!last) {
      out.add(coachText("tenLeft", { index: i, last, forms })!);
      out.add(coachText("nextUp", { index: i, last, nextPose: steps[i + 1]?.name, forms })!);
    }
  });
  return [...out];
}
