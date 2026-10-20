"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw, Download, Sparkles, Pencil, Music } from "lucide-react";
import { AUDIO_BY_ID, personalize } from "@/lib/audio/scripts";
import { applyPacing, DEFAULT_GAP, estimateDuration, hasScriptMotif, layoutKey, parseScript, speechSegments, textKey, totalCharacters, withMotif } from "@/lib/audio/segments";
import { BACKGROUND_URL, generateMissing, missingSegments, renderSessionFile } from "@/lib/audio/narration";
import { blobUrl, deleteBlob, getBlob } from "@/lib/db";
import { confirmPaid, describeChars } from "@/lib/eleven-client";
import { logActivity, update, useApp, useNameForms } from "@/lib/store";
import { formatClock } from "@/lib/dates";
import { toast } from "@/lib/ui-store";
import { navigate } from "@/lib/router";
import type { Background, Motif } from "@/lib/types";
import { Button, Card, IconButton, Notice, Screen, ScreenHeader, SectionTitle, Segmented, Slider, TextArea } from "../ui";

const BG_OPTIONS: { value: Background; label: string }[] = [
  { value: "none", label: "Cisza" },
  { value: "nature", label: "Natura" },
  { value: "jazz", label: "Jazz" },
  { value: "system", label: "System" },
  { value: "orchestral", label: "Orkiestra" },
];

export default function AudioSession({ id }: { id: string }) {
  const def = AUDIO_BY_ID[id];
  const forms = useNameForms();
  const ov = useApp((s) => s.audio.sessions[id]);
  const eleven = useApp((s) => s.eleven);
  const globalPause = useApp((s) => s.audio.pauseScale ?? 1);
  const globalGap = useApp((s) => s.audio.gap ?? DEFAULT_GAP);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const rawScript = ov?.script ?? def?.script ?? "";
  const script = personalize(rawScript, forms);
  const pauseScale = ov?.pauseScale ?? globalPause;
  const gap = ov?.gap ?? globalGap;
  const written = useMemo(() => parseScript(script), [script]);
  // pacing only changes silences, so the spoken paragraphs (and their recordings) stay the same
  const background: Background = ov?.background ?? def?.suggestedBackground ?? "none";
  const motif: Motif = ov?.motif ?? def?.suggestedMotif ?? "none";
  const scriptMotifs = hasScriptMotif(written);
  // the timeline: pauses scaled, motif placed (by the script markers or the session setting)
  const segments = useMemo(() => withMotif(applyPacing(written, { pauseScale, gap }), motif), [written, pauseScale, gap, motif]);
  // a recording depends on the spoken words only; silences and motifs are re-montaged for free
  const scriptHash = textKey(speechSegments(written).join("\n"), eleven.voiceId, eleven.modelId);
  const layout = `${layoutKey(segments)}|${gap}`;
  const render = ov?.render;
  const renderFresh = !!render && render.scriptHash === scriptHash;
  const remixNeeded = renderFresh && (render.background !== background || render.layout !== layout);

  // pacing / background / motif changed on an existing recording → re-montage automatically (free, no new TTS)
  const remixRef = useRef<() => Promise<void>>(async () => {});
  const failedKey = useRef("");
  const mixKey = `${layout}|${background}`;
  useEffect(() => {
    if (!remixNeeded || busy || failedKey.current === mixKey) return;
    const t = setTimeout(
      () =>
        void remixRef.current().catch((e) => {
          failedKey.current = mixKey; // do not retry the same settings in a loop
          toast(String(e?.message ?? e), 5000);
        }),
      700,
    );
    return () => clearTimeout(t);
  }, [remixNeeded, busy, mixKey]);

  if (!def) {
    return (
      <Screen tabbed>
        <ScreenHeader title="Nie znaleziono sesji" fallback="audio" />
      </Screen>
    );
  }

  const setOv = (fn: (o: NonNullable<typeof ov>) => void) =>
    update((s) => {
      const o = (s.audio.sessions[id] ??= {});
      fn(o);
    });

  const generate = async (force: boolean) => {
    if (!eleven.voiceId) {
      toast("Najpierw wybierz głos w Ustawieniach → ElevenLabs.");
      return;
    }
    const missing = force ? { texts: segments.filter((s) => s.kind === "speech").map((s) => (s as { text: string }).text), chars: totalCharacters(segments) } : await missingSegments(segments);
    if (missing.texts.length > 0) {
      const ok = await confirmPaid(
        `Narracja „${def.title}” — ${missing.texts.length} ${missing.texts.length === 1 ? "fragment" : "fragmentów"} głosem ${eleven.voiceName || eleven.voiceId}.`,
        describeChars(missing.chars) + (force ? "" : " Fragmenty wygenerowane wcześniej zostaną użyte ponownie bez kosztów."),
      );
      if (!ok) return;
    }
    try {
      setBusy("Generuję narrację…");
      await generateMissing(segments, (d, t) => setProgress(t ? d / t : 1), force);
      await remix();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nie udało się wygenerować.", 5000);
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const remix = async () => {
    setBusy("Montuję audio…");
    setProgress(null);
    const res = await renderSessionFile(segments, { background, label: def.title, gap }, (stage, p) => {
      setBusy(stage);
      setProgress(p ?? null);
    });
    const old = ov?.render?.blobId;
    setOv((o) => {
      o.render = { blobId: res.blobId, voiceId: eleven.voiceId, scriptHash, createdAt: Date.now(), durationSec: res.durationSec, background, motif, pauseScale, gap, layout };
    });
    if (old && old !== res.blobId) await deleteBlob(old);
    toast("Narracja zapisana na urządzeniu. Działa offline.");
  };

  remixRef.current = async () => {
    try {
      await remix();
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const est = estimateDuration(segments, gap);

  return (
    <Screen tabbed>
      <ScreenHeader fallback="audio" />
      <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{def.title}</h1>
      <p className="mt-1 text-[15px] text-ink-2">
        ok. {Math.round(est / 60)} min · {def.description}
      </p>

      <div className="mt-6">
        {render ? (
          <>
            <FilePlayer blobId={render.blobId} title={def.title} onDone={() => logActivity("audio", def.title)} />
            {(!renderFresh || remixNeeded) && (
              <p className="mt-2 px-1 text-[12px] text-ink-3">
                {remixNeeded ? "Za chwilę zapisze się nowa wersja z wybranymi pauzami i tłem." : "To poprzednia wersja nagrania. Scenariusz lub głos się zmienił — wygeneruj narrację ponownie poniżej."}
              </p>
            )}
          </>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-[15px] leading-relaxed text-ink-2">
              {eleven.voiceId
                ? `Ta sesja nie ma jeszcze nagrania. Narracja powstanie Twoim głosem ElevenLabs (ok. ${Math.round(est / 60)} min) i zapisze się do słuchania offline.`
                : "Wybierz głos ElevenLabs w Ustawieniach, żeby nagrać tę sesję."}
            </p>
            {busy ? (
              <div className="mt-4" aria-live="polite">
                <p className="text-[14px] text-ink">{busy}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-sage transition-[width] duration-500" style={{ width: progress === null ? "35%" : `${Math.round(progress * 100)}%` }} />
                </div>
              </div>
            ) : eleven.voiceId ? (
              <Button className="mt-5" variant="primary" size="lg" onClick={() => generate(false)}>
                <Sparkles className="h-4 w-4" /> Wygeneruj narrację
              </Button>
            ) : (
              <Button className="mt-5" variant="secondary" size="lg" onClick={() => navigate("settings/eleven")}>
                Wybierz głos
              </Button>
            )}
          </Card>
        )}
      </div>

      <SectionTitle>Dźwięk</SectionTitle>
      <Card>
        <p className="mb-2 text-[13px] text-ink-2">Tło</p>
        <div className="no-scrollbar -mx-1 overflow-x-auto">
          <Segmented<Background> label="Tło" size="sm" className="min-w-[420px]" value={background} onChange={(v) => setOv((o) => void (o.background = v))} options={BG_OPTIONS} />
        </div>
        <p className="mb-2 mt-5 text-[13px] text-ink-2">Motyw dźwiękowy</p>
        <Segmented<Motif>
          label="Motyw"
          size="sm"
          value={motif}
          onChange={(v) => setOv((o) => void (o.motif = v))}
          options={[
            { value: "none", label: "Brak" },
            { value: "start", label: "START" },
            { value: "close", label: "CLOSE" },
          ]}
        />
        <p className="mb-2 mt-5 text-[13px] text-ink-2">Długość pauz w scenariuszu</p>
        <Segmented<number>
          label="Długość pauz"
          size="sm"
          value={pauseScale}
          onChange={(v) => setOv((o) => void (o.pauseScale = v))}
          options={[
            { value: 1, label: "Jak w tekście" },
            { value: 1.5, label: "×1,5" },
            { value: 2, label: "×2" },
            { value: 3, label: "×3" },
          ]}
        />
        <p className="mb-2 mt-4 text-[13px] text-ink-2">Cisza między akapitami</p>
        <Segmented<number>
          label="Cisza między akapitami"
          size="sm"
          value={gap}
          onChange={(v) => setOv((o) => void (o.gap = v))}
          options={[DEFAULT_GAP, 3, 6, 10].map((v) => ({ value: v, label: v === DEFAULT_GAP ? "Krótka" : `${v} s` }))}
        />
        <button
          className="mt-3 text-[13px] text-sage-deep"
          onClick={() =>
            update((s) => {
              s.audio.pauseScale = pauseScale;
              s.audio.gap = gap;
              for (const o of Object.values(s.audio.sessions)) {
                delete o.pauseScale;
                delete o.gap;
              }
            })
          }
        >
          Ustaw tak dla wszystkich sesji
        </button>
        <p className="mt-3 text-[12px] text-ink-3">
          Zmiana pauz nie wymaga nowej generacji głosu — zapisany plik zostanie tylko ponownie zmontowany. Pojedynczą pauzę wydłużysz też w scenariuszu, np. „[pauza 60]”.
        </p>
        <p className="mt-3 text-[12px] text-ink-3">
          {scriptMotifs
            ? "Ten scenariusz sam wskazuje miejsca motywów (znaczniki „[motyw …]”) — widzisz je w scenariuszu poniżej."
            : "START gra na początku, CLOSE na końcu sesji — miejsce widać w scenariuszu poniżej. Możesz też wstawić „[motyw start]” lub „[motyw close]” w dowolne miejsce scenariusza."}{" "}
          Motyw pochodzi z aktywnego zestawu dźwięków. Tła są subtelne i zawsze cichsze niż głos.
        </p>
      </Card>

      <SectionTitle>Narracja ElevenLabs</SectionTitle>
      <Card>
        {busy ? (
          <div aria-live="polite">
            <p className="text-[15px] text-ink">{busy}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-sage transition-[width] duration-500" style={{ width: progress === null ? "35%" : `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-ink-2">
              {renderFresh
                ? remixNeeded
                  ? "Zmieniono tło lub motyw. Możesz zmontować plik ponownie — bez kosztów."
                  : `Zapisana narracja: ${formatClock(render.durationSec)} · ${eleven.voiceName || "wybrany głos"}.`
                : render
                  ? "Scenariusz lub głos zmienił się od ostatniej generacji. Wygenerowane zostaną tylko zmienione fragmenty."
                  : "Wygeneruj ciepłą, polską narrację. Pauzy są prawdziwą ciszą w montażu, a gotowy plik działa offline."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {remixNeeded && (
                <Button variant="primary" onClick={() => remix().catch((e) => toast(String(e?.message ?? e)))}>
                  Zmontuj ponownie
                </Button>
              )}
              {render && !renderFresh && (
                <Button variant="primary" onClick={() => generate(false)}>
                  <Sparkles className="h-4 w-4" /> Wygeneruj narrację
                </Button>
              )}
              {renderFresh && <DownloadButton blobId={render.blobId} name={`${def.title}.mp3`} />}
              {renderFresh && (
                <Button variant="ghost" onClick={() => generate(true)}>
                  Wygeneruj od nowa
                </Button>
              )}
            </div>
            {!eleven.voiceId && <p className="mt-3 text-[13px] text-ink-3">Wybierz najpierw głos w Ustawieniach → ElevenLabs.</p>}
          </>
        )}
      </Card>

      <SectionTitle
        action={
          !editing && (
            <button
              className="flex items-center gap-1 text-[14px] text-sage-deep"
              onClick={() => {
                setDraft(rawScript);
                setEditing(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edytuj
            </button>
          )
        }
      >
        Scenariusz
      </SectionTitle>
      {editing ? (
        <div>
          <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} rows={18} className="font-mono text-[14px]" aria-label="Scenariusz sesji" />
          <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
            Pusta linia = nowy fragment. „[pauza 8]” = 8 sekund ciszy. „[motyw start]” lub „[motyw close]” = motyw dźwiękowy w tym miejscu (zastępuje ustawienie sesji). „{"{imię}"}” = zwrot po imieniu („{forms.voc}”), „{"{imię_m}"}” = „{forms.nom}”. Znaczniki nie są wysyłane do syntezy mowy.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={() => (setOv((o) => void (o.script = draft === def.script ? undefined : draft)), setEditing(false))}>
              Zapisz
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Anuluj
            </Button>
            {ov?.script && (
              <Button variant="ghost" onClick={() => (setOv((o) => void (o.script = undefined)), setEditing(false))}>
                Przywróć oryginał
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card className="space-y-3">
          {segments.map((s, i) =>
            s.kind === "motif" ? (
              <div key={i} className="flex w-full items-center gap-2.5 rounded-xl bg-sand/50 px-3 py-2.5" aria-label={`Motyw dźwiękowy ${s.which.toUpperCase()}`}>
                <Music className="h-4 w-4 shrink-0 text-clay" aria-hidden />
                <span className="flex-1 whitespace-nowrap text-[13px] font-medium text-ink">Motyw {s.which === "start" ? "START" : "CLOSE"} · ok. 20 s</span>
                <span className="text-right text-[11px] text-ink-3">{scriptMotifs ? "ze scenariusza" : "z ustawienia sesji"}</span>
              </div>
            ) : s.kind === "pause" ? (
              <p key={i} className="text-[12px] uppercase tracking-[0.15em] text-ink-3">
                · cisza {s.seconds} s ·
              </p>
            ) : (
              <p key={i} className="text-[15px] leading-relaxed text-ink">
                {s.text}
              </p>
            ),
          )}
        </Card>
      )}
    </Screen>
  );
}

function DownloadButton({ blobId, name }: { blobId: string; name: string }) {
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const rec = await getBlob(blobId);
        if (!rec) return;
        const url = URL.createObjectURL(rec.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }}
    >
      <Download className="h-4 w-4" /> Eksportuj MP3
    </Button>
  );
}

function setMediaSession(title: string, handlers: { play: () => void; pause: () => void; seek?: (d: number) => void }) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "Decompressly", album: "Relaksacje", artwork: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
  navigator.mediaSession.setActionHandler("play", handlers.play);
  navigator.mediaSession.setActionHandler("pause", handlers.pause);
  if (handlers.seek) {
    navigator.mediaSession.setActionHandler("seekbackward", () => handlers.seek!(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => handlers.seek!(15));
  }
}

function FilePlayer({ blobId, title, onDone }: { blobId: string; title: string; onDone: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const logged = useRef(false);

  useEffect(() => {
    void blobUrl(blobId).then(setUrl);
  }, [blobId]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };
  const seek = (d: number) => {
    const a = ref.current;
    if (a) a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + d));
  };

  return (
    <Card className="p-6">
      {url && (
        <audio
          ref={ref}
          src={url}
          preload="auto"
          onPlay={() => {
            setPlaying(true);
            setMediaSession(title, { play: () => void ref.current?.play(), pause: () => ref.current?.pause(), seek });
          }}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setTime(t);
            if (!logged.current && dur && t / dur > 0.8) {
              logged.current = true;
              onDone();
            }
          }}
          onEnded={() => setPlaying(false)}
        />
      )}
      <input
        type="range"
        min={0}
        max={dur || 1}
        step={1}
        value={time}
        onChange={(e) => ref.current && (ref.current.currentTime = Number(e.target.value))}
        className="w-full accent-[rgb(var(--sage))]"
        aria-label="Pozycja odtwarzania"
      />
      <div className="tabular mt-1 flex justify-between text-[12px] text-ink-3">
        <span>{formatClock(time)}</span>
        <span>{formatClock(dur)}</span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <IconButton label="Cofnij 15 sekund" onClick={() => seek(-15)}>
          <RotateCcw className="h-6 w-6" />
        </IconButton>
        <button onClick={toggle} aria-label={playing ? "Pauza" : "Odtwórz"} className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-deep text-bg shadow-soft active:scale-95">
          {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
        </button>
        <IconButton label="Do przodu 15 sekund" onClick={() => seek(15)}>
          <RotateCw className="h-6 w-6" />
        </IconButton>
      </div>
      <p className="mt-4 text-center text-[12px] text-ink-3">Plik zapisany na urządzeniu · gra także przy zablokowanym ekranie</p>
    </Card>
  );
}
