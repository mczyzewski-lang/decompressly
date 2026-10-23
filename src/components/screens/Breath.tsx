"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Pause, Play, Square, Minus, Plus, Volume2, VolumeX, Bell, Wind } from "lucide-react";
import { BREATH_MODES, PHASE_MAX, PHASE_MIN, SessionClock, clampPhase, frameAt, patternFor, sessionLengthMs, type BreathPattern, type Phase } from "@/lib/breath";
import { getNameForms, logActivity, update, useApp } from "@/lib/store";
import { formatClock } from "@/lib/dates";
import { playAir, softTone, stopAir, unlockAudio } from "@/lib/audio/engine";
import { airUrl } from "@/lib/audio/breath-air";
import { prepareAirSamples, resolveAirUrl } from "@/lib/audio/breath-air-client";
import { prefetchVoice, say, stopVoice, voiceConfigured } from "@/lib/audio/voice";
import { BREATH_EXHALE, BREATH_INHALE, breathEnd, breathIntro } from "@/lib/audio/phrases";
import { useOnHidden, useWakeLock } from "@/lib/wakelock";
import { navigate } from "@/lib/router";
import type { BreathCue, BreathModeId } from "@/lib/types";
import { Button, IconButton, Screen, Segmented, Slider, Toggle, cn } from "../ui";

const MINUTES = [2, 5, 10] as const;
const INHALE_TEXT = BREATH_INHALE;
const EXHALE_TEXT = BREATH_EXHALE;

export default function Breath({ params }: { params: URLSearchParams }) {
  const settings = useApp((s) => s.breath);
  const [minutes, setMinutes] = useState<number>(() => Number(params.get("min")) || settings.defaultMinutes);
  const [mode, setMode] = useState<BreathModeId>(() => (params.get("mode") as BreathModeId) || settings.defaultMode);
  const [custom, setCustom] = useState<BreathPattern>({ inhale: settings.customInhale, exhale: settings.customExhale });
  const [cue, setCue] = useState<BreathCue>(settings.cue);
  const [air, setAir] = useState(settings.air ?? true);
  const [airVolume, setAirVolume] = useState(settings.airVolume ?? 0.6);
  const [session, setSession] = useState<null | { eyesClosed: boolean }>(null);
  const [preparing, setPreparing] = useState(false);

  const pattern = patternFor(mode, custom);

  if (session) {
    return (
      <BreathSession
        minutes={minutes}
        pattern={pattern}
        cue={session.eyesClosed ? "voice" : cue}
        air={air}
        airVolume={airVolume}
        eyesClosed={session.eyesClosed}
        modeLabel={BREATH_MODES.find((m) => m.id === mode)!.label}
        onExit={() => setSession(null)}
      />
    );
  }

  const begin = async (eyesClosed: boolean) => {
    await unlockAudio();
    const speak = (eyesClosed || cue === "voice") && voiceConfigured();
    const realAir = air && !!pattern && voiceConfigured();
    if (speak || realAir) {
      // record (once) everything the session will say and the breath sounds, so they stay in time with the circle
      setPreparing(true);
      if (speak) await prefetchVoice(eyesClosed ? [breathIntro(getNameForms()), INHALE_TEXT, EXHALE_TEXT, breathEnd(getNameForms())] : [INHALE_TEXT, EXHALE_TEXT, breathEnd(getNameForms())]);
      if (realAir && pattern) await prepareAirSamples(pattern);
      setPreparing(false);
    }
    update((s) => {
      s.breath.customInhale = custom.inhale;
      s.breath.customExhale = custom.exhale;
      s.breath.cue = cue;
      s.breath.air = air;
      s.breath.airVolume = airVolume;
    });
    setSession({ eyesClosed });
  };

  return (
    <Screen tabbed>
      <header className="safe-top pt-6">
        <h1 className="font-display text-[34px] leading-tight tracking-tight text-ink">Oddychaj spokojnie.</h1>
        <p className="mt-2 text-[15px] text-ink-2">Wybierz czas i rytm. Możesz przerwać w każdej chwili.</p>
      </header>

      <div className="mt-7">
        <Segmented label="Czas" value={minutes} onChange={setMinutes} options={MINUTES.map((m) => ({ value: m, label: `${m} min` }))} />
      </div>

      <div className="mt-6 space-y-2" role="radiogroup" aria-label="Tryb oddechu">
        {BREATH_MODES.map((m) => {
          const on = m.id === mode;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={on}
              onClick={() => setMode(m.id)}
              className={cn("w-full rounded-3xl p-4 text-left ring-1 transition-all duration-300", on ? "bg-surface shadow-soft ring-sage" : "bg-transparent ring-line")}
            >
              <span className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-ink">{m.label}</span>
                {m.pattern && <span className="tabular text-[13px] text-ink-3">{m.pattern.inhale}/{m.pattern.exhale}</span>}
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-2">{m.description}</span>
              {m.id === "custom" && on && (
                <span className="mt-4 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                  <Stepper label="Wdech" value={custom.inhale} onChange={(v) => setCustom((c) => ({ ...c, inhale: v }))} />
                  <Stepper label="Wydech" value={custom.exhale} onChange={(v) => setCustom((c) => ({ ...c, exhale: v }))} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="mb-2 px-1 text-[13px] text-ink-2">Dźwięk</p>
        <Segmented<BreathCue>
          label="Sygnały dźwiękowe"
          size="sm"
          value={cue}
          onChange={setCue}
          options={[
            { value: "silent", label: "Cisza" },
            { value: "tone", label: "Sygnał" },
            { value: "voice", label: "Głos" },
          ]}
        />
        <div className="mt-3 rounded-3xl bg-surface px-4 py-1 ring-1 ring-line/60">
          <Toggle
            checked={air}
            onChange={setAir}
            label="Odgłos oddechu"
            description={pattern ? "Delikatny szum wciąganego i wydychanego powietrza, cicho w tle." : "W naturalnym oddechu nie gra — nie narzuca tempa."}
          />
          {air && (
            <div className="pb-3">
              <Slider label="Głośność oddechu" min={0.1} max={1} step={0.05} value={airVolume} onChange={setAirVolume} format={(v) => `${Math.round(v * 100)}%`} />
              <Button
                size="sm"
                variant="quiet"
                className="mt-1"
                onClick={async () => {
                  await unlockAudio();
                  const p = pattern ?? { inhale: 4, exhale: 6 };
                  if (voiceConfigured()) {
                    setPreparing(true);
                    await prepareAirSamples(p);
                    setPreparing(false);
                  }
                  const [inUrl, exUrl] = await Promise.all([resolveAirUrl("inhale", p.inhale, airVolume), resolveAirUrl("exhale", p.exhale, airVolume)]);
                  playAir(inUrl);
                  setTimeout(() => playAir(exUrl), p.inhale * 1000);
                }}
              >
                <Wind className="h-4 w-4" /> Posłuchaj
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button variant="primary" size="xl" block onClick={() => begin(false)} disabled={preparing}>
          {preparing ? "Przygotowuję głos i oddech…" : "Zacznij"}
        </Button>
        <Button variant="secondary" size="lg" block className="h-auto min-h-[52px] whitespace-normal py-3" onClick={() => begin(true)}>
          <EyeOff className="h-5 w-5" /> Zamknij oczy — prowadzenie głosem
        </Button>
      </div>

      <p className="mt-6 px-2 text-center text-[13px] leading-relaxed text-ink-3">
        Oddychaj komfortowo. Jeśli poczujesz zawroty głowy lub dyskomfort, wróć do naturalnego oddechu.
      </p>
    </Screen>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <span className="flex items-center justify-between rounded-2xl bg-surface-2 px-2 py-1.5">
      <IconButton label={`${label}: mniej`} className="h-9 w-9" onClick={() => onChange(clampPhase(value - 0.5))} disabled={value <= PHASE_MIN}>
        <Minus className="h-4 w-4" />
      </IconButton>
      <span className="text-center">
        <span className="block text-[11px] uppercase tracking-wide text-ink-3">{label}</span>
        <span className="tabular block text-[17px] text-ink">{value} s</span>
      </span>
      <IconButton label={`${label}: więcej`} className="h-9 w-9" onClick={() => onChange(clampPhase(value + 0.5))} disabled={value >= PHASE_MAX}>
        <Plus className="h-4 w-4" />
      </IconButton>
    </span>
  );
}

type Status = "running" | "paused" | "done";

function BreathSession({
  minutes,
  pattern,
  cue: initialCue,
  air: initialAir,
  airVolume,
  eyesClosed,
  modeLabel,
  onExit,
}: {
  minutes: number;
  pattern: BreathPattern | null;
  cue: BreathCue;
  air: boolean;
  airVolume: number;
  eyesClosed: boolean;
  modeLabel: string;
  onExit: () => void;
}) {
  const clock = useRef(new SessionClock());
  const discRef = useRef<SVGCircleElement>(null);
  const innerRef = useRef<SVGCircleElement>(null);
  const haloRef = useRef<SVGCircleElement>(null);
  const [status, setStatus] = useState<Status>("running");
  const [phase, setPhase] = useState<Phase | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [cue, setCue] = useState<BreathCue>(initialCue);
  const [dim, setDim] = useState(eyesClosed);
  const lastPhase = useRef<string>("");
  const cueRef = useRef(cue);
  cueRef.current = cue;
  const [air, setAir] = useState(initialAir);
  const airRef = useRef(air);
  airRef.current = air;
  // breath sounds resolved ahead of time (real recordings when available), so the animation loop never waits
  const airUrls = useRef<Partial<Record<Phase, string>>>({});
  useEffect(() => {
    if (!pattern) return;
    let alive = true;
    void Promise.all([resolveAirUrl("inhale", pattern.inhale, airVolume), resolveAirUrl("exhale", pattern.exhale, airVolume)]).then(([inhale, exhale]) => {
      if (alive) airUrls.current = { inhale, exhale };
    });
    return () => {
      alive = false;
    };
  }, [pattern, airVolume]);
  const total = sessionLengthMs(minutes, pattern);
  const reducedMotion = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  useWakeLock(status === "running");

  const finish = useCallback(() => {
    setStatus("done");
    clock.current.pause();
    stopAir();
    logActivity("breath", `${Math.round(clock.current.elapsed() / 60000) || 1} min · ${modeLabel}`);
    if (cueRef.current !== "silent") setTimeout(() => void say(breathEnd(getNameForms()), { gain: 0.8 }), 600);
  }, [modeLabel]);

  // start
  useEffect(() => {
    let cancelled = false;
    if (eyesClosed) {
      // the timer starts only after the short spoken intro, so cues stay in sync
      void say(breathIntro(getNameForms()), { gain: 0.8 }).then(() => {
        if (!cancelled) clock.current.start();
      });
    } else {
      clock.current.start();
    }
    return () => {
      cancelled = true;
      stopVoice();
      stopAir();
    };
  }, [eyesClosed]);

  // background → pause (time is never "caught up" after returning)
  useOnHidden(
    useCallback(() => {
      if (clock.current.running) {
        clock.current.pause();
        stopAir();
        setStatus((s) => (s === "running" ? "paused" : s));
      }
    }, []),
  );

  // animation loop
  useEffect(() => {
    let raf = 0;
    let lastSec = -1;
    const loop = () => {
      const el = clock.current.elapsed();
      if (el >= total && status === "running") {
        finish();
        return;
      }
      const f = frameAt(el, pattern);
      const lag = frameAt(Math.max(0, el - 220), pattern);
      const scale = 0.42 + 0.58 * f.size;
      const innerScale = 0.42 + 0.58 * lag.size;
      if (!reducedMotion) {
        discRef.current?.setAttribute("transform", `translate(150 150) scale(${scale.toFixed(4)})`);
        innerRef.current?.setAttribute("transform", `translate(150 150) scale(${(innerScale * 0.72).toFixed(4)})`);
      } else {
        discRef.current?.setAttribute("transform", `translate(150 150) scale(0.8)`);
        innerRef.current?.setAttribute("transform", `translate(150 150) scale(0.58)`);
      }
      // exhale is softer: lower opacity as the circle settles
      const op = f.phase === "exhale" ? 0.55 + 0.35 * f.size : 0.6 + 0.35 * f.size;
      discRef.current?.setAttribute("fill-opacity", (reducedMotion ? 0.35 + 0.5 * f.size : op).toFixed(3));
      haloRef.current?.setAttribute("stroke-opacity", (0.15 + 0.25 * f.size).toFixed(3));

      const key = `${f.cycle}-${f.phase}`;
      if (f.phase && key !== lastPhase.current && status === "running") {
        lastPhase.current = key;
        setPhase(f.phase);
        if (airRef.current && pattern) {
          const len = f.phase === "inhale" ? pattern.inhale : pattern.exhale;
          const into = f.progress * len;
          // resuming mid-phase picks the sound up where the breath is
          playAir(airUrls.current[f.phase] ?? airUrl(f.phase, len, airVolume), into > 0.3 ? into : 0);
        }
        const c = cueRef.current;
        if (c === "tone") softTone(f.phase === "inhale" ? 392 : 293.66, f.phase === "inhale" ? 1.6 : 2.2, 0.06);
        else if (c === "voice") {
          // without a configured ElevenLabs voice the cue falls back to a soft tone, never to the system voice
          if (!voiceConfigured()) softTone(f.phase === "inhale" ? 392 : 293.66, f.phase === "inhale" ? 1.6 : 2.2, 0.06);
          else void say(f.phase === "inhale" ? INHALE_TEXT : EXHALE_TEXT, { gain: 0.75 });
        }
      }
      const sec = Math.ceil((total - el) / 1000);
      if (sec !== lastSec) {
        lastSec = sec;
        setRemaining(sec);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pattern, total, status, finish, reducedMotion, airVolume]);

  const toggle = () => {
    if (status === "running") {
      clock.current.pause();
      stopVoice();
      stopAir();
      setStatus("paused");
    } else if (status === "paused") {
      void unlockAudio();
      lastPhase.current = ""; // re-announce the phase we resume into
      clock.current.resume();
      setStatus("running");
    }
  };

  const label = status === "done" ? "" : pattern ? (phase === "inhale" ? "Wdech" : phase === "exhale" ? "Wydech" : "") : "Oddychaj po swojemu";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="safe-top mx-auto flex w-full max-w-lg items-center justify-between px-4">
        <span className="px-2 text-[13px] text-ink-3">{modeLabel}</span>
        <div className="flex">
          {pattern && (
            <IconButton
              label={air ? "Wyłącz odgłos oddechu" : "Włącz odgłos oddechu"}
              aria-pressed={air}
              className={air ? "" : "opacity-45"}
              onClick={() => {
                setAir((a) => !a);
                if (air) stopAir();
              }}
            >
              <Wind className="h-5 w-5" />
            </IconButton>
          )}
          <IconButton label={dim ? "Pokaż wizualizację" : "Przyciemnij ekran"} onClick={() => setDim((d) => !d)}>
            {dim ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </IconButton>
          <IconButton
            label={`Dźwięk: ${cue === "silent" ? "cisza" : cue === "tone" ? "sygnał" : "głos"}. Zmień`}
            onClick={() => setCue((c) => (c === "silent" ? "tone" : c === "tone" ? "voice" : "silent"))}
          >
            {cue === "silent" ? <VolumeX className="h-5 w-5" /> : cue === "tone" ? <Bell className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </IconButton>
        </div>
      </div>

      {status === "done" ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-fade-in">
          <p className="font-display text-[28px] leading-snug text-ink">Możesz wrócić do swojego dnia.</p>
          <div className="mt-12 flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate("today")}>
              Wróć do Dziś
            </Button>
            <Button variant="ghost" onClick={onExit}>
              Jeszcze raz
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative flex flex-1 items-center justify-center" aria-live="polite">
            <svg viewBox="0 0 300 300" className="h-[min(86vw,420px)] w-[min(86vw,420px)]" aria-hidden>
              <circle ref={haloRef} cx="150" cy="150" r="146" fill="none" stroke="rgb(var(--sage))" strokeWidth="1" strokeOpacity="0.2" />
              <circle ref={discRef} cx="0" cy="0" r="140" fill="rgb(var(--sage-soft))" transform="translate(150 150) scale(0.42)" />
              <circle ref={innerRef} cx="0" cy="0" r="140" fill="rgb(var(--sage))" fillOpacity="0.16" transform="translate(150 150) scale(0.3)" />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span key={label} className="animate-fade-in text-[15px] font-semibold uppercase tracking-[0.3em] text-sage-deep">
                {status === "paused" ? "Pauza" : label}
              </span>
            </div>
          </div>
          <div className="safe-bottom mx-auto w-full max-w-lg px-6 pb-4">
            <p className="tabular mb-5 text-center text-[13px] text-ink-3" aria-label={`Pozostało ${formatClock(remaining)}`}>
              {formatClock(remaining)}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="secondary" size="lg" onClick={finish} aria-label="Zakończ">
                <Square className="h-4 w-4" /> Zakończ
              </Button>
              <Button variant="primary" size="lg" onClick={toggle} className="min-w-[150px]">
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
            </div>
            <p className="mt-5 text-center text-[12px] leading-relaxed text-ink-3">Oddychaj komfortowo. Jeśli poczujesz dyskomfort, wróć do naturalnego oddechu.</p>
          </div>
        </>
      )}

      {dim && status !== "done" && (
        <button
          className="absolute inset-0 z-10 flex flex-col items-center justify-end bg-black pb-24 text-center"
          onClick={() => setDim(false)}
          aria-label="Ekran przyciemniony. Dotknij, aby pokazać wizualizację"
        >
          <span className="text-[13px] text-white/40">{status === "paused" ? "Pauza — dotknij, aby wrócić" : "Prowadzenie głosem. Dotknij, aby pokazać ekran."}</span>
          <span className="tabular mt-2 text-[12px] text-white/25">{formatClock(remaining)}</span>
        </button>
      )}
    </div>
  );
}
