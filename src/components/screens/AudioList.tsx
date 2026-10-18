"use client";

import { ChevronRight } from "lucide-react";
import { AUDIO_SESSIONS } from "@/lib/audio/scripts";
import { useApp } from "@/lib/store";
import { navigate } from "@/lib/router";
import { Screen } from "../ui";

export default function AudioList() {
  const overrides = useApp((s) => s.audio.sessions);
  return (
    <Screen tabbed>
      <header className="safe-top pt-6">
        <h1 className="font-display text-[34px] leading-tight tracking-tight text-ink">Audio</h1>
        <p className="mt-2 text-[15px] text-ink-2">Prowadzone relaksacje. Możesz po prostu słuchać.</p>
      </header>
      <ul className="mt-7 space-y-3">
        {AUDIO_SESSIONS.map((s) => {
          const ready = !!overrides[s.id]?.render;
          return (
            <li key={s.id}>
              <button onClick={() => navigate(`audio/${s.id}`)} className="flex w-full items-center gap-4 rounded-3xl bg-surface p-5 text-left shadow-soft ring-1 ring-line/60 active:scale-[0.99]">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-sage-soft">
                  <span className="tabular font-display text-[22px] leading-none text-sage-deep">{s.minutes}</span>
                  <span className="text-[10px] uppercase tracking-wide text-sage-deep/80">min</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] leading-snug text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-3">{s.description}</p>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">{ready ? "Narracja zapisana · offline" : "Głos systemowy · offline"}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 px-2 text-center text-[12px] leading-relaxed text-ink-3">
        Sesje inspirowane relaksacją i łagodną hipnozą relaksacyjną. To narzędzie wspierające odpoczynek, nie forma leczenia.
      </p>
    </Screen>
  );
}
