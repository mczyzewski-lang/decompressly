"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  Wind,
  Flower2,
  Headphones,
  Footprints,
  Cloud,
  HandHeart,
  Leaf,
  ParkingSquare,
  Target,
  CalendarDays,
  Repeat,
  Quote,
  Plane,
  ChevronRight,
  Sunrise,
  Sunset,
  Feather,
} from "lucide-react";
import { ensureDay, setDayMode, update, useApp } from "@/lib/store";
import { formatLong, formatTime, greeting, toISODate, weekKey, daysBetween } from "@/lib/dates";
import { mantraForDate } from "@/lib/mantras";
import { goalPhase } from "@/lib/goal";
import { DAY_MODES } from "@/lib/defaults";
import { navigate } from "@/lib/router";
import type { DayMode } from "@/lib/types";
import { Card, CardButton, IconButton, Screen, SectionTitle, Segmented, cn } from "../ui";
import { RhythmList } from "../today/RhythmList";
import { CalendarView } from "../today/CalendarView";

function useToday() {
  const [date, setDate] = useState(() => toISODate());
  useEffect(() => {
    const tick = () => setDate(toISODate());
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return date;
}

export default function Today() {
  const date = useToday();
  const name = useApp((s) => s.name);
  const day = useApp((s) => s.days[date]);
  const goal = useApp((s) => s.goal);
  const custom = useApp((s) => s.customMantras);
  const pinned = useApp((s) => s.mantraPinned);
  const override = useApp((s) => s.mantraOfDay);
  const reflections = useApp((s) => s.reflections);
  const snoozed = useApp((s) => s.reflectionSnoozedWeek);
  const [view, setView] = useState<"list" | "calendar">("list");

  useEffect(() => ensureDay(date), [date]);

  const mantra = useMemo(() => mantraForDate(date, { custom, pinned, override }), [date, custom, pinned, override]);
  const footer = useMemo(() => mantraForDate(date, { custom, salt: "footer" }), [date, custom]);
  const phase = goalPhase(goal, date);

  if (!day) return <Screen tabbed>{null}</Screen>;

  if (day.mode === "trip") return <TripToday date={date} mantra={mantra.text} />;

  const week = weekKey(date);
  const dow = new Date().getDay();
  const reflectionDue = (dow === 0 || dow === 5 || dow === 6) && !reflections.some((r) => weekKey(r.date) === week) && snoozed !== week;
  const working = day.workState === "working";
  const after = day.workState === "after";
  const isWorkDay = day.mode === "work";

  return (
    <Screen tabbed>
      <header className="safe-top pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink-3">{formatLong(date)}</p>
          <IconButton label="Ustawienia" onClick={() => navigate("settings")} className="-mr-2">
            <SettingsIcon className="h-5 w-5" />
          </IconButton>
        </div>
        <h1 className="mt-3 font-display text-[34px] leading-[1.1] tracking-tight text-ink">{greeting(name)}</h1>
        <button onClick={() => navigate("mantras")} className="mt-3 text-left text-[17px] leading-relaxed text-ink-2" aria-label={`Mantra dnia: ${mantra.text}. Otwórz mantry`}>
          {mantra.text}
        </button>
      </header>

      <div className="mt-6">
        <Segmented<DayMode>
          label="Tryb dnia"
          size="sm"
          value={day.mode}
          onChange={(m) => {
            if (m === "trip") navigate("trip");
            else setDayMode(date, m);
          }}
          options={DAY_MODES.map((m) => ({ value: m.id, label: m.label }))}
        />
      </div>

      {/* Goal */}
      <CardButton className="mt-5" onClick={() => navigate("goal")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{goal.title}</p>
            {phase.kind === "stage" ? (
              <>
                <p className="mt-2 font-display text-[22px] text-ink">
                  {phase.stage.subtitle} · {phase.stage.name}
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{phase.stage.reminder}</p>
              </>
            ) : phase.kind === "before" ? (
              <p className="mt-2 text-[15px] text-ink-2">Zaczyna się {phase.next.start.split("-").reverse().join(".")}. Na razie nic nie musisz.</p>
            ) : phase.kind === "gap" ? (
              <p className="mt-2 text-[15px] text-ink-2">Chwila między etapami. Odpoczywaj.</p>
            ) : (
              <p className="mt-2 text-[15px] text-ink-2">Eksperyment dobiegł końca. Zachowaj z niego to, co Ci służy.</p>
            )}
          </div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-3" />
        </div>
      </CardButton>

      {/* START / CLOSE */}
      {isWorkDay ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("start")}
            className={cn(
              "flex aspect-[1/0.9] flex-col justify-between rounded-3xl p-5 text-left shadow-soft ring-1 transition-transform active:scale-[0.98]",
              working || after ? "bg-surface ring-line/60" : "bg-sand/70 ring-transparent",
            )}
          >
            <Sunrise className="h-6 w-6 text-ink-2" strokeWidth={1.6} />
            <span>
              <span className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">Start day</span>
              <span className="mt-1 block text-[13px] text-ink-2">
                {day.startedAt ? `Zaczęty o ${formatTime(day.startedAt)}` : "Kawa i spokojny początek"}
              </span>
            </span>
          </button>
          <button
            onClick={() => navigate("close")}
            className={cn(
              "flex aspect-[1/0.9] flex-col justify-between rounded-3xl p-5 text-left shadow-soft ring-1 transition-transform active:scale-[0.98]",
              working ? "bg-sage-deep text-bg ring-transparent" : "bg-surface ring-line/60",
            )}
          >
            <Sunset className={cn("h-6 w-6", working ? "text-bg" : "text-ink-2")} strokeWidth={1.6} />
            <span>
              <span className={cn("block text-[13px] font-semibold uppercase tracking-[0.12em]", working ? "text-bg" : "text-ink")}>Close day</span>
              <span className={cn("mt-1 block text-[13px]", working ? "text-bg/80" : "text-ink-2")}>
                {after && day.closedAt ? `Po pracy od ${formatTime(day.closedAt)}` : "Na dzisiaj wystarczy"}
              </span>
            </span>
          </button>
        </div>
      ) : (
        <Card className="mt-4">
          <p className="text-[15px] leading-relaxed text-ink-2">
            {day.mode === "rest" ? "Dzień odpoczynku. Nie ma tu harmonogramu pracy." : "Dzień regeneracji. Nic nie musisz. Odpoczynek jest teraz najważniejszym zadaniem."}
          </p>
        </Card>
      )}

      {after && isWorkDay && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-sage-soft/70 px-4 py-3">
          <p className="text-[14px] text-ink">Status: po pracy</p>
          <button
            className="text-[14px] text-ink-2 underline decoration-line underline-offset-4"
            onClick={() =>
              update((s) => {
                const d = s.days[date];
                if (d) {
                  d.workState = "working";
                  d.resumedAt = Date.now();
                }
              })
            }
          >
            Wznów pracę
          </button>
        </div>
      )}

      {reflectionDue && (
        <Card className="mt-4">
          <p className="font-display text-[19px] text-ink">Chwila refleksji?</p>
          <p className="mt-1 text-[14px] text-ink-2">Trzy krótkie pytania o ten tydzień. Całkowicie opcjonalne.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => navigate("reflection")} className="rounded-full bg-sage-deep px-4 py-2 text-[14px] text-bg">
              Otwórz
            </button>
            <button
              onClick={() =>
                update((s) => {
                  s.reflectionSnoozedWeek = week;
                })
              }
              className="rounded-full px-4 py-2 text-[14px] text-ink-2"
            >
              Nie w tym tygodniu
            </button>
          </div>
        </Card>
      )}

      {/* Rhythm */}
      <SectionTitle
        action={
          <Segmented
            label="Widok rytmu"
            size="sm"
            className="w-48"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "Lista" },
              { value: "calendar", label: "Kalendarz" },
            ]}
          />
        }
      >
        Dzisiejszy rytm
      </SectionTitle>
      {view === "list" ? <RhythmList day={day} /> : <CalendarView />}

      {/* Suggestions */}
      <SectionTitle>Jeśli masz ochotę</SectionTitle>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
        {[
          { label: "Spokojny oddech", hint: "5 min", Icon: Wind, to: "breath?min=5&mode=calm" },
          { label: "Rozluźnienie ciała", hint: "2 min", Icon: Feather, to: "letgo?flow=tension" },
          { label: "Joga", hint: "10 min", Icon: Flower2, to: "yoga/run/s10" },
          { label: "Relaksacja audio", hint: "3–15 min", Icon: Headphones, to: "audio" },
          { label: "Spacer", hint: "bez celu", Icon: Footprints, to: "nothing?kind=walk" },
          { label: "Czas bez planowania", hint: "5 min", Icon: Cloud, to: "nothing?min=5" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.to)}
            className="flex w-[132px] shrink-0 flex-col justify-between rounded-3xl bg-surface p-4 text-left shadow-soft ring-1 ring-line/60 active:scale-[0.98]"
            style={{ minHeight: 128 }}
          >
            <s.Icon className="h-5 w-5 text-sage-deep" strokeWidth={1.7} />
            <span>
              <span className="block text-[15px] leading-snug text-ink">{s.label}</span>
              <span className="mt-0.5 block text-[12px] text-ink-3">{s.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Modules */}
      <SectionTitle>Więcej</SectionTitle>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-line/60">
        {[
          { label: "Odpuść", hint: "Nie każda możliwość wymaga realizacji.", Icon: HandHeart, to: "letgo" },
          { label: "Keep Your Nervous System Healthy", hint: "Sen, ruch, oddech, relacje", Icon: Leaf, to: "health" },
          { label: "Parking pomysłów", hint: "Jeden pomysł = jedno zdanie", Icon: ParkingSquare, to: "ideas" },
          { label: "Cel osobisty", hint: "Etapy i refleksje", Icon: Target, to: "goal" },
          { label: "Kalendarz i historia", hint: "Co już się wydarzyło", Icon: CalendarDays, to: "history" },
          { label: "Moje rytuały", hint: "START, CLOSE i stały rytm", Icon: Repeat, to: "rituals" },
          { label: "Mantry", hint: "Ulubione i mantra dnia", Icon: Quote, to: "mantras" },
          { label: "Tryb wyjazdu", hint: "Minimum aplikacji", Icon: Plane, to: "trip" },
          { label: "Ustawienia", hint: "Dźwięki, głos, dane, wygląd", Icon: SettingsIcon, to: "settings" },
        ].map((m, i) => (
          <button key={m.label} onClick={() => navigate(m.to)} className={cn("flex w-full items-center gap-4 px-5 py-3.5 text-left active:bg-surface-2", i > 0 && "border-t border-line/70")}>
            <m.Icon className="h-5 w-5 shrink-0 text-sage-deep" strokeWidth={1.7} />
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] text-ink">{m.label}</span>
              <span className="block truncate text-[13px] text-ink-3">{m.hint}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
          </button>
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-xs text-center font-display text-[18px] leading-snug text-ink-2">{footer.text}</p>
      <p className="mt-3 text-center text-[12px] tracking-wide text-ink-3">Enjoy what you&apos;ve built.</p>
    </Screen>
  );
}

function TripToday({ date, mantra }: { date: string; mantra: string }) {
  const trip = useApp((s) => s.trip);
  const dayNo = trip.active && trip.startDate ? Math.max(0, Math.min(trip.days.length - 1, daysBetween(trip.startDate, date))) : 0;
  const plan = trip.days[dayNo];
  return (
    <Screen tabbed>
      <header className="safe-top flex items-center justify-between pt-4">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink-3">Wyjazd · dzień {plan?.day ?? 1}</p>
        <IconButton label="Tryb wyjazdu" onClick={() => navigate("trip")} className="-mr-2">
          <Plane className="h-5 w-5" />
        </IconButton>
      </header>
      <div className="flex min-h-[60dvh] flex-col justify-center">
        <p className="font-display text-[30px] leading-tight text-ink">{plan?.title ?? "Wyjazd"}</p>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{plan?.intention}</p>
        <p className="mt-10 font-display text-[22px] leading-snug text-ink">„{plan?.mantra ?? mantra}”</p>
        <div className="mt-10 space-y-3">
          {plan && (
            <CardButton onClick={() => navigate(plan.practice.route)}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Jedno ćwiczenie</p>
              <p className="mt-1 text-[17px] text-ink">{plan.practice.label}</p>
            </CardButton>
          )}
          {plan?.audio && (
            <CardButton onClick={() => navigate(plan.audio!.route)}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Opcjonalnie audio</p>
              <p className="mt-1 text-[17px] text-ink">{plan.audio.label}</p>
            </CardButton>
          )}
        </div>
      </div>
      <p className="mt-6 text-center text-[13px] text-ink-3">Celem jest korzystanie z wyjazdu, nie z aplikacji. Możesz ją teraz zamknąć.</p>
    </Screen>
  );
}
