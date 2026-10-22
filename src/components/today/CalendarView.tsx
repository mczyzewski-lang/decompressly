"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { LogEntry, LogType, PracticeKind } from "@/lib/types";
import { update, useApp } from "@/lib/store";
import { newId } from "@/lib/db";
import { formatLong, formatTime, MONTHS_NOM, toISODate, WEEKDAYS_SHORT } from "@/lib/dates";
import { Button, Chip, IconButton, Sheet, TextField, cn } from "../ui";

export const LOG_LABELS: Record<LogType, string> = {
  start: "Rozpoczęcie dnia (START)",
  close: "Zamknięcie dnia (CLOSE)",
  breath: "Oddech",
  yoga: "Joga",
  audio: "Relaksacja audio",
  walk: "Spacer",
  nothing: "Czas bez planowania",
  tension: "Chwila z napięciem",
  reflection: "Refleksja tygodniowa",
};

const PRACTICES: { kind: PracticeKind; label: string }[] = [
  { kind: "breath", label: "Oddech" },
  { kind: "yoga", label: "Joga" },
  { kind: "audio", label: "Audio" },
  { kind: "walk", label: "Spacer" },
  { kind: "nothing", label: "Nic nie robię" },
  { kind: "other", label: "Inne" },
];

const RITUALS = new Set<LogType>(["start", "close"]);

export function CalendarView() {
  const log = useApp((s) => s.log);
  const days = useApp((s) => s.days);
  const today = toISODate();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, LogEntry[]>();
    for (const e of log) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [log]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysIn = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysIn; d++) out.push(toISODate(new Date(cursor.y, cursor.m, d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const move = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="rounded-3xl bg-surface p-4 shadow-soft ring-1 ring-line/60">
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Poprzedni miesiąc" onClick={() => move(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <p className="font-display text-[18px] text-ink">
          {MONTHS_NOM[cursor.m]} {cursor.y}
        </p>
        <IconButton label="Następny miesiąc" onClick={() => move(1)}>
          <ChevronRight className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center" role="grid">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-3">
            {w}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const entries = byDate.get(iso) ?? [];
          const planned = days[iso]?.planned ?? [];
          const ritual = entries.some((e) => RITUALS.has(e.type));
          const practice = entries.some((e) => !RITUALS.has(e.type));
          const isToday = iso === today;
          return (
            <button
              key={iso}
              onClick={() => setSelected(iso)}
              aria-label={`${formatLong(iso)}${entries.length ? `, ${entries.length} wpisów` : ""}${planned.length ? `, zaplanowane: ${planned.length}` : ""}`}
              className={cn("mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-[15px] tabular", isToday ? "bg-sage-deep text-bg" : "text-ink")}
            >
              {Number(iso.slice(8))}
              <span className="mt-0.5 flex h-1.5 gap-0.5" aria-hidden>
                {ritual && <span className={cn("h-1.5 w-1.5 rounded-full", isToday ? "bg-bg" : "bg-clay")} />}
                {practice && <span className={cn("h-1.5 w-1.5 rounded-full", isToday ? "bg-bg/80" : "bg-sage")} />}
                {planned.length > 0 && !practice && <span className={cn("h-1.5 w-1.5 rounded-full ring-1", isToday ? "ring-bg" : "ring-sage")} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-[12px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-clay" /> rytuał</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sage" /> praktyka</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full ring-1 ring-sage" /> zaplanowane</span>
      </div>
      {selected && <DaySheet date={selected} entries={byDate.get(selected) ?? []} onClose={() => setSelected(null)} />}
    </div>
  );
}

const NO_PLANNED: never[] = [];

function DaySheet({ date, entries, onClose }: { date: string; entries: LogEntry[]; onClose: () => void }) {
  const planned = useApp((s) => s.days[date]?.planned) ?? NO_PLANNED;
  const [kind, setKind] = useState<PracticeKind>("yoga");
  const [time, setTime] = useState("20:30");

  const add = () => {
    update((s) => {
      if (!s.days[date]) s.days[date] = { date, mode: "work", items: [], workState: "idle" };
      const d = s.days[date];
      d.planned = [...(d.planned ?? []), { id: newId("pl"), kind, label: PRACTICES.find((p) => p.kind === kind)!.label, time }];
    });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={formatLong(date)}>
      {entries.length === 0 && planned.length === 0 && <p className="text-[15px] text-ink-2">Nic nie zapisano. Dzień nie musi być niczym wypełniony.</p>}
      {entries.length > 0 && (
        <ul className="mb-4 divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between py-2.5 text-[15px]">
              <span className="text-ink">
                {LOG_LABELS[e.type]}
                {e.detail ? <span className="text-ink-3"> · {e.detail}</span> : null}
              </span>
              <span className="tabular text-ink-3">{formatTime(e.at)}</span>
            </li>
          ))}
        </ul>
      )}
      {planned.length > 0 && (
        <>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">Zaplanowane</p>
          <ul className="mb-4 space-y-2">
            {planned.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-2.5 ring-1 ring-line">
                <span className="text-[15px] text-ink">
                  {p.time && <span className="tabular mr-2 text-ink-3">{p.time}</span>}
                  {p.label}
                </span>
                <IconButton
                  label={`Usuń: ${p.label}`}
                  className="h-8 w-8"
                  onClick={() =>
                    update((s) => {
                      const d = s.days[date];
                      if (d) d.planned = (d.planned ?? []).filter((x) => x.id !== p.id);
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mb-2 mt-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">Zaplanuj praktykę</p>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {PRACTICES.map((p) => (
          <Chip key={p.kind} active={kind === p.kind} onClick={() => setKind(p.kind)}>
            {p.label}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="flex-1">
          <TextField type="time" label="Godzina" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Button variant="primary" onClick={add} className="h-12">
          Dodaj
        </Button>
      </div>
      <p className="mt-3 text-[12px] text-ink-3">Zaplanowane praktyki to propozycje, nie zobowiązania. Nic nie zmieni koloru, jeśli ich nie zrobisz.</p>
    </Sheet>
  );
}
