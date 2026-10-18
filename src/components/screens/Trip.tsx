"use client";

import { useState } from "react";
import { buildDay, update, useApp } from "@/lib/store";
import { addDays, daysBetween, formatShort, toISODate } from "@/lib/dates";
import { DEFAULT_TRIP_DAYS } from "@/lib/defaults";
import { navigate } from "@/lib/router";
import { Button, Card, Screen, ScreenHeader, SectionTitle, TextArea, TextField } from "../ui";

export default function Trip() {
  const trip = useApp((s) => s.trip);
  const [start, setStart] = useState(trip.startDate || toISODate());
  const [editing, setEditing] = useState(false);
  const today = toISODate();
  const dayIdx = trip.active ? daysBetween(trip.startDate, today) : -1;

  const begin = () => {
    update((s) => {
      s.trip.active = true;
      s.trip.startDate = start;
      for (let i = 0; i < s.trip.days.length; i++) {
        const d = addDays(start, i);
        s.days[d] = { ...buildDay(s, d, "trip"), startedAt: s.days[d]?.startedAt, closedAt: s.days[d]?.closedAt };
      }
    });
    navigate("today", { replace: true });
  };

  const end = () => {
    update((s) => {
      const from = s.trip.startDate;
      s.trip.active = false;
      for (let i = 0; i < s.trip.days.length; i++) {
        const d = addDays(from, i);
        if (d >= today && s.days[d]?.mode === "trip") {
          const dow = new Date(d + "T12:00:00").getDay();
          s.days[d] = buildDay(s, d, dow === 0 || dow === 6 ? "rest" : "work");
        }
      }
    });
  };

  return (
    <Screen tabbed>
      <ScreenHeader title="Tryb wyjazdu" subtitle="Celem jest korzystanie z wyjazdu, nie z aplikacji." />
      <p className="mt-2 px-1 text-[15px] leading-relaxed text-ink-2">
        W tym trybie ekran Dziś pokazuje tylko mantrę, jedno ćwiczenie i opcjonalne audio. Bez harmonogramu pracy i bez checkboxów.
      </p>

      {trip.active ? (
        <Card className="mt-6">
          <p className="text-[15px] text-ink">
            Wyjazd od {formatShort(trip.startDate)}
            {dayIdx >= 0 && dayIdx < trip.days.length ? ` · dziś dzień ${dayIdx + 1}` : ""}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => navigate("today")}>
              Pokaż dzisiaj
            </Button>
            <Button variant="ghost" onClick={end}>
              Zakończ wyjazd
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 space-y-4">
          <TextField type="date" label="Pierwszy dzień wyjazdu" value={start} onChange={(e) => setStart(e.target.value)} />
          <Button variant="primary" size="lg" block onClick={begin}>
            Rozpocznij tryb wyjazdu
          </Button>
        </Card>
      )}

      <SectionTitle
        action={
          <button className="text-[14px] text-sage-deep" onClick={() => setEditing((e) => !e)}>
            {editing ? "Gotowe" : "Edytuj"}
          </button>
        }
      >
        Plan na pięć dni
      </SectionTitle>
      <div className="space-y-3">
        {trip.days.map((d, i) => (
          <Card key={d.day} className={dayIdx === i ? "ring-2 ring-sage" : ""}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3">Dzień {d.day}</p>
            {editing ? (
              <div className="mt-2 space-y-2">
                <TextField aria-label="Tytuł dnia" value={d.title} onChange={(e) => update((s) => void (s.trip.days[i].title = e.target.value))} />
                <TextArea aria-label="Intencja" rows={2} value={d.intention} onChange={(e) => update((s) => void (s.trip.days[i].intention = e.target.value))} />
                <TextField aria-label="Mantra" value={d.mantra} onChange={(e) => update((s) => void (s.trip.days[i].mantra = e.target.value))} />
              </div>
            ) : (
              <>
                <p className="mt-1 font-display text-[20px] text-ink">{d.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{d.intention}</p>
                <p className="mt-3 text-[13px] text-ink-3">
                  {d.practice.label}
                  {d.audio ? ` · ${d.audio.label}` : ""}
                </p>
              </>
            )}
          </Card>
        ))}
      </div>
      {editing && (
        <button className="mt-3 px-1 text-[13px] text-ink-3" onClick={() => update((s) => void (s.trip.days = structuredClone(DEFAULT_TRIP_DAYS)))}>
          Przywróć domyślny plan
        </button>
      )}
    </Screen>
  );
}
