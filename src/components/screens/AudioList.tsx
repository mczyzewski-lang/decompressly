"use client";

import { ChevronRight, Route } from "lucide-react";
import { AUDIO_SESSIONS } from "@/lib/audio/scripts";
import { PATHS, currentStep } from "@/lib/paths";
import { defaultLength } from "@/lib/audio/segments";
import { useApp } from "@/lib/store";
import { navigate } from "@/lib/router";
import { Screen } from "../ui";

export default function AudioList() {
  const overrides = useApp((s) => s.audio.sessions);
  const runs = useApp((s) => s.paths);
  return (
    <Screen tabbed>
      <header className="safe-top pt-6">
        <h1 className="font-display text-[34px] leading-tight tracking-tight text-ink">Audio</h1>
        <p className="mt-2 text-[15px] text-ink-2">Prowadzone relaksacje. Możesz po prostu słuchać.</p>
      </header>
      <div className="mt-7 space-y-3">
        {PATHS.map((p) => {
          const run = runs?.[p.id];
          const cur = currentStep(p, run);
          const step = p.steps.find((x) => x.n === cur);
          return (
            <button
              key={p.id}
              onClick={() => navigate(`paths/${p.id}`)}
              className="flex w-full items-center gap-4 rounded-3xl bg-sage-soft/60 p-5 text-left shadow-soft ring-1 ring-sage/30 active:scale-[0.99]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface">
                <Route className="h-6 w-6 text-sage-deep" strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] leading-snug text-ink">{p.title}</p>
                <p className="mt-0.5 text-[13px] text-ink-2">{p.subtitle}</p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-sage-deep">
                  {!run ? "Zacznij od etapu 1" : step ? `Następny: ${step.n}. ${step.title}` : "Droga domknięta"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" />
            </button>
          );
        })}
      </div>
      <ul className="mt-3 space-y-3">
        {AUDIO_SESSIONS.map((s) => {
          const ready = !!overrides[s.id]?.render || Object.keys(overrides[s.id]?.renders ?? {}).length > 0;
          return (
            <li key={s.id}>
              <button onClick={() => navigate(`audio/${s.id}`)} className="flex w-full items-center gap-4 rounded-3xl bg-surface p-5 text-left shadow-soft ring-1 ring-line/60 active:scale-[0.99]">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-sage-soft">
                  <span className="tabular font-display text-[22px] leading-none text-sage-deep">{overrides[s.id]?.length ?? defaultLength(s.minutes)}</span>
                  <span className="text-[10px] uppercase tracking-wide text-sage-deep/80">min</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] leading-snug text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-3">{s.description}</p>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">{ready ? "Nagrana · offline" : "Nagranie powstanie przy pierwszym słuchaniu"}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 px-2 text-center text-[12px] leading-relaxed text-ink-3">
        Sesje w języku hipnozy relaksacyjnej, do wyboru 10, 15, 20 lub 30 minut. To narzędzie wspierające odpoczynek, nie forma leczenia. Nie słuchaj podczas prowadzenia samochodu.
      </p>
    </Screen>
  );
}
