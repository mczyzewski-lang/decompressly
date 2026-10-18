"use client";

import { useState } from "react";
import { update, useApp } from "@/lib/store";
import { newId } from "@/lib/db";
import { formatShort, toISODate } from "@/lib/dates";
import { isDemobilization } from "@/lib/goal";
import type { Idea } from "@/lib/types";
import { Button, Screen, ScreenHeader, SectionTitle, Sheet, TextField } from "../ui";

export default function Ideas() {
  const ideas = useApp((s) => s.ideas);
  const goal = useApp((s) => s.goal);
  const [text, setText] = useState("");
  const [open, setOpen] = useState<Idea | null>(null);
  const november = isDemobilization(goal, toISODate());
  const parked = ideas.filter((i) => i.state === "parked");
  const other = ideas.filter((i) => i.state !== "parked");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    update((s) => void s.ideas.unshift({ id: newId("idea"), text: t, createdAt: Date.now(), state: "parked" }));
    setText("");
  };

  return (
    <Screen tabbed>
      <ScreenHeader title="Parking pomysłów" subtitle="Pomysły są tu bezpieczne. Nie musisz nic z nimi robić." />
      {november && <p className="mt-2 font-display text-[19px] leading-snug text-sage-deep">To dobre pomysły. Mogą poczekać do grudnia.</p>}

      <div className="mt-5 flex gap-2">
        <div className="flex-1">
          <TextField aria-label="Nowy pomysł" placeholder="Jeden pomysł = jedno zdanie" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <Button variant="primary" className="h-12" onClick={add} disabled={!text.trim()}>
          Zapisz
        </Button>
      </div>

      {parked.length === 0 ? (
        <p className="mt-10 text-center text-[15px] text-ink-3">Parking jest pusty. Głowa też może być pusta.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {parked.map((i) => (
            <li key={i.id}>
              <button onClick={() => setOpen(i)} className="w-full rounded-2xl bg-surface px-4 py-3.5 text-left shadow-soft ring-1 ring-line/60">
                <p className="text-[16px] leading-snug text-ink">{i.text}</p>
                <p className="mt-1 text-[12px] text-ink-3">{formatShort(toISODate(new Date(i.createdAt)))}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {other.length > 0 && (
        <>
          <SectionTitle>Wybrane lub odpuszczone</SectionTitle>
          <ul className="space-y-1">
            {other.map((i) => (
              <li key={i.id}>
                <button onClick={() => setOpen(i)} className="w-full px-1 py-2 text-left text-[15px] text-ink-3">
                  {i.state === "chosen" ? "→ " : "· "}
                  {i.text}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && (
        <Sheet open onOpenChange={(o) => !o && setOpen(null)} title="Pomysł">
          <p className="text-[17px] leading-relaxed text-ink">{open.text}</p>
          <div className="mt-6 grid gap-2">
            {open.state !== "parked" && (
              <Button variant="quiet" onClick={() => (setState(open.id, "parked"), setOpen(null))}>
                Wróć do parkingu
              </Button>
            )}
            {open.state !== "chosen" && (
              <Button variant="quiet" onClick={() => (setState(open.id, "chosen"), setOpen(null))}>
                Świadomie wybieram ten pomysł
              </Button>
            )}
            {open.state !== "released" && (
              <Button variant="quiet" onClick={() => (setState(open.id, "released"), setOpen(null))}>
                Odpuszczam — dobre zakończenie
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => {
                update((s) => void (s.ideas = s.ideas.filter((x) => x.id !== open.id)));
                setOpen(null);
              }}
            >
              Usuń
            </Button>
          </div>
        </Sheet>
      )}
    </Screen>
  );
}

function setState(id: string, state: Idea["state"]) {
  update((s) => {
    const i = s.ideas.find((x) => x.id === id);
    if (i) i.state = state;
  });
}
