"use client";

import { useEffect, useState } from "react";
import { Play, Trash2, RefreshCw, Check } from "lucide-react";
import { update, useApp, getState } from "@/lib/store";
import { fetchStatus, listVoices, confirmPaid, describeChars, type ServerStatus, type Voice } from "@/lib/eleven-client";
import { generateClip } from "@/lib/audio/narration";
import { POSES } from "@/lib/yoga/poses";
import { deleteBlob, listBlobs, type StoredBlob, forgetBlobUrl } from "@/lib/db";
import { playCue, playRef, unlockAudio, forgetDecoded } from "@/lib/audio/engine";
import { toast } from "@/lib/ui-store";
import { Button, Card, IconButton, Notice, Screen, ScreenHeader, SectionTitle, Slider, TextField, cn } from "../ui";

const MODELS = [
  { id: "eleven_multilingual_v2", label: "Multilingual v2 — najbardziej naturalny polski (zalecany)" },
  { id: "eleven_v3", label: "Eleven v3 — najbardziej ekspresyjny" },
  { id: "eleven_turbo_v2_5", label: "Turbo v2.5 — szybszy, tańszy" },
  { id: "eleven_flash_v2_5", label: "Flash v2.5 — najszybszy, najtańszy" },
];

const KIND_LABEL: Record<string, string> = { sfx: "Efekt", tts: "Narracja", session: "Sesja audio", import: "Import", cue: "Wskazówka głosowa", variant: "Wariant" };

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

  const loadVoices = async () => {
    setLoadingVoices(true);
    try {
      setVoices(await listVoices());
    } catch (err) {
      toast(err instanceof Error ? err.message : "Nie udało się pobrać głosów.", 5000);
    } finally {
      setLoadingVoices(false);
    }
  };

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

  const cueList: { key: string; text: string }[] = [
    { key: "inhale", text: "Wdech." },
    { key: "exhale", text: "Wydech." },
    ...POSES.map((p) => ({ key: `yoga:${p.id}`, text: `${p.name}. ${p.cue}` })),
  ];
  const missingCues = cueList.filter((c) => !cues[c.key]);

  const generateCues = async () => {
    const list = missingCues;
    if (list.length === 0) return;
    const chars = list.reduce((a, c) => a + c.text.length, 0);
    if (!(await confirmPaid(`Wskazówki głosowe: „wdech/wydech” i instrukcje ${POSES.length} pozycji jogi (${list.length} plików).`, describeChars(chars)))) return;
    setBusy("cues");
    try {
      for (const c of list) {
        const id = await generateClip(c.text, "cue", c.key.startsWith("yoga:") ? `Joga: ${c.text.split(".")[0]}` : c.text);
        update((s) => void (s.voiceCues[c.key] = id));
      }
      toast("Wskazówki głosowe zapisane offline.");
      refreshBlobs();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Błąd generacji.", 5000);
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
            {st.accessRequired && st.accessConfigured && <StatusLine ok={st.accessOk} label={st.accessOk ? "Kod dostępu poprawny" : "Wpisz poprawny kod dostępu"} />}
          </ul>
        )}
        <TextField
          label="Kod dostępu (APP_ACCESS_KEY)"
          type="password"
          autoComplete="off"
          value={e.accessKey}
          onChange={(ev) => set((x) => void (x.accessKey = ev.target.value))}
          onBlur={refreshStatus}
        />
        <p className="text-[12px] text-ink-3">Kod zapisuje się tylko na tym urządzeniu. Chroni płatne endpointy przed użyciem przez osoby trzecie.</p>
      </Card>

      <SectionTitle>Głos</SectionTitle>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] text-ink">{e.voiceName || (e.voiceId ? e.voiceId : "Nie wybrano")}</p>
            <p className="text-[12px] text-ink-3">Wybrany głos</p>
          </div>
          <Button size="sm" variant="secondary" onClick={loadVoices} disabled={loadingVoices}>
            {loadingVoices ? "Ładuję…" : "Pokaż głosy"}
          </Button>
        </div>
        {voices && (
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
                    })
                  }
                >
                  <span className="block text-[14px] text-ink">{v.name}</span>
                  <span className="block text-[11px] text-ink-3">{[v.labels.gender, v.labels.accent, v.labels.description, v.category].filter(Boolean).join(" · ")}</span>
                </button>
                {v.id === e.voiceId && <Check className="mr-1 h-4 w-4 text-sage" />}
              </li>
            ))}
          </ul>
        )}
        <TextField label="lub ID głosu" value={e.voiceId} onChange={(ev) => set((x) => {
          x.voiceId = ev.target.value.trim();
          x.voiceName = "";
        })} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink-2">Model</span>
          <select className="h-12 w-full rounded-2xl bg-surface px-3 text-[15px] text-ink ring-1 ring-line" value={e.modelId} onChange={(ev) => set((x) => void (x.modelId = ev.target.value))}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <Slider label="Stabilność" value={e.stability} min={0} max={1} step={0.05} onChange={(v) => set((x) => void (x.stability = v))} format={(v) => v.toFixed(2)} />
        <Slider label="Podobieństwo do głosu" value={e.similarity} min={0} max={1} step={0.05} onChange={(v) => set((x) => void (x.similarity = v))} format={(v) => v.toFixed(2)} />
        <Slider label="Styl / ekspresja" value={e.style} min={0} max={1} step={0.05} onChange={(v) => set((x) => void (x.style = v))} format={(v) => v.toFixed(2)} />
        <Slider label="Tempo mowy" value={e.speed} min={0.7} max={1.2} step={0.05} onChange={(v) => set((x) => void (x.speed = v))} format={(v) => `${v.toFixed(2)}×`} />
        <Button variant="secondary" block onClick={testVoice} disabled={!e.voiceId || busy === "test"}>
          {busy === "test" ? "Generuję…" : "Wygeneruj próbkę głosu"}
        </Button>
        <p className="text-[12px] text-ink-3">Zmiana głosu lub modelu sprawia, że sesje audio wymagają ponownej generacji. Stare pliki działają do tego czasu.</p>
      </Card>

      <SectionTitle>Wskazówki głosowe</SectionTitle>
      <Card className="space-y-3">
        <p className="text-[14px] leading-relaxed text-ink-2">„Wdech” i „wydech” do oddechu oraz krótkie instrukcje pozycji jogi. Bez nich aplikacja używa głosu systemowego.</p>
        <p className="text-[13px] text-ink-3">
          Zapisane: {cueList.length - missingCues.length} z {cueList.length}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={generateCues} disabled={!e.voiceId || missingCues.length === 0 || busy === "cues"}>
            {busy === "cues" ? "Generuję…" : missingCues.length ? `Wygeneruj brakujące (${missingCues.length})` : "Wszystkie zapisane"}
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => (await unlockAudio(), void playCue(cues.inhale, "wdech"), setTimeout(() => void playCue(cues.exhale, "wydech"), 1400))}>
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
