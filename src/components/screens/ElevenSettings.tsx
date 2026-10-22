"use client";

import { useEffect, useState } from "react";
import { Play, Trash2, RefreshCw, Check, Eye, EyeOff, Plus, Star } from "lucide-react";
import { update, useApp, getState } from "@/lib/store";
import { fetchStatus, listVoices, listModels, confirmPaid, describeChars, type ServerStatus, type Voice, type ModelInfo } from "@/lib/eleven-client";
import { generateClip } from "@/lib/audio/narration";
import { POSES } from "@/lib/yoga/poses";
import { deleteBlob, getBlob, listBlobs, type StoredBlob, forgetBlobUrl } from "@/lib/db";
import { playRef, unlockAudio, forgetDecoded } from "@/lib/audio/engine";
import { prefetchVoice, say } from "@/lib/audio/voice";
import { allGuidancePhrases, BREATH_EXHALE, BREATH_INHALE } from "@/lib/audio/phrases";
import { nameForms } from "@/lib/names";
import { segmentId } from "@/lib/audio/narration";
import { toast } from "@/lib/ui-store";
import { Button, Card, IconButton, Notice, Screen, ScreenHeader, SectionTitle, Segmented, Slider, TextField, Toggle, cn } from "../ui";

const MODELS = [
  { id: "eleven_v4", label: "Eleven v4 — najnowszy, bardzo naturalny i ekspresyjny" },
  { id: "eleven_v4_turbo", label: "Eleven v4 Turbo — szybszy wariant v4" },
  { id: "eleven_multilingual_v2", label: "Multilingual v2 — sprawdzony, spokojny polski" },
  { id: "eleven_v3", label: "Eleven v3 — ekspresyjny" },
  { id: "eleven_turbo_v2_5", label: "Turbo v2.5 — szybszy, tańszy" },
  { id: "eleven_flash_v2_5", label: "Flash v2.5 — najszybszy, najtańszy" },
];

const HINTS: Record<NonNullable<ServerStatus["accessHint"]>, string> = {
  empty: "Pole kodu jest puste.",
  case: "Kod różni się tylko wielkością liter. iPhone mógł zamienić pierwszą literę na wielką — użyj „Pokaż kod”, żeby sprawdzić.",
  length: "Kod ma inną liczbę znaków niż ten na serwerze. Sprawdź, czy nie brakuje znaku albo nie dopisała się spacja. Po zmianie zmiennej na Vercelu trzeba ponownie wdrożyć aplikację (Redeploy).",
  chars: "Kod ma właściwą długość, ale różni się znakami. Użyj „Pokaż kod” i porównaj ze zmienną APP_ACCESS_KEY (np. 0 i O, l i 1).",
};

function addToCollection(x: { voices?: { id: string; name: string }[] }, add: { id: string; name: string }[]) {
  const list = x.voices ?? [];
  for (const v of add) if (!list.some((y) => y.id === v.id)) list.push(v);
  x.voices = list;
}

const KIND_LABEL: Record<string, string> = { sfx: "Efekt", tts: "Narracja", session: "Sesja audio", import: "Import", cue: "Wskazówka głosowa", variant: "Wariant", photo: "Zdjęcie jogi" };

function fmtBytes(n: number) {
  if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1e3))} kB`;
}

export default function ElevenSettings() {
  const e = useApp((s) => s.eleven);
  const cues = useApp((s) => s.voiceCues);
  const [status, setStatus] = useState<ServerStatus | null | "loading">("loading");
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [blobs, setBlobs] = useState<StoredBlob[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [newVoices, setNewVoices] = useState("");
  const [voiceScope, setVoiceScope] = useState<"mine" | "all">("mine");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [accountModels, setAccountModels] = useState<ModelInfo[] | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  const refreshStatus = () => {
    setStatus("loading");
    void fetchStatus().then(setStatus);
  };
  const refreshBlobs = () => void listBlobs().then((b) => setBlobs(b.sort((x, y) => y.createdAt - x.createdAt)));

  useEffect(() => {
    refreshStatus();
    refreshBlobs();
  }, []);

  const set = (fn: (x: typeof e) => void) => update((s) => fn(s.eleven));

  const loadVoices = async (scope: "mine" | "all" = voiceScope) => {
    setLoadingVoices(true);
    setVoiceError(null);
    setVoiceScope(scope);
    try {
      setVoices(await listVoices(scope));
    } catch (err) {
      setVoices(null);
      setVoiceError(err instanceof Error ? err.message : "Nie udało się pobrać głosów.");
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadModels = async () => {
    setModelError(null);
    try {
      setAccountModels(await listModels());
    } catch (err) {
      setModelError(err instanceof Error ? err.message : "Nie udało się pobrać modeli.");
    }
  };

  const modelOptions = (() => {
    const base = MODELS.map((m) => ({ ...m, polish: undefined as boolean | undefined }));
    for (const m of accountModels ?? []) {
      const hit = base.find((b) => b.id === m.id);
      if (hit) hit.polish = m.polish;
      else base.push({ id: m.id, label: m.name, polish: m.polish });
    }
    if (e.modelId && !base.some((b) => b.id === e.modelId)) base.push({ id: e.modelId, label: e.modelId, polish: undefined });
    return base;
  })();
  const expressive = /^eleven_v[34]/.test(e.modelId);

  const testVoice = async () => {
    const text = `Cześć, ${getState().name}. Na dzisiaj wystarczy. Możesz po prostu odpocząć.`;
    if (!(await confirmPaid("Próbka głosu.", describeChars(text.length)))) return;
    setBusy("test");
    try {
      const id = await generateClip(text, "tts", "Próbka głosu");
      await unlockAudio();
      await playRef({ kind: "blob", id });
      refreshBlobs();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Błąd generacji.", 5000);
    } finally {
      setBusy(null);
    }
  };

  const phrases = allGuidancePhrases(nameForms(useApp((x) => x.name), useApp((x) => x.nameVocative)));
  const [readyCount, setReadyCount] = useState<number | null>(null);
  const countReady = async () => {
    let n = 0;
    for (const t of phrases) if (await getBlob(segmentId(t))) n++;
    setReadyCount(n);
  };
  useEffect(() => {
    void countReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.voiceId, e.modelId]);

  const generateCues = async () => {
    setBusy("cues");
    try {
      await prefetchVoice(phrases);
      await countReady();
      refreshBlobs();
    } finally {
      setBusy(null);
    }
  };

  const removeBlob = async (b: StoredBlob) => {
    const s = getState();
    const used =
      s.soundSets.some((x) => (x.start.kind === "blob" && x.start.id === b.id) || (x.close.kind === "blob" && x.close.id === b.id)) ||
      Object.values(s.audio.sessions).some((o) => o.render?.blobId === b.id);
    if (used) return toast("Ten plik jest używany przez zestaw dźwięków lub sesję. Usuń go tam.");
    update((st) => {
      for (const [k, v] of Object.entries(st.voiceCues)) if (v === b.id) delete st.voiceCues[k];
      for (const [k, v] of Object.entries(st.mantraAudio)) if (v === b.id) delete st.mantraAudio[k];
      if (st.closeRitual.narration?.kind === "blob" && st.closeRitual.narration.id === b.id) {
        st.closeRitual.narration = undefined;
        st.closeRitual.playNarration = false;
      }
    });
    forgetBlobUrl(b.id);
    forgetDecoded(b.id);
    await deleteBlob(b.id);
    refreshBlobs();
  };

  const total = blobs.reduce((a, b) => a + b.bytes, 0);
  const st = status === "loading" ? null : status;

  return (
    <Screen tabbed>
      <ScreenHeader title="ElevenLabs" subtitle="Głos narracji i własne dźwięki. Klucz API jest wyłącznie na serwerze." fallback="settings" />

      <SectionTitle action={<IconButton label="Odśwież status" className="h-8 w-8" onClick={refreshStatus}><RefreshCw className="h-4 w-4" /></IconButton>}>Połączenie</SectionTitle>
      <Card className="space-y-3">
        {status === "loading" ? (
          <p className="text-[14px] text-ink-3">Sprawdzam…</p>
        ) : !st ? (
          <Notice tone="warn">Brak połączenia z serwerem (offline). Zapisane nagrania nadal działają.</Notice>
        ) : (
          <ul className="space-y-1.5 text-[14px]">
            <StatusLine ok={st.elevenConfigured} label={st.elevenConfigured ? "Klucz ElevenLabs skonfigurowany na serwerze" : "Brak ELEVENLABS_API_KEY na serwerze"} />
            {st.accessRequired && <StatusLine ok={st.accessConfigured} label={st.accessConfigured ? "Ochrona kodem dostępu włączona" : "Serwer nie ma APP_ACCESS_KEY — płatne funkcje wyłączone"} />}
            {st.accessRequired && st.accessConfigured && <StatusLine ok={st.accessOk} label={st.accessOk ? "Kod dostępu poprawny" : "Kod dostępu nie pasuje"} />}
          </ul>
        )}
        {st && st.accessRequired && st.accessConfigured && !st.accessOk && st.accessHint && <Notice tone="warn">{HINTS[st.accessHint]}</Notice>}
        <div className="flex items-end gap-2">
          <label className="block min-w-0 flex-1">
            <span className="mb-1.5 block text-[13px] text-ink-2">Kod dostępu (APP_ACCESS_KEY)</span>
            <span className="relative block">
              <input
                // a plain text field with masking avoids iOS password autofill silently replacing the code
                type="text"
                name="dc-access-code"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                style={showKey ? undefined : ({ WebkitTextSecurity: "disc" } as React.CSSProperties)}
                className="h-12 w-full rounded-2xl bg-surface pl-4 pr-12 text-[16px] text-ink ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-sage"
                value={e.accessKey}
                onChange={(ev) => set((x) => void (x.accessKey = ev.target.value))}
                onBlur={() => {
                  set((x) => void (x.accessKey = x.accessKey.trim()));
                  refreshStatus();
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-3"
                aria-label={showKey ? "Ukryj kod" : "Pokaż kod"}
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <Button variant="secondary" className="h-12" onClick={refreshStatus}>
            Sprawdź
          </Button>
        </div>
        <p className="text-[12px] text-ink-3">Kod zapisuje się tylko na tym urządzeniu. Chroni płatne endpointy przed użyciem przez osoby trzecie.</p>
        <Toggle
          label="Pytaj przed każdą generacją"
          description="Domyślnie wyłączone — dźwięki i narracje generują się od razu po stuknięciu. Już wygenerowane fragmenty nigdy nie są generowane ponownie."
          checked={e.confirmBeforeGenerate}
          onChange={(v) => set((x) => void (x.confirmBeforeGenerate = v))}
        />
      </Card>

      <SectionTitle>Głos</SectionTitle>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] text-ink">{e.voiceName || (e.voiceId ? e.voiceId : "Nie wybrano")}</p>
            <p className="text-[12px] text-ink-3">Wybrany głos</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => loadVoices("mine")} disabled={loadingVoices}>
            {loadingVoices ? "Ładuję…" : "Pokaż moje głosy"}
          </Button>
        </div>
        {voiceError && (
          <Notice tone="warn">
            {voiceError}
            <span className="mt-1 block text-ink-2">Ręcznie wpisane ID głosu działa niezależnie od tej listy — sprawdzisz je przyciskiem „Wygeneruj próbkę głosu”.</span>
          </Notice>
        )}
        {voices && (
          <Segmented
            label="Które głosy"
            size="sm"
            value={voiceScope}
            onChange={(v) => void loadVoices(v)}
            options={[
              { value: "mine", label: "My Voices" },
              { value: "all", label: "Wszystkie" },
            ]}
          />
        )}
        {voices && voices.length === 0 && (
          <p className="text-[13px] text-ink-3">{voiceScope === "mine" ? "Na liście „My Voices” nie ma jeszcze głosów. Dodaj głos w ElevenLabs (Voice Library → Add) albo przełącz na „Wszystkie”." : "Brak głosów."}</p>
        )}
        {voices && voices.length > 0 && (
          <ul className="max-h-80 space-y-1.5 overflow-y-auto">
            {voices.map((v) => (
              <li key={v.id} className={cn("flex items-center gap-2 rounded-xl px-2 py-1.5 ring-1", v.id === e.voiceId ? "bg-sage-soft ring-sage" : "ring-line")}>
                {v.previewUrl && (
                  <IconButton label={`Posłuchaj próbki: ${v.name}`} className="h-9 w-9" onClick={() => void new Audio(v.previewUrl).play()}>
                    <Play className="h-4 w-4" />
                  </IconButton>
                )}
                <button
                  className="flex-1 text-left"
                  onClick={() =>
                    set((x) => {
                      x.voiceId = v.id;
                      x.voiceName = v.name;
                      addToCollection(x, [{ id: v.id, name: v.name }]);
                    })
                  }
                >
                  <span className="block text-[14px] text-ink">{v.name}</span>
                  <span className="block text-[11px] text-ink-3">{[v.labels.gender, v.labels.accent, v.labels.description, v.category].filter(Boolean).join(" · ")}</span>
                </button>
                {v.id === e.voiceId ? (
                  <Check className="mr-1 h-4 w-4 text-sage" />
                ) : (e.voices ?? []).some((c) => c.id === v.id) ? (
                  <span className="mr-1 text-[11px] text-ink-3">w kolekcji</span>
                ) : (
                  <IconButton label={`Dodaj do kolekcji: ${v.name}`} className="h-9 w-9" onClick={() => set((x) => addToCollection(x, [{ id: v.id, name: v.name }]))}>
                    <Plus className="h-4 w-4" />
                  </IconButton>
                )}
              </li>
            ))}
          </ul>
        )}
        <TextField label="lub ID głosu" value={e.voiceId} onChange={(ev) => set((x) => {
          x.voiceId = ev.target.value.trim();
          x.voiceName = (x.voices ?? []).find((c) => c.id === x.voiceId)?.name ?? "";
        })} />

        <div className="border-t border-line pt-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">Kolekcja głosów</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">Głosy do wyboru przy nagrywaniu sesji audio. Gwiazdka = głos domyślny (oddech, joga, myśli, mantry).</p>
          {(e.voices ?? []).length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {(e.voices ?? []).map((v) => (
                <li key={v.id} className={cn("flex items-center gap-2 rounded-xl px-2 py-1.5 ring-1", v.id === e.voiceId ? "bg-sage-soft ring-sage" : "ring-line")}>
                  <IconButton label={`Ustaw jako domyślny: ${v.name}`} className="h-9 w-9" onClick={() => set((x) => void ((x.voiceId = v.id), (x.voiceName = v.name)))}>
                    <Star className={cn("h-4 w-4", v.id === e.voiceId ? "fill-clay text-clay" : "text-ink-3")} />
                  </IconButton>
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-ink focus:outline-none"
                    aria-label={`Nazwa głosu ${v.id}`}
                    value={v.name}
                    onChange={(ev) =>
                      set((x) => {
                        const c = x.voices?.find((y) => y.id === v.id);
                        if (c) c.name = ev.target.value;
                        if (x.voiceId === v.id) x.voiceName = ev.target.value;
                      })
                    }
                  />
                  <span className="hidden text-[10px] text-ink-3 sm:inline">{v.id.slice(0, 8)}…</span>
                  <IconButton label={`Usuń z kolekcji: ${v.name}`} className="h-9 w-9" onClick={() => set((x) => void (x.voices = (x.voices ?? []).filter((y) => y.id !== v.id)))}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <input
              className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[14px] text-ink ring-1 ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="ID głosu (kilka: po przecinku)"
              aria-label="Dodaj ID głosów do kolekcji"
              value={newVoices}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(ev) => setNewVoices(ev.target.value)}
            />
            <Button
              variant="secondary"
              className="h-11"
              disabled={!newVoices.trim()}
              onClick={() => {
                const ids = newVoices.split(/[\s,;]+/).map((x) => x.trim()).filter((x) => /^[A-Za-z0-9]{10,40}$/.test(x));
                if (!ids.length) return toast("To nie wygląda na ID głosu ElevenLabs.");
                set((x) => {
                  addToCollection(x, ids.map((id, k) => ({ id, name: `Głos ${(x.voices?.length ?? 0) + k + 1}` })));
                  if (!x.voiceId) x.voiceId = ids[0];
                });
                setNewVoices("");
              }}
            >
              Dodaj
            </Button>
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-[13px] text-ink-2">
            Model
            <button type="button" className="text-[12px] text-sage-deep" onClick={loadModels}>
              Wczytaj modele z konta
            </button>
          </span>
          <select className="h-12 w-full rounded-2xl bg-surface px-3 text-[15px] text-ink ring-1 ring-line" value={e.modelId} onChange={(ev) => set((x) => void (x.modelId = ev.target.value))}>
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.polish === false ? " (bez polskiego)" : ""}
              </option>
            ))}
          </select>
        </label>
        {modelError && <Notice tone="warn">{modelError}</Notice>}
        <Slider
          label={expressive ? "Stabilność (v3/v4: kreatywna · naturalna · stabilna)" : "Stabilność"}
          value={e.stability}
          min={0}
          max={1}
          step={expressive ? 0.5 : 0.05}
          onChange={(v) => set((x) => void (x.stability = v))}
          format={(v) => (expressive ? (v < 0.25 ? "kreatywna" : v > 0.75 ? "stabilna" : "naturalna") : v.toFixed(2))}
        />
        {!expressive && (
          <>
            <Slider label="Podobieństwo do głosu" value={e.similarity} min={0} max={1} step={0.05} onChange={(v) => set((x) => void (x.similarity = v))} format={(v) => v.toFixed(2)} />
            <Slider label="Styl / ekspresja" value={e.style} min={0} max={1} step={0.05} onChange={(v) => set((x) => void (x.style = v))} format={(v) => v.toFixed(2)} />
            <Slider label="Tempo mowy" value={e.speed} min={0.7} max={1.2} step={0.05} onChange={(v) => set((x) => void (x.speed = v))} format={(v) => `${v.toFixed(2)}×`} />
          </>
        )}
        {expressive && <p className="text-[12px] text-ink-3">Modele v3 i v4 same dobierają tempo i ekspresję. Dla spokojnej narracji zalecana jest stabilność „naturalna” lub „stabilna”.</p>}
        <Button variant="secondary" block onClick={testVoice} disabled={!e.voiceId || busy === "test"}>
          {busy === "test" ? "Generuję…" : "Wygeneruj próbkę głosu"}
        </Button>
        <p className="text-[12px] text-ink-3">Zmiana głosu lub modelu sprawia, że sesje audio wymagają ponownej generacji. Stare pliki działają do tego czasu.</p>
      </Card>

      <SectionTitle>Wskazówki głosowe</SectionTitle>
      <Card className="space-y-3">
        <p className="text-[14px] leading-relaxed text-ink-2">
          Aplikacja mówi wyłącznie Twoim głosem ElevenLabs. Każda fraza („wdech”, „wydech”, instrukcje jogi, myśli, mantry) nagrywa się sama przy pierwszym użyciu i zostaje offline. Tutaj możesz nagrać wszystkie wskazówki z góry, np. przed wyjazdem.
        </p>
        <p className="text-[13px] text-ink-3">
          Gotowe offline: {readyCount ?? "…"} z {phrases.length}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={generateCues} disabled={!e.voiceId || readyCount === phrases.length || busy === "cues"}>
            {busy === "cues" ? "Nagrywam…" : readyCount === phrases.length ? "Wszystkie gotowe" : "Nagraj wszystkie teraz"}
          </Button>
          <Button size="sm" variant="ghost" disabled={!e.voiceId} onClick={async () => (await unlockAudio(), await say(BREATH_INHALE), await say(BREATH_EXHALE))}>
            <Play className="h-3.5 w-3.5" /> Wdech / wydech
          </Button>
        </div>
      </Card>

      <SectionTitle>Biblioteka audio · {fmtBytes(total)}</SectionTitle>
      {blobs.length === 0 ? (
        <p className="px-1 text-[14px] text-ink-3">Brak zapisanych plików. Wbudowane dźwięki i tła są częścią aplikacji.</p>
      ) : (
        <ul className="space-y-1.5">
          {blobs.map((b) => (
            <li key={b.id} className="flex items-center gap-2 rounded-2xl bg-surface px-2 py-1.5 ring-1 ring-line/60">
              <IconButton label={`Odtwórz: ${b.label}`} className="h-9 w-9" onClick={async () => (await unlockAudio(), void playRef({ kind: "blob", id: b.id }))}>
                <Play className="h-4 w-4" />
              </IconButton>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-ink">{b.label}</p>
                <p className="text-[11px] text-ink-3">
                  {KIND_LABEL[b.kind] ?? b.kind} · {fmtBytes(b.bytes)} · {new Date(b.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
              <IconButton label={`Usuń: ${b.label}`} className="h-9 w-9" onClick={() => removeBlob(b)}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", ok ? "bg-sage" : "bg-clay")} aria-hidden />
      <span className="text-ink">{label}</span>
    </li>
  );
}
