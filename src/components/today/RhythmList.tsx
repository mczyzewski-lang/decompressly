"use client";

import { useState } from "react";
import { Check, Plus, ChevronRight } from "lucide-react";
import type { DayItem, DayRecord } from "@/lib/types";
import { update } from "@/lib/store";
import { newId } from "@/lib/db";
import { nowHHMM, shiftTime } from "@/lib/dates";
import { navigate } from "@/lib/router";
import { Button, Sheet, TextField, cn } from "../ui";

export function RhythmList({ day }: { day: DayRecord }) {
  const [editing, setEditing] = useState<DayItem | null>(null);
  const [adding, setAdding] = useState(false);
  const items = [...day.items].sort((a, b) => a.time.localeCompare(b.time));
  const now = nowHHMM();
  const nextId = items.find((i) => i.status === "open" && i.time >= now)?.id;

  const mutate = (id: string, fn: (it: DayItem) => void) =>
    update((s) => {
      const it = s.days[day.date]?.items.find((x) => x.id === id);
      if (it) fn(it);
    });

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-surface p-6 text-center shadow-soft ring-1 ring-line/60">
        <p className="text-[15px] text-ink-2">Dzisiaj nie ma żadnego planu. To też jest dobry plan.</p>
        <Button className="mt-4" size="sm" variant="quiet" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Dodaj punkt
        </Button>
        <ItemSheet open={adding} onClose={() => setAdding(false)} date={day.date} />
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-surface px-2 py-2 shadow-soft ring-1 ring-line/60">
      <ol aria-label="Dzisiejszy rytm">
        {items.map((it, idx) => {
          const done = it.status === "done";
          const skipped = it.status === "skipped";
          return (
            <li key={it.id} className="relative">
              {idx < items.length - 1 && <span aria-hidden className="absolute left-[33px] top-[46px] h-[calc(100%-30px)] w-px bg-line" />}
              <div className={cn("flex items-start gap-3 rounded-2xl px-3 py-2.5", it.id === nextId && "bg-sage-soft/60")}>
                <button
                  onClick={() => mutate(it.id, (x) => (x.status = x.status === "done" ? "open" : "done"))}
                  aria-label={done ? `Cofnij: ${it.title}` : `Odhacz: ${it.title}`}
                  className={cn(
                    "mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300",
                    done ? "bg-sage ring-sage" : "bg-surface ring-line",
                  )}
                >
                  {done && <Check className="h-4 w-4 text-white" strokeWidth={2.5} />}
                </button>
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(it)} aria-label={`${it.time} ${it.title}. Opcje`}>
                  <div className="flex items-baseline gap-3">
                    <span className="tabular w-11 shrink-0 text-[14px] text-ink-3">{it.time}</span>
                    <span className={cn("text-[16px] text-ink", (done || skipped) && "text-ink-3", skipped && "line-through decoration-line")}>
                      {it.title}
                    </span>
                  </div>
                  {it.note && <p className="ml-14 mt-0.5 text-[13px] text-ink-3">{it.note}</p>}
                </button>
                {it.link && (
                  <button onClick={() => navigate(it.link!)} aria-label={`Otwórz: ${it.title}`} className="mt-0.5 rounded-full p-1 text-ink-3 hover:bg-surface-2">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <button onClick={() => setAdding(true)} className="mx-3 mb-1 mt-1 flex items-center gap-2 py-2 text-[14px] text-ink-3">
        <Plus className="h-4 w-4" /> Dodaj punkt
      </button>
      <ItemSheet item={editing} open={!!editing} onClose={() => setEditing(null)} date={day.date} />
      <ItemSheet open={adding} onClose={() => setAdding(false)} date={day.date} />
    </div>
  );
}

function ItemSheet({ item, open, onClose, date }: { item?: DayItem | null; open: boolean; onClose: () => void; date: string }) {
  const isNew = !item;
  const [title, setTitle] = useState(item?.title ?? "");
  const [time, setTime] = useState(item?.time ?? nowHHMM());
  const [note, setNote] = useState(item?.note ?? "");
  const [key, setKey] = useState<string | undefined>(undefined);
  const current = item?.id ?? "new";
  if (open && key !== current) {
    setKey(current);
    setTitle(item?.title ?? "");
    setTime(item?.time ?? nowHHMM());
    setNote(item?.note ?? "");
  }

  const mutate = (fn: (it: DayItem) => void) =>
    update((s) => {
      const it = s.days[date]?.items.find((x) => x.id === item?.id);
      if (it) fn(it);
    });

  const save = () => {
    if (!title.trim()) return;
    if (isNew) {
      update((s) => {
        s.days[date]?.items.push({ id: newId("it"), title: title.trim(), time, note: note.trim() || undefined, status: "open" });
      });
    } else {
      mutate((it) => {
        it.title = title.trim();
        it.time = time;
        it.note = note.trim() || undefined;
      });
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={isNew ? "Nowy punkt dnia" : item!.title}>
      {!isNew && (
        <div className="mb-5 grid grid-cols-2 gap-2">
          <Button variant="quiet" onClick={() => (mutate((it) => (it.status = it.status === "done" ? "open" : "done")), onClose())}>
            {item!.status === "done" ? "Cofnij odhaczenie" : "Odhacz"}
          </Button>
          <Button variant="quiet" onClick={() => (mutate((it) => (it.status = it.status === "skipped" ? "open" : "skipped")), onClose())}>
            {item!.status === "skipped" ? "Przywróć" : "Pomiń dzisiaj"}
          </Button>
          {[15, 30, 60].map((m) => (
            <Button key={m} variant="quiet" onClick={() => (mutate((it) => (it.time = shiftTime(it.time, m))), onClose())}>
              Przesuń o {m} min
            </Button>
          ))}
          {item!.link && (
            <Button variant="quiet" onClick={() => (onClose(), navigate(item!.link!))}>
              Otwórz
            </Button>
          )}
        </div>
      )}
      <div className="space-y-3">
        <TextField label="Nazwa" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Spacer z Leonem" />
        <TextField label="Godzina" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <TextField label="Notatka (opcjonalnie)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="mt-5 flex gap-3">
        {!isNew && (
          <Button
            variant="danger"
            onClick={() => {
              update((s) => {
                const d = s.days[date];
                if (d) d.items = d.items.filter((x) => x.id !== item!.id);
              });
              onClose();
            }}
          >
            Usuń
          </Button>
        )}
        <Button block variant="primary" onClick={save} disabled={!title.trim()}>
          Zapisz
        </Button>
      </div>
      <p className="mt-3 text-[12px] text-ink-3">Zmiany dotyczą tylko tego dnia. Stały rytm edytujesz w „Moje rytuały”.</p>
    </Sheet>
  );
}
