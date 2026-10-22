import type { MomentTag } from "./types";

export const MOMENT_TAGS: { id: MomentTag; label: string; color: string }[] = [
  { id: "rodzina", label: "Rodzina", color: "#C98C6B" },
  { id: "natura", label: "Natura", color: "#7E9A72" },
  { id: "cialo", label: "Ciało", color: "#B9A27A" },
  { id: "smak", label: "Smak", color: "#C9A34E" },
  { id: "ludzie", label: "Ludzie", color: "#8F8FB3" },
  { id: "spokoj", label: "Spokój", color: "#7FA3A8" },
  { id: "dumny", label: "Coś, z czego jestem zadowolony", color: "#A97A8E" },
];

export const TAG_BY_ID = Object.fromEntries(MOMENT_TAGS.map((t) => [t.id, t])) as Record<MomentTag, (typeof MOMENT_TAGS)[number]>;

export const MOMENT_PROMPTS = [
  "Co dziś było przyjemne, choćby przez minutę?",
  "Kiedy dziś coś Cię rozbawiło?",
  "Jaki smak, zapach albo dźwięk zapamiętasz z dzisiaj?",
  "Kiedy ciało było dziś rozluźnione?",
  "Która chwila z Moniką, Leonem albo Gają była dziś dobra?",
  "Co dziś poszło po prostu dobrze?",
];

/** Deterministic pebble layout inside a jar (0..1 coords), filling from the bottom. */
export function pebbleLayout(count: number): { x: number; y: number; r: number }[] {
  const out: { x: number; y: number; r: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const perRow = 6;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const offset = row % 2 ? 0.5 : 0;
    out.push({
      x: 0.14 + ((col + offset) / perRow) * 0.72 + (rnd() - 0.5) * 0.03,
      y: 0.93 - row * 0.085 - (rnd() - 0.5) * 0.02,
      r: 0.052 + rnd() * 0.012,
    });
  }
  return out;
}
