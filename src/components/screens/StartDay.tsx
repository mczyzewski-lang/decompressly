"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { ensureDay, logActivity, update, useApp } from "@/lib/store";
import { toISODate } from "@/lib/dates";
import { back, navigate } from "@/lib/router";
import { playRef, stopRitualSound, unlockAudio } from "@/lib/audio/engine";
import { Button, IconButton, cn } from "../ui";

export default function StartDay() {
  const name = useApp((s) => s.name);
  const ritual = useApp((s) => s.startRitual);
  const set = useApp((s) => s.soundSets.find((x) => x.id === s.activeSoundSetId));
  const [checked, setChecked] = useState<boolean[]>([]);
  const [started, setStarted] = useState(false);
  const [soundFailed, setSoundFailed] = useState(false);

  useEffect(() => {
    ensureDay(toISODate());
    return () => stopRitualSound();
  }, []);

  const start = async () => {
    await unlockAudio();
    setStarted(true);
    const date = toISODate();
    update((s) => {
      const d = s.days[date];
      if (d) {
        d.startedAt = d.startedAt ?? Date.now();
        d.workState = "working";
        const item = d.items.find((i) => i.link === "start");
        if (item) item.status = "done";
      }
    });
    logActivity("start");
    const el = await playRef(set?.start);
    if (!el) setSoundFailed(true);
  };

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col px-6">
      <div className="flex h-12 items-center justify-end">
        <IconButton label="Zamknij" onClick={() => back()}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      {!started ? (
        <div className="flex flex-1 flex-col animate-fade-in">
          <h1 className="mt-6 font-display text-[34px] leading-tight tracking-tight text-ink">Start your day, {name}.</h1>
          <p className="mt-2 text-[15px] text-ink-2">Bez pośpiechu. {ritual.drink ? `Najpierw ${ritual.drink}. ` : ""}Nic tu nie musi być odhaczone.</p>
          <ol className="mt-10 space-y-1">
            {ritual.steps.map((step, i) => (
              <li key={i}>
                <button
                  onClick={() => setChecked((c) => Object.assign([...c], { [i]: !c[i] }))}
                  className="flex w-full items-center gap-4 rounded-2xl px-1 py-3 text-left"
                  aria-pressed={!!checked[i]}
                >
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300", checked[i] ? "bg-sand ring-sand" : "ring-line")}>
                    {checked[i] ? <Check className="h-4 w-4 text-ink" /> : <span className="text-[13px] text-ink-3">{i + 1}</span>}
                  </span>
                  <span className="text-[17px] text-ink">{step}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-auto pb-6 pt-10">
            <Button variant="primary" size="xl" block onClick={start}>
              Rozpocznij dzień
            </Button>
            <p className="mt-3 text-center text-[12px] text-ink-3">Dźwięk START: {set?.name ?? "brak"} · zmienisz w Ustawieniach</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <OpeningCircle />
          {ritual.showMantra && <p className="mt-12 max-w-xs animate-fade-up font-display text-[24px] leading-snug text-ink [animation-delay:1200ms]">{ritual.mantra}</p>}
          {soundFailed && <p className="mt-4 text-[13px] text-ink-3">Nie udało się odtworzyć dźwięku. Sprawdź, czy telefon nie jest wyciszony.</p>}
          <div className="mt-16 w-full animate-fade-up [animation-delay:2500ms]">
            <Button variant="secondary" size="lg" block onClick={() => navigate("today", { replace: true })}>
              Wróć do dnia
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function OpeningCircle() {
  return (
    <div className="relative h-48 w-48" aria-hidden>
      <span className="absolute inset-0 rounded-full bg-sand/60 motion-safe:animate-[open_6s_cubic-bezier(.22,.61,.36,1)_both]" />
      <span className="absolute inset-8 rounded-full bg-sand motion-safe:animate-[open_6s_cubic-bezier(.22,.61,.36,1)_300ms_both]" />
      <style>{`@keyframes open{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
