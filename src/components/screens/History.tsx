"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { formatLong, formatTime } from "@/lib/dates";
import { Screen, ScreenHeader, SectionTitle } from "../ui";
import { CalendarView, LOG_LABELS } from "../today/CalendarView";

export default function History() {
  const log = useApp((s) => s.log);
  const recent = useMemo(() => {
    const groups = new Map<string, typeof log>();
    for (const e of [...log].reverse().slice(0, 120)) {
      const arr = groups.get(e.date) ?? [];
      arr.push(e);
      groups.set(e.date, arr);
    }
    return [...groups.entries()].slice(0, 21);
  }, [log]);

  return (
    <Screen tabbed>
      <ScreenHeader title="Kalendarz i historia" subtitle="Co się wydarzyło. Bez wykresów i bez serii." />
      <div className="mt-2">
        <CalendarView />
      </div>
      <SectionTitle>Ostatnio</SectionTitle>
      {recent.length === 0 ? (
        <p className="px-1 text-[15px] text-ink-3">Jeszcze nic tu nie ma. I to jest w porządku.</p>
      ) : (
        <div className="space-y-5">
          {recent.map(([date, entries]) => (
            <div key={date}>
              <p className="mb-1.5 px-1 text-[13px] font-medium text-ink-3">{formatLong(date)}</p>
              <ul className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line/60">
                {entries.map((e, i) => (
                  <li key={e.id} className={`flex justify-between gap-3 px-4 py-3 text-[15px] ${i ? "border-t border-line/70" : ""}`}>
                    <span className="text-ink">
                      {LOG_LABELS[e.type]}
                      {e.detail && <span className="text-ink-3"> · {e.detail}</span>}
                    </span>
                    <span className="tabular shrink-0 text-ink-3">{formatTime(e.at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
