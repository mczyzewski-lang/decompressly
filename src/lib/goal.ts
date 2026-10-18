import type { Goal, GoalStage } from "./types";
import { isWithin } from "./dates";

export type GoalPhase =
  | { kind: "before"; next: GoalStage }
  | { kind: "stage"; stage: GoalStage; index: number }
  | { kind: "gap"; next?: GoalStage }
  | { kind: "after" };

export function goalPhase(goal: Goal, date: string): GoalPhase {
  const stages = [...goal.stages].sort((a, b) => a.start.localeCompare(b.start));
  if (stages.length === 0) return { kind: "after" };
  if (date < stages[0].start) return { kind: "before", next: stages[0] };
  const idx = stages.findIndex((s) => isWithin(date, s.start, s.end));
  if (idx >= 0) return { kind: "stage", stage: stages[idx], index: idx };
  const next = stages.find((s) => s.start > date);
  if (next) return { kind: "gap", next };
  return { kind: "after" };
}

/** True during the "Demobilizacja" stage — used for the gentle "może poczekać do grudnia" message. */
export function isDemobilization(goal: Goal, date: string): boolean {
  const p = goalPhase(goal, date);
  return p.kind === "stage" && p.stage.id === "demob";
}

export function nextStageAfter(goal: Goal, date: string): GoalStage | undefined {
  return [...goal.stages].sort((a, b) => a.start.localeCompare(b.start)).find((s) => s.start > date);
}
