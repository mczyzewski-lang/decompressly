"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { SessionClock } from "@/lib/breath";
import { logActivity } from "@/lib/store";
import { formatClock } from "@/lib/dates";
import { back, navigate } from "@/lib/router";
import { softBell, unlockAudio } from "@/lib/audio/engine";
import { useWakeLock } from "@/lib/wakelock";
import { Button, IconButton, Segmented } from "../ui";

export default function Nothing({ params }: { params: URLSearchParams }) {
  const walk = params.get("kind") === "walk";
  return walk ? <Walk /> : <DoNothing initial={Number(params.get("min")) || 5} />;
}

function Walk() {
  const startedAt = useRef(Date.now());
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col px-6">
      <div className="flex h-12 items-center justify-end">
        <IconButton label="Zamknij" onClick={() => back()}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex flex-1 flex-col justify-center animate-fade-in">
        <h1 className="font-display text-[34px] leading-tight text-ink">Spacer bez celu.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">Bez trasy, bez tempa, bez podcastu — jeśli masz ochotę. Telefon może zostać w kieszeni.</p>
        <ul className="mt-8 space-y-3 text-[16px] text-ink">
          <li>Zauważ trzy rzeczy, które widzisz pierwszy raz.</li>
          <li>Poczuj temperaturę powietrza.</li>
          <li>Idź odrobinę wolniej niż zwykle.</li>
        </ul>
      </div>
      <Button
        variant="primary"
        size="xl"
        block
        className="mb-6"
        onClick={() => {
          const min = Math.round((Date.now() - startedAt.current) / 60000);
          logActivity("walk", min >= 1 ? `${min} min` : undefined);
          navigate("today", { replace: true });
        }}
      >
        Wróciłem
      </Button>
    </main>
  );
}

function DoNothing({ initial }: { initial: number }) {
  const [minutes, setMinutes] = useState(initial);
  const [status, setStatus] = useState<"ready" | "running" | "paused" | "done">("ready");
  const [remaining, setRemaining] = useState(initial * 60);
  const clock = useRef(new SessionClock());

  useWakeLock(status === "running");

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const left = minutes * 60 - clock.current.elapsed() / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        clock.current.pause();
        setStatus("done");
        softBell();
        logActivity("nothing", `${minutes} min`);
      }
    }, 250);
    return () => clearInterval(id);
  }, [status, minutes]);

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col px-6">
      <div className="flex h-12 items-center justify-end">
        <IconButton label="Zamknij" onClick={() => back()}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {status === "ready" && (
          <div className="w-full animate-fade-in">
            <h1 className="font-display text-[34px] leading-tight text-ink">Nic nie robię.</h1>
            <p className="mx-auto mt-4 max-w-xs text-[16px] leading-relaxed text-ink-2">Usiądź albo połóż się. Patrz przez okno. Nie musisz medytować ani niczego osiągać.</p>
            <Segmented
              className="mx-auto mt-10 max-w-xs"
              label="Czas"
              value={minutes}
              onChange={(m) => {
                setMinutes(m);
                setRemaining(m * 60);
              }}
              options={[3, 5, 10, 15].map((m) => ({ value: m, label: `${m} min` }))}
            />
          </div>
        )}
        {(status === "running" || status === "paused") && (
          <div className="animate-fade-in">
            <div className="mx-auto h-40 w-40 rounded-full bg-sand/60 motion-safe:animate-[pulse-soft_12s_ease-in-out_infinite]" aria-hidden />
            <style>{`@keyframes pulse-soft{0%,100%{transform:scale(.94);opacity:.7}50%{transform:scale(1);opacity:1}}`}</style>
            <p className="mt-10 font-display text-[22px] text-ink-2">Nic nie musisz.</p>
            <p className="tabular mt-3 text-[13px] text-ink-3">{formatClock(remaining)}</p>
          </div>
        )}
        {status === "done" && (
          <div className="animate-fade-in">
            <p className="font-display text-[28px] leading-snug text-ink">Możesz wrócić do swojego dnia.</p>
            <p className="mt-3 text-[15px] text-ink-2">Albo zostać tu jeszcze chwilę.</p>
          </div>
        )}
      </div>
      <div className="mb-6">
        {status === "ready" && (
          <Button
            variant="primary"
            size="xl"
            block
            onClick={async () => {
              await unlockAudio();
              clock.current.start();
              setStatus("running");
            }}
          >
            Zacznij
          </Button>
        )}
        {(status === "running" || status === "paused") && (
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" block onClick={() => (clock.current.pause(), setStatus("done"))}>
              Wystarczy
            </Button>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => {
                if (status === "running") {
                  clock.current.pause();
                  setStatus("paused");
                } else {
                  clock.current.resume();
                  setStatus("running");
                }
              }}
            >
              {status === "running" ? "Pauza" : "Kontynuuj"}
            </Button>
          </div>
        )}
        {status === "done" && (
          <Button variant="primary" size="xl" block onClick={() => navigate("today", { replace: true })}>
            Wróć do Dziś
          </Button>
        )}
      </div>
    </main>
  );
}
