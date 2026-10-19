"use client";

import { useMemo, useState } from "react";
import { Heart, Volume2 } from "lucide-react";
import { pickThought, thoughtText, type ThoughtContext } from "@/lib/thoughts";
import { listenThought, stopListening } from "@/lib/audio/thought-voice";
import { update, useApp } from "@/lib/store";
import { toISODate } from "@/lib/dates";
import { isDemobilization } from "@/lib/goal";
import { navigate } from "@/lib/router";
import { toast } from "@/lib/ui-store";
import { cn } from "./ui";

/**
 * A single thought from "Moje myśli", shown quietly in context. Never more than one at a time and
 * nothing to tick off: listen, "ulubiona", "to nie moje", and a way into the library.
 */
export function ThoughtCard({ context, className, variant = "card" }: { context: ThoughtContext; className?: string; variant?: "card" | "plain" }) {
  const hidden = useApp((s) => s.thoughtHidden);
  const edits = useApp((s) => s.thoughtEdits);
  const custom = useApp((s) => s.customThoughts);
  const contexts = useApp((s) => s.thoughtContexts);
  const favs = useApp((s) => s.thoughtFavorites);
  const goal = useApp((s) => s.goal);
  const [playing, setPlaying] = useState(false);
  const date = toISODate();
  const november = isDemobilization(goal, date);
  const thought = useMemo(() => pickThought(context, date, { hidden, edits, custom, contexts }, { november }), [context, date, hidden, edits, custom, contexts, november]);
  if (!thought) return null;
  const fav = favs.includes(thought.id);
  const text = thoughtText(thought, edits);

  const listen = async () => {
    if (playing) {
      stopListening();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      await listenThought(text);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <figure className={cn(variant === "card" ? "rounded-3xl bg-surface-2/70 px-5 py-4" : "text-center", className)} aria-label="Myśl na tę chwilę">
      <blockquote className={cn("font-display text-[18px] leading-snug text-ink-2", variant === "plain" && "mx-auto max-w-xs")}>{text}</blockquote>
      <figcaption className={cn("mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-3", variant === "plain" && "justify-center")}>
        <button className="flex items-center gap-1" onClick={listen} aria-label={playing ? "Zatrzymaj odsłuch" : "Posłuchaj tej myśli"}>
          <Volume2 className={cn("h-3.5 w-3.5", playing && "text-sage-deep")} /> {playing ? "Stop" : "Posłuchaj"}
        </button>
        <button
          className="flex items-center gap-1"
          aria-pressed={fav}
          onClick={() =>
            update((s) => {
              s.thoughtFavorites = fav ? s.thoughtFavorites.filter((x) => x !== thought.id) : [...s.thoughtFavorites, thought.id];
            })
          }
        >
          <Heart className={cn("h-3.5 w-3.5", fav && "fill-clay text-clay")} /> {fav ? "Ulubiona" : "Lubię"}
        </button>
        <button
          onClick={() => {
            update((s) => void (s.thoughtHidden = [...new Set([...s.thoughtHidden, thought.id])]));
            toast("Ta myśl nie będzie się już pojawiać. Przywrócisz ją w „Moje myśli”.");
          }}
        >
          To nie moje
        </button>
        <button onClick={() => navigate("thoughts")}>Moje myśli</button>
      </figcaption>
    </figure>
  );
}
