"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, X, Minus, Plus, Volume2, VolumeX } from "lucide-react";
import { SESSION_BY_ID, stepStateAt } from "@/lib/yoga/sessions";
import { POSE_BY_ID } from "@/lib/yoga/poses";
import { SessionClock } from "@/lib/breath";
import { logActivity, update, useApp } from "@/lib/store";
import { formatClock } from "@/lib/dates";
import { back, navigate } from "@/lib/router";
import { softBell, unlockAudio } from "@/lib/audio/engine";
import { prefetchVoice, say as sayVoice, stopVoice } from "@/lib/audio/voice";
import { YOGA_END, YOGA_SWITCH, poseText } from "@/lib/audio/phrases";
import { useOnHidden, useWakeLock } from "@/lib/wakelock";
import { Button, IconButton, cn } from "../ui";
import { PoseImage } from "../PoseImage";

type Status = "ready" | "running" | "paused" | "waiting" | "done";

const SWITCH_TEXT = YOGA_SWITCH;
const END_TEXT = YOGA_END;

export default function YogaRun({ id }: { id: string }) {
  const session = SESSION_BY_ID[id];
  const yoga = useApp((s) => s.yoga);
  const voiceCues = useApp((s) => s.voiceCues);
  const [durations, setDurations] = useState<number[]>(() => session?.steps.map((s) => s.seconds) ?? []);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [voice, setVoice] = useState(yoga.voice);
  const [preparing, setPreparing] = useState(false);
  const clock = useRef(new SessionClock());
  const announced = useRef<string>("");
  const doneSeconds = useRef(0);

  useWakeLock(status === "running" || status === "waiting");
  useOnHidden(
    useCallback(() => {
      if (clock.current.running) {
        clock.current.pause();
        stopVoice();
        setStatus("paused");
      }
    }, []),
  );

  const step = session?.steps[index];
  const pose = step ? POSE_BY_ID[step.poseId] : null;
  const dur = durations[index] ?? 0;
  const isLast = session ? index === session.steps.length - 1 : true;

  const say = useCallback(
    (key: string | undefined, text: string) => {
      if (!voice) return;
      stopVoice();
      void sayVoice(text, { legacyId: key, gain: 0.85 });
    },
    [voice],
  );

  const finish = useCallback(
    (completed: boolean) => {
      clock.current.pause();
      setStatus("done");
      const total = doneSeconds.current + Math.min(clock.current.elapsed() / 1000, dur);
      logActivity("yoga", `${session?.title ?? ""} · ${Math.max(1, Math.round(total / 60))} min${completed ? "" : " (krócej)"}`);
      if (voice) say(undefined, END_TEXT);
      else softBell();
    },
    [dur, session, voice, say],
  );

  const goTo = useCallback(
    (next: number) => {
      if (!session) return;
      doneSeconds.current += Math.min(clock.current.elapsed() / 1000, dur);
      if (next >= session.steps.length) {
        finish(true);
        return;
      }
      setIndex(next);
      setElapsed(0);
      clock.current.start();
      setStatus("running");
    },
    [session, dur, finish],
  );

  // tick
  useEffect(() => {
    if (status !== "running" || !step || !pose) return;
    const key = `${index}`;
    if (announced.current !== key) {
      announced.current = key;
      say(voiceCues[`yoga:${pose.id}`], poseText(pose));
    }
    let raf = 0;
    let lastSide: number | null = null;
    const loop = () => {
      const t = clock.current.elapsed() / 1000;
      setElapsed(t);
      const st = stepStateAt({ ...step, seconds: dur }, t, isLast);
      if (step.sides === 2 && st.phase === "switch" && lastSide !== 2) {
        lastSide = 2;
        say(undefined, SWITCH_TEXT);
      }
      if (t >= dur) {
        if (isLast) {
          finish(true);
          return;
        }
        if (yoga.handsFree) {
          goTo(index + 1);
          return;
        }
        clock.current.pause();
        setStatus("waiting");
        softBell();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, index, step, pose, dur, isLast, yoga.handsFree, goTo, finish, say, voiceCues]);

  useEffect(() => () => stopVoice(), []);

  if (!session || !step || !pose) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Button onClick={() => navigate("yoga")}>Wróć do jogi</Button>
      </div>
    );
  }

  const st = stepStateAt({ ...step, seconds: dur }, elapsed, isLast);
  const totalDur = durations.reduce((a, b) => a + b, 0);
  const totalDone = durations.slice(0, index).reduce((a, b) => a + b, 0) + Math.min(elapsed, dur);

  const adjust = (delta: number) => {
    setDurations((d) => {
      const copy = [...d];
      copy[index] = Math.max(Math.ceil(elapsed) + 5, Math.min(copy[index] + delta, 600));
      return copy;
    });
  };

  const begin = async () => {
    await unlockAudio();
    if (voice) {
      // the first instruction is ready before the timer starts; the rest records in the background
      const texts = session.steps.map((st) => poseText(POSE_BY_ID[st.poseId]));
      setPreparing(true);
      await prefetchVoice([texts[0]]);
      setPreparing(false);
      void prefetchVoice([...new Set([...texts.slice(1), SWITCH_TEXT, END_TEXT])]);
    }
    clock.current.start();
    setStatus("running");
  };

  const togglePause = () => {
    if (status === "running") {
      clock.current.pause();
      stopVoice();
      setStatus("paused");
    } else if (status === "paused") {
      void unlockAudio();
      clock.current.resume();
      setStatus("running");
    }
  };

  if (status === "done") {
    return (
      <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-8 text-center animate-fade-in">
        <p className="font-display text-[28px] leading-snug text-ink">Możesz wrócić do swojego dnia.</p>
        <p className="mt-3 text-[15px] text-ink-2">Ciało zapamięta ten spokój lepiej niż jakikolwiek licznik.</p>
        <div className="mt-12 flex w-full max-w-xs flex-col gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate("today", { replace: true })}>
            Wróć do Dziś
          </Button>
          <Button variant="ghost" onClick={() => navigate("yoga", { replace: true })}>
            Biblioteka jogi
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5">
      <div className="flex h-12 items-center justify-between">
        <span className="text-[13px] text-ink-3">
          Krok {index + 1} z {session.steps.length} · {session.title}
        </span>
        <div className="flex">
          <IconButton label={voice ? "Wyłącz głos" : "Włącz głos"} onClick={() => setVoice((v) => !v)}>
            {voice ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </IconButton>
          <IconButton label="Zamknij sesję" onClick={() => (status === "ready" ? back("yoga") : finish(false))}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full bg-sage transition-[width] duration-1000 ease-linear" style={{ width: `${(totalDone / totalDur) * 100}%` }} />
      </div>

      <h1 className="mt-5 font-display text-[28px] leading-tight text-ink">{pose.name}</h1>
      <p className="text-[14px] text-ink-3">
        {pose.english}
        {step.sides === 2 && status !== "ready" ? ` · ${st.side === 1 ? "pierwsza strona" : "druga strona"}` : ""}
      </p>

      <PoseImage pose={pose} className="mt-4" />

      <p className="mt-5 text-[17px] leading-relaxed text-ink">{pose.cue}</p>
      {status !== "ready" && (
        <p className={cn("mt-2 text-[14px] font-medium", st.phase === "switch" || st.phase === "transition" ? "text-clay" : "text-sage-deep")} aria-live="polite">
          {status === "paused" ? "Pauza" : status === "waiting" ? "Gotowe. Przejdź dalej, kiedy zechcesz." : st.label}
        </p>
      )}

      <div className="mt-auto pt-6">
        {status === "ready" ? (
          <>
            <p className="mb-4 text-center text-[14px] text-ink-2">Przygotuj matę, poduszkę i koc. Ćwicz w komfortowym zakresie.</p>
            <Button variant="primary" size="xl" block onClick={begin} disabled={preparing}>
              <Play className="h-5 w-5" /> {preparing ? "Przygotowuję głos…" : "Zacznij sesję"}
            </Button>
          </>
        ) : (
          <>
            <p className="tabular text-center font-display text-[44px] leading-none text-ink" aria-label={`Pozostało ${formatClock(dur - elapsed)}`}>
              {formatClock(dur - elapsed)}
            </p>
            <div className="mt-5 flex items-center justify-between">
              <IconButton label="Skróć o 30 sekund" onClick={() => adjust(-30)} className="ring-1 ring-line">
                <Minus className="h-5 w-5" />
              </IconButton>
              {status === "waiting" ? (
                <Button variant="primary" size="lg" className="min-w-[160px]" onClick={() => goTo(index + 1)}>
                  Dalej
                </Button>
              ) : (
                <Button variant="primary" size="lg" className="min-w-[160px]" onClick={togglePause}>
                  {status === "running" ? (
                    <>
                      <Pause className="h-5 w-5" /> Pauza
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" /> Kontynuuj
                    </>
                  )}
                </Button>
              )}
              <IconButton label="Wydłuż o 30 sekund" onClick={() => adjust(30)} className="ring-1 ring-line">
                <Plus className="h-5 w-5" />
              </IconButton>
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => finish(false)}>
                Zakończ
              </Button>
              <Button variant="ghost" size="sm" onClick={() => goTo(index + 1)}>
                {isLast ? "Zakończ pozycję" : "Następna pozycja"} <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            {status === "paused" && (
              <button className="mt-2 w-full text-center text-[12px] text-ink-3" onClick={() => update((s) => void (s.yoga.handsFree = !s.yoga.handsFree))}>
                Hands-free: {yoga.handsFree ? "włączone" : "wyłączone"} (dotknij, aby zmienić)
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
