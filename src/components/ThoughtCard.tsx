"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { pickThought, thoughtText, type ThoughtContext } from "@/lib/thoughts";
import { update, useApp } from "@/lib/store";
import { toISODate } from "@/lib/dates";
import { navigate } from "@/lib/router";
import { toast } from "@/lib/ui-store";
import { cn } from "./ui";

/**
 * A single thought from the library, shown quietly in context. Never more than one at a time,
 * nothing to tick off: only "ulubiona", "to nie moje" and a way into the library.
 */
export function ThoughtCard({ context, className, variant = "card" }: { context: ThoughtContext; className?: string; variant?: "card" | "plain" }) {
  const hidden = useApp((s) => s.thoughtHidden);
  const edits = useApp((s) => s.thoughtEdits);
  const custom = useApp((s) => s.customThoughts);
  const favs = useApp((s) => s.thoughtFavorites);
  const thought = useMemo(() => pickThought(context, toISODate(), { hidden, edits, custom }), [context, hidden, edits, custom]);
  if (!thought) return null;
  const fav = favs.includes(thought.id);

  return (
    <figure className={cn(variant === "card" ? "rounded-3xl bg-surface-2/70 px-5 py-4" : "text-center", className)}>
      <blockquote className={cn("font-display leading-snug text-ink-2", variant === "card" ? "text-[18px]" : "mx-auto max-w-xs text-[18px]")}>{thoughtText(thought, edits)}</blockquote>
      <figcaption className={cn("mt-3 flex items-center gap-4 text-[12px] text-ink-3", variant === "plain" && "justify-center")}>
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
            toast("Ta myśl nie będzie się już pojawiać. Przywrócisz ją w Bibliotece myśli.");
          }}
        >
          To nie moje
        </button>
        <button onClick={() => navigate("thoughts")}>Biblioteka myśli</button>
      </figcaption>
    </figure>
  );
}
