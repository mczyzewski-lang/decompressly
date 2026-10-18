"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { ensureDay, logActivity, update, useApp } from "@/lib/store";
import { toISODate } from "@/lib/dates";
import { back, navigate } from "@/lib/router";
import { playRef, stopRitualSound, unlockAudio } from "@/lib/audio/engine";
import { Button, IconButton, cn } from "../ui";

export default function CloseDay() {
  const name = useApp((s) => s.name);
  const ritual = useApp((s) => s.closeRitual);
  const set = useApp((s) => s.soundSets.find((x) => x.id === s.activeSoundSetId));
  const [checked, setChecked] = useState<boolean[]>([]);
  const [closed, setClosed] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    ensureDay(toISODate());
    return () => {
      cancelled.current = true;
      stopRitualSound();
    };
  }, []);

  const close = async () => {
    await unlockAudio();
    setClosed(true);
    const date = toISODate();
    update((s) => {
      const d = s.days[date];
      if (d) {
        d.closedAt = Date.now();
        d.workState = "after";
        const item = d.items.find((i) => i.link === "close");
        if (item) item.status = "done";
      }
    });
    logActivity("close");
    const el = await playRef(set?.close);
    if (ritual.playNarration && ritual.narration) {
      const playNarration = () => {
        if (!cancelled.current) void playRef(ritual.narration, 1);
      };
      if (el) el.addEventListener("ended", playNarration, { once: true });
      else playNarration();
    }
  };

  const lines = ritual.message.split("\n").filter(Boolean);

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col px-6">
      <div className="flex h-12 items-center justify-end">
        <IconButton label="Zamknij" onClick={() => back()}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      {!closed ? (
        <div className="flex flex-1 flex-col animate-fade-in">
          <h1 className="mt-6 font-display text-[34px] leading-tight tracking-tight text-ink">Na dzisiaj wystarczy, {name}.</h1>
          <p className="mt-2 text-[15px] text-ink-2">Wszystko jest opcjonalne. Możesz od razu zamknąć dzień.</p>
          <ul className="mt-10 space-y-1">
            {ritual.steps.map((step, i) => (
              <li key={i}>
                <button
                  onClick={() => setChecked((c) => Object.assign([...c], { [i]: !c[i] }))}
                  className="flex w-full items-center gap-4 rounded-2xl px-1 py-3 text-left"
                  aria-pressed={!!checked[i]}
                >
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300", checked[i] ? "bg-sage ring-sage" : "ring-line")}>
                    {checked[i] && <Check className="h-4 w-4 text-white" />}
                  </span>
                  <span className="text-[17px] text-ink">{step}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto pb-6 pt-10">
            <Button variant="primary" size="xl" block onClick={close}>
              Zamknij dzień
            </Button>
            <p className="mt-3 text-center text-[12px] text-ink-3">Dźwięk CLOSE: {set?.name ?? "brak"}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ClosingCircle />
          <div className="mt-12 space-y-2">
            {lines.map((l, i) => (
              <p key={i} className="animate-fade-up font-display text-[23px] leading-snug text-ink" style={{ animationDelay: `${2200 + i * 1600}ms` }}>
                {l}
              </p>
            ))}
          </div>
          <div className="mt-16 w-full animate-fade-up" style={{ animationDelay: `${2200 + lines.length * 1600 + 600}ms` }}>
            <Button variant="secondary" size="lg" block onClick={() => navigate("today", { replace: true })}>
              Wróć do dnia
            </Button>
            <p className="mt-3 text-[13px] text-ink-3">Jeśli coś naprawdę trzeba, zawsze możesz wznowić pracę z ekranu Dziś.</p>
          </div>
        </div>
      )}
    </main>
  );
}

/** A ring that slowly closes over ~7 s, then softly fills. Static (already closed) with reduced motion. */
function ClosingCircle() {
  const r = 80;
  const c = 2 * Math.PI * r;
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden className="-rotate-90">
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="2" />
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke="rgb(var(--sage))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        style={{ strokeDashoffset: 0, animation: `dc-close 7s cubic-bezier(.45,.05,.35,1) both` }}
      />
      <circle cx="100" cy="100" r={r - 10} fill="rgb(var(--sage-soft))" style={{ animation: "dc-fill 3s ease 6.2s both" }} />
      <style>{`@keyframes dc-close{from{stroke-dashoffset:${c}}to{stroke-dashoffset:0}}@keyframes dc-fill{from{opacity:0;transform:scale(.9);transform-origin:100px 100px}to{opacity:1;transform:scale(1);transform-origin:100px 100px}}`}</style>
    </svg>
  );
}
