"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw, Download, Sparkles, Pencil, Music, Quote, Route } from "lucide-react";
import { AUDIO_BY_ID, personalize } from "@/lib/audio/scripts";
import { PATH_BY_ID, paraphraseOf, parsePathSessionId, pathAudioDef, threadFor, weaveEcho } from "@/lib/paths";
import { PathReflection, ensureParaphrase, setParaphrase } from "../PathReflection";
import { modelFor } from "@/lib/voices";
import { applyPacing, DEFAULT_GAP, defaultLength, estimateDuration, fitPauseScale, hasScriptMotif, layoutKey, LENGTHS, parseScript, selectLength, speechSegments, textKey, totalCharacters, withMotif } from "@/lib/audio/segments";
import { BACKGROUND_URL, generateMissing, missingSegments, renderSessionFile } from "@/lib/audio/narration";
import { blobUrl, deleteBlob, getBlob } from "@/lib/db";
import { confirmPaid, describeChars } from "@/lib/eleven-client";
import { logActivity, update, useApp, useNameForms } from "@/lib/store";
import { formatClock } from "@/lib/dates";
import { toast } from "@/lib/ui-store";
import { navigate } from "@/lib/router";
import type { Background, Motif } from "@/lib/types";
import { Button, Card, Chip, IconButton, Notice, Screen, ScreenHeader, SectionTitle, Segmented, Slider, TextArea, Toggle } from "../ui";

const BG_OPTIONS: { value: Background; label: string }[] = [
  { value: "none", label: "Cisza" },
  { value: "nature", label: "Natura" },
  { value: "jazz", label: "Jazz" },
  { value: "system", label: "System" },
  { value: "orchestral", label: "Orkiestra" },
];

export default function AudioSession({ id }: { id: string }) {
  // a step of a path ("p.<path>.<n>") is a regular session whose script weaves in the previous reflection
  const pathRef = useMemo(() => parsePathSessionId(id), [id]);
  const run = useApp((s) => (pathRef ? s.paths?.[pathRef.path.id] : undefined));
  const def = useMemo(() => (pathRef ? pathAudioDef(pathRef.path, pathRef.step) : AUDIO_BY_ID[id]), [id, pathRef]);
  const reflectionRef = useRef<HTMLDivElement>(null);
  const forms = useNameForms();
  const ov = useApp((s) => s.audio.sessions[id]);
  const eleven = useApp((s) => s.eleven);
  const globalGap = useApp((s) => s.audio.gap ?? DEFAULT_GAP);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  // while the previous reflection is being retold, recording waits (so it never records the quote by accident)
  const [preparingEcho, setPreparingEcho] = useState(false);

  const rawScript = ov?.script ?? def?.script ?? "";
  // chosen length: "[od 20]" blocks join in, and silences stretch so the session lands near that length
  const length = ov?.length ?? defaultLength(def?.minutes ?? 15);
  const script = selectLength(personalize(pathRef ? weaveEcho(rawScript, pathRef.step, run) : rawScript, forms), length);
  const gap = ov?.gap ?? globalGap;
  const written = useMemo(() => parseScript(script), [script]);
  const background: Background = ov?.background ?? def?.suggestedBackground ?? "none";
  const motif: Motif = ov?.motif ?? def?.suggestedMotif ?? "none";
  const scriptMotifs = hasScriptMotif(written);
  // the timeline: pauses scaled to the length, motif placed (by the script markers or the session setting)
  const ramp = ov?.motifRamp ?? true;
  const pauseScale = useMemo(() => fitPauseScale(withMotif(written, motif), length, gap), [written, motif, length, gap]);
  const segments = useMemo(() => withMotif(applyPacing(written, { pauseScale, gap }), motif, { ramp, gap }), [written, pauseScale, gap, motif, ramp]);
  // a recording depends on the spoken words only; silences and motifs are re-montaged for free
  const voices = eleven.voices ?? [];
  const voiceId = ov?.voiceId || eleven.voiceId;
  const voiceName = voices.find((v) => v.id === voiceId)?.name || (voiceId === eleven.voiceId ? eleven.voiceName : "") || voiceId;
  const scriptHash = textKey(speechSegments(written).join("\n"), voiceId, modelFor(eleven, voiceId));
  const layout = `${layoutKey(segments)}|${gap}`;
  const render = ov?.renders?.[String(length)] ?? ov?.render;
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
    if (!voiceId) {
      toast("Najpierw wybierz głos w Ustawieniach → ElevenLabs.");
      return;
    }
    const missing = force ? { texts: segments.filter((s) => s.kind === "speech").map((s) => (s as { text: string }).text), chars: totalCharacters(segments) } : await missingSegments(segments, voiceId);
    if (missing.texts.length > 0) {
      const ok = await confirmPaid(
        `Narracja „${def.title}” — ${missing.texts.length} ${missing.texts.length === 1 ? "fragment" : "fragmentów"} głosem ${voiceName}.`,
        describeChars(missing.chars) + (force ? "" : " Fragmenty wygenerowane wcześniej zostaną użyte ponownie bez kosztów."),
      );
      if (!ok) return;
    }
    try {
      setBusy("Generuję narrację…");
      await generateMissing(segments, (d, t) => setProgress(t ? d / t : 1), force, voiceId);
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
    const res = await renderSessionFile(segments, { background, label: def.title, gap, voiceId, targetSec: length * 60 }, (stage, p) => {
      setBusy(stage);
      setProgress(p ?? null);
    });
    const old = [ov?.renders?.[String(length)]?.blobId, ov?.render?.blobId].filter(Boolean) as string[];
    setOv((o) => {
      (o.renders ??= {})[String(length)] = { blobId: res.blobId, voiceId, scriptHash, createdAt: Date.now(), durationSec: res.durationSec, background, motif, pauseScale, gap, layout, length };
      delete o.render; // the recording from before lengths existed is replaced now
    });
    for (const b of old) if (b !== res.blobId) await deleteBlob(b);
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
      <ScreenHeader fallback={pathRef ? `paths/${pathRef.path.id}` : "audio"} />
      {pathRef && (
        <button onClick={() => navigate(`paths/${pathRef.path.id}`)} className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
          <Route className="h-3.5 w-3.5" /> {pathRef.path.title} · etap {pathRef.step.n}
        </button>
      )}
      <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{def.title}</h1>
      <p className="mt-1 text-[15px] text-ink-2">{def.description}</p>

      <div className="mt-5">
        <Segmented<number>
          label="Długość sesji"
          value={length}
          onChange={(v) => setOv((o) => void (o.length = v))}
          options={LENGTHS.map((l) => ({ value: l, label: `${l} min` }))}
        />
        <p className="mt-2 px-1 text-[12px] text-ink-3">
          Ok. {Math.round(est / 60)} min. Dłuższa sesja to głębsze wprowadzenie i więcej ciszy. Każda długość ma własne nagranie — wcześniej nagrane fragmenty są używane ponownie bez kosztów.
        </p>
      </div>

      {pathRef && pathRef.step.n > 1 && <PathThread pathId={pathRef.path.id} n={pathRef.step.n} onPending={setPreparingEcho} />}

      <div className="mt-6">
        {render ? (
          <>
            <FilePlayer
              blobId={render.blobId}
              title={def.title}
              onDone={() => logActivity("audio", def.title)}
              onEnded={() => reflectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
            {(!renderFresh || remixNeeded) && (
              <p className="mt-2 px-1 text-[12px] text-ink-3">
                {remixNeeded ? "Za chwilę zapisze się nowa wersja z wybranymi pauzami i tłem." : "To poprzednia wersja nagrania. Scenariusz lub głos się zmienił — wygeneruj narrację ponownie poniżej."}
              </p>
            )}
          </>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-[15px] leading-relaxed text-ink-2">
              {voiceId
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
            ) : voiceId ? (
              <Button className="mt-5" variant="primary" size="lg" disabled={preparingEcho} onClick={() => generate(false)}>
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

      {pathRef && <PathReflection ref={reflectionRef} path={pathRef.path} step={pathRef.step} />}

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
        {motif === "close" && !scriptMotifs && (
          <Toggle
            label="Narastający motyw"
            description="W drugiej połowie motyw wraca cicho w przerwach (20% → 35% → 50% → 60%), a na końcu gra w pełnej głośności."
            checked={ramp}
            onChange={(v) => setOv((o) => void (o.motifRamp = v))}
          />
        )}
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
              s.audio.gap = gap;
              for (const o of Object.values(s.audio.sessions)) delete o.gap;
            })
          }
        >
          Ustaw tak dla wszystkich sesji
        </button>
        <p className="mt-3 text-[12px] text-ink-3">
          Zmiana ciszy nie wymaga nowej generacji głosu — zapisany plik zostanie tylko ponownie zmontowany. Pojedynczą pauzę wydłużysz też w scenariuszu, np. „[pauza 60]”.
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
        {voices.length > 1 && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] text-ink-2">Głos tej sesji</p>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {voices.map((v) => (
                <Chip key={v.id} active={v.id === voiceId} onClick={() => setOv((o) => void (o.voiceId = v.id === eleven.voiceId ? undefined : v.id))}>
                  {v.name}
                </Chip>
              ))}
            </div>
            <p className="mt-1 text-[12px] text-ink-3">Nagrania każdego głosu są zapisywane osobno — możesz wracać do wcześniejszych bez ponownej generacji.</p>
          </div>
        )}
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
                  : `Zapisana narracja: ${formatClock(render.durationSec)} · ${voiceName || "wybrany głos"}.`
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
                <Button variant="primary" disabled={preparingEcho} onClick={() => generate(false)}>
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
            {!voiceId && <p className="mt-3 text-[13px] text-ink-3">Wybierz najpierw głos w Ustawieniach → ElevenLabs.</p>}
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
          <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} rows={18} className="font-mono text-[16px]" aria-label="Scenariusz sesji" />
          <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
            Pusta linia = nowy fragment. „[pauza 8]” = 8 sekund ciszy. „[motyw start]” lub „[motyw close]” = motyw dźwiękowy w tym miejscu (zastępuje ustawienie sesji), „[motyw close 35%]” = cichy motyw w tle na 35% głośności. „[od 20]” … „[/od]” = fragment tylko w sesjach od 20 minut, „[do 15]” … „[/do]” = tylko do 15 minut. „{"{imię}"}” = zwrot po imieniu („{forms.voc}”), „{"{imię_m}"}” = „{forms.nom}”. {pathRef ? "„{echo}” = miejsce, w którym sesja przytacza Twoją poprzednią refleksję. " : ""}Znaczniki nie są wysyłane do syntezy mowy.
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
                <span className="flex-1 whitespace-nowrap text-[13px] font-medium text-ink">
                  Motyw {s.which === "start" ? "START" : "CLOSE"} · {(s.level ?? 1) < 1 ? `${Math.round((s.level ?? 1) * 100)}% głośności, w tle` : "pełna głośność"}
                </span>
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

function PathThread({ pathId, n, onPending }: { pathId: string; n: number; onPending: (v: boolean) => void }) {
  const run = useApp((s) => s.paths?.[pathId]);
  const t = threadFor(run, n);
  const path = PATH_BY_ID[pathId];
  const lastNote = t.lastStep ? run?.notes[t.lastStep] : undefined;
  const firstNote = t.firstStep ? run?.notes[t.firstStep] : undefined;
  const needsFirst = !!path.steps.find((x) => x.n === n)?.echo.includes("{pierwsza}") && t.firstStep !== t.lastStep;
  const missing = [lastNote && !paraphraseOf(lastNote) ? t.lastStep : null, needsFirst && firstNote && !paraphraseOf(firstNote) ? t.firstStep : null].filter(
    (x): x is number => x !== null,
  );
  const configured = useApp((s) => !!s.openai?.apiKey.trim());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const missingKey = missing.join(",");
  const run_ = useCallback(async () => {
    if (!missingKey) return;
    setPending(true);
    onPending(true);
    setError(null);
    for (const step of missingKey.split(",").map(Number)) {
      const r = await ensureParaphrase(path, step);
      if (r !== "ok" && r !== "skipped") setError(r);
    }
    setPending(false);
    onPending(false);
  }, [missingKey, path, onPending]);

  // the reflection is retold in the session's own words before anything is recorded
  useEffect(() => {
    if (configured && missingKey) void run_();
  }, [configured, missingKey, run_]);

  const hold = () =>
    update((s) => {
      const note = t.lastStep ? s.paths?.[pathId]?.notes[t.lastStep] : undefined;
      if (note) note.private = true;
    });
  const paraphrased = lastNote ? !!paraphraseOf(lastNote) : false;
  return (
    <Card className="mt-5 bg-surface-2 shadow-none ring-0">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3">
        <Quote className="h-3.5 w-3.5" /> Z poprzedniej refleksji
      </p>
      {t.last && t.lastStep ? (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-3">Twoje słowa (etap {t.lastStep}): „{t.last}”</p>
          {editing ? (
            <div className="mt-2">
              <TextArea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Jak sesja ma to ująć" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="primary" disabled={!draft.trim()} onClick={() => (setParaphrase(path, t.lastStep!, draft), setEditing(false))}>
                  Zapisz
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Anuluj
                </Button>
              </div>
            </div>
          ) : paraphrased ? (
            <>
              <p className="mt-2 text-[12px] font-medium uppercase tracking-wide text-sage-deep">Sesja powie</p>
              <p className="mt-1 text-[16px] leading-relaxed text-ink">{t.lastSpoken}</p>
            </>
          ) : pending ? (
            <p className="mt-2 text-[14px] text-ink-2" aria-live="polite">
              Ujmuję to własnymi słowami sesji…
            </p>
          ) : (
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              {!configured
                ? "Sesja przytoczy Twoje słowa. Żeby ujmowała je własnymi słowami, wklej klucz OpenAI w Ustawieniach → OpenAI."
                : error
                  ? `Nie udało się przeredagować (${error}). Sesja przytoczy Twoje słowa.`
                  : "Sesja przytoczy Twoje słowa."}
            </p>
          )}
          {!editing && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              {!configured && (
                <button className="text-sage-deep" onClick={() => navigate("settings/openai")}>
                  Dodaj klucz OpenAI
                </button>
              )}
              {!paraphrased && configured && !pending && (
                <button className="text-sage-deep" onClick={() => void run_()}>
                  Spróbuj ponownie
                </button>
              )}
              <button className="text-sage-deep" onClick={() => (setDraft(paraphrased ? (t.lastSpoken ?? "") : ""), setEditing(true))}>
                Ujmij to po swojemu
              </button>
              <button className="text-sage-deep" onClick={hold}>
                Nie nawiązuj — zachowaj dla siebie
              </button>
            </div>
          )}
          <p className="mt-2 text-[12px] leading-relaxed text-ink-3">Nowe nagranie obejmie tylko fragmenty z tym nawiązaniem — reszta jest już nagrana.</p>
        </>
      ) : (
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">Ta sesja nawiąże do drogi bez cytowania — poprzednia refleksja była bez słów albo tylko dla Ciebie.</p>
      )}
    </Card>
  );
}

function FilePlayer({ blobId, title, onDone, onEnded }: { blobId: string; title: string; onDone: () => void; onEnded?: () => void }) {
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
          onEnded={() => {
            setPlaying(false);
            onEnded?.();
          }}
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
