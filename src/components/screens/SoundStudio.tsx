"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Check, Trash2, Upload, Sparkles, Wand2, Square } from "lucide-react";
import { flushSave, update, useApp, getState } from "@/lib/store";
import { STYLE_PRESETS, STYLE_BY_ID, DEFAULT_PROMPT_INFLUENCE, SOUND_DURATION, promptForDuration } from "@/lib/sounds";
import { deleteBlob, getBlob, newId, putBlob } from "@/lib/db";
import { confirmPaid, generateSound } from "@/lib/eleven-client";
import { playRef, refUrl, stopRitualSound, unlockAudio } from "@/lib/audio/engine";
import { decodeAny, encodeMp3, makeVariant, VARIANT_LABELS, type VariantKind } from "@/lib/audio/render";
import { toast } from "@/lib/ui-store";
import type { AudioRef, SoundDraft, SoundSet, SoundStyle } from "@/lib/types";
import { Button, Card, Chip, IconButton, Notice, Screen, ScreenHeader, SectionTitle, Segmented, Sheet, Slider, TextArea, TextField, cn } from "../ui";

const STYLE_LABEL: Record<SoundStyle, string> = { nature: "Natura", system: "System", jazz: "Jazz", orchestral: "Orkiestra", custom: "Własny" };

function emptyDraft(style: SoundStyle): SoundDraft {
  const p = style === "custom" ? null : STYLE_BY_ID[style];
  return { style, promptStart: p?.start ?? "", promptClose: p?.close ?? "", promptInfluence: DEFAULT_PROMPT_INFLUENCE, startTakes: [], closeTakes: [] };
}

export default function SoundStudio() {
  const sets = useApp((s) => s.soundSets);
  const activeId = useApp((s) => s.activeSoundSetId);
  const drafts = useApp((s) => s.soundDrafts);
  const [style, setStyle] = useState<SoundStyle>("system");
  const [busy, setBusy] = useState<"start" | "close" | null>(null);
  const [name, setName] = useState("");
  const [variantOpen, setVariantOpen] = useState(false);
  const [allProgress, setAllProgress] = useState<string | null>(null);
  const draft = drafts[style] ?? emptyDraft(style);
  const duration = draft.duration ?? SOUND_DURATION;

  const setDraft = (fn: (d: SoundDraft) => void) =>
    update((s) => {
      const d = (s.soundDrafts[style] ??= emptyDraft(style));
      fn(d);
    });

  const play = async (ref?: AudioRef) => {
    await unlockAudio();
    if (!ref) return;
    const el = await playRef(ref);
    if (!el) toast("Nie udało się odtworzyć dźwięku.");
  };

  const playPair = async (a?: AudioRef, b?: AudioRef) => {
    await unlockAudio();
    const el = await playRef(a);
    if (el && b) el.addEventListener("ended", () => setTimeout(() => void playRef(b), 900), { once: true });
  };

  const generate = async (which: "start" | "close") => {
    const prompt = (which === "start" ? draft.promptStart : draft.promptClose).trim();
    if (!prompt) return toast("Wpisz opis dźwięku.");
    const ok = await confirmPaid(
      `Efekt dźwiękowy ${which.toUpperCase()} · ${duration} s · styl ${STYLE_LABEL[style]}.`,
      `Model eleven_text_to_sound_v2, prompt_influence ${draft.promptInfluence.toFixed(2)}. Każda generacja to osobny koszt (zależny od długości dźwięku).`,
    );
    if (!ok) return;
    setBusy(which);
    try {
      const blob = await generateSound(promptForDuration(prompt, duration), { duration, promptInfluence: draft.promptInfluence });
      const id = await putBlob(blob, "sfx", `${STYLE_LABEL[style]} ${which.toUpperCase()}`, { prompt });
      setDraft((d) => {
        if (which === "start") {
          d.startTakes.push(id);
          d.start = { kind: "blob", id };
        } else {
          d.closeTakes.push(id);
          d.close = { kind: "blob", id };
        }
      });
      void play({ kind: "blob", id });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nie udało się wygenerować.", 5000);
    } finally {
      setBusy(null);
    }
  };

  const importFile = async (which: "start" | "close", file: File) => {
    if (!/audio\/(mpeg|mp3|wav|x-wav|wave|mp4|x-m4a|aac)/.test(file.type) && !/\.(mp3|wav|m4a)$/i.test(file.name)) return toast("Obsługiwane pliki: MP3, WAV, M4A.");
    if (file.size > 15 * 1024 * 1024) return toast("Plik jest za duży (maks. 15 MB).");
    try {
      await decodeAny(file); // validate it is playable
    } catch {
      return toast("Nie udało się odczytać pliku audio.");
    }
    const id = await putBlob(file, "import", file.name);
    setDraft((d) => {
      if (which === "start") {
        d.startTakes.push(id);
        d.start = { kind: "blob", id };
      } else {
        d.closeTakes.push(id);
        d.close = { kind: "blob", id };
      }
    });
    toast("Plik zaimportowany.");
  };

  const variant = async (kind: VariantKind, from: "start" | "close") => {
    setVariantOpen(false);
    const src = from === "start" ? draft.start : draft.close;
    const url = await refUrl(src);
    if (!url) return toast(`Najpierw wybierz ${from.toUpperCase()}.`);
    try {
      const buf = await decodeAny(await (await fetch(url)).blob());
      const out = await makeVariant(buf, kind, Math.min(35, Math.max(8, buf.duration * (kind === "calmer" ? 1.12 : 1))));
      const mp3 = await encodeMp3(out, 128);
      const id = await putBlob(mp3, "variant", `Wariant (${kind})`);
      setDraft((d) => {
        if (from === "start") {
          d.closeTakes.push(id);
          d.close = { kind: "blob", id };
        } else {
          d.startTakes.push(id);
          d.start = { kind: "blob", id };
        }
      });
      void play({ kind: "blob", id });
    } catch (e) {
      toast("Nie udało się utworzyć wariantu.");
      console.error(e);
    }
  };

  /** One tap: START + CLOSE for every style with the signature prompts, each saved as its own set. */
  const generateAll = async () => {
    const ok = await confirmPaid(
      `Nowe zestawy START/CLOSE dla wszystkich ${STYLE_PRESETS.length} stylów (${STYLE_PRESETS.length * 2} dźwięków po ${duration} s).`,
      "Każdy dźwięk to osobna generacja efektu.",
    );
    if (!ok) return;
    // new sets are only ever appended — existing sets (and their audio) are never replaced or removed
    const now = new Date();
    const date = `${now.toLocaleDateString("pl-PL")} ${now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
    let made = 0;
    try {
      for (const p of STYLE_PRESETS) {
        setAllProgress(`${p.label}: START…`);
        const s = await generateSound(promptForDuration(p.start, duration), { duration, promptInfluence: DEFAULT_PROMPT_INFLUENCE });
        const startId = await putBlob(s, "sfx", `${p.label} START`, { prompt: p.start });
        setAllProgress(`${p.label}: CLOSE…`);
        const c = await generateSound(promptForDuration(p.close, duration), { duration, promptInfluence: DEFAULT_PROMPT_INFLUENCE });
        const closeId = await putBlob(c, "sfx", `${p.label} CLOSE`, { prompt: p.close });
        update((st) => {
          st.soundSets.push({
            id: newId("set"),
            name: `${p.label} · ElevenLabs ${date}`,
            style: p.id,
            start: { kind: "blob", id: startId },
            close: { kind: "blob", id: closeId },
            createdAt: Date.now(),
            promptStart: p.start,
            promptClose: p.close,
            source: "elevenlabs",
          });
        });
        made++;
      }
      await flushSave();
      toast("Gotowe: nowe zestawy dodane do listy (poprzednie zostały). Odsłuchaj i wybierz ulubiony.", 5000);
    } catch (e) {
      toast(`${made ? `Zapisano ${made} zestawy. ` : ""}${e instanceof Error ? e.message : "Nie udało się wygenerować."}`, 6000);
    } finally {
      setAllProgress(null);
    }
  };

  const save = async (activate: boolean) => {
    if (!draft.start || !draft.close) return;
    const set: SoundSet = {
      id: newId("set"),
      name: name.trim() || `${STYLE_LABEL[style]} · ${new Date().toLocaleDateString("pl-PL")}`,
      style,
      start: draft.start,
      close: draft.close,
      createdAt: Date.now(),
      promptStart: draft.promptStart,
      promptClose: draft.promptClose,
      source: "elevenlabs",
    };
    const keep = new Set([draft.start.kind === "blob" ? draft.start.id : "", draft.close.kind === "blob" ? draft.close.id : ""]);
    const discard = [...draft.startTakes, ...draft.closeTakes].filter((id) => !keep.has(id));
    update((s) => {
      s.soundSets.push(set);
      if (activate) s.activeSoundSetId = set.id;
      delete s.soundDrafts[style];
    });
    await flushSave();
    for (const id of discard) await deleteBlob(id);
    setName("");
    toast(activate ? "Zestaw zapisany i aktywny." : "Zestaw zapisany.");
  };

  const removeSet = async (set: SoundSet) => {
    if (set.builtIn) return;
    const inUse = getState().soundSets.filter((x) => x.id !== set.id);
    update((s) => {
      s.soundSets = s.soundSets.filter((x) => x.id !== set.id);
      if (s.activeSoundSetId === set.id) s.activeSoundSetId = "builtin-system";
    });
    for (const ref of [set.start, set.close]) {
      if (ref.kind === "blob" && !inUse.some((x) => (x.start.kind === "blob" && x.start.id === ref.id) || (x.close.kind === "blob" && x.close.id === ref.id))) await deleteBlob(ref.id);
    }
  };

  return (
    <Screen tabbed>
      <ScreenHeader title="Motywy dźwiękowe" subtitle="Dwa powiązane dźwięki: START otwiera dzień, CLOSE go zamyka." fallback="settings" />

      <Card className="mt-2">
        <p className="text-[15px] leading-relaxed text-ink">Wygeneruj ElevenLabs dla wszystkich stylów</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          Natura, System, Jazz i Orkiestra: energetyczny START i kojący CLOSE z tą samą charakterystyczną melodią. Każda para zapisze się jako osobny zestaw.
        </p>
        <Button className="mt-4" variant="primary" block onClick={generateAll} disabled={!!allProgress}>
          <Sparkles className="h-4 w-4" /> {allProgress ?? `Wygeneruj 4 zestawy (${duration} s)`}
        </Button>
      </Card>

      <SectionTitle>Zapisane zestawy</SectionTitle>
      <div className="space-y-2">
        {sets.map((set) => (
          <Card key={set.id} className={cn("p-4", set.id === activeId && "ring-2 ring-sage")}>
            <div className="flex items-center justify-between gap-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => update((s) => void (s.activeSoundSetId = set.id))} aria-pressed={set.id === activeId}>
                <p className="truncate text-[16px] text-ink">{set.name}</p>
                <p className="text-[12px] text-ink-3">
                  {set.id === activeId ? "Aktywny · " : "Dotknij, aby ustawić jako aktywny · "}
                  {set.builtIn ? "wbudowany, offline" : set.source === "elevenlabs" ? "ElevenLabs / import" : set.source}
                </p>
              </button>
              {set.id === activeId && <Check className="h-5 w-5 text-sage" />}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="quiet" onClick={() => play(set.start)}>
                <Play className="h-3.5 w-3.5" /> START
              </Button>
              <Button size="sm" variant="quiet" onClick={() => play(set.close)}>
                <Play className="h-3.5 w-3.5" /> CLOSE
              </Button>
              <IconButton label="Zatrzymaj" className="h-9 w-9" onClick={stopRitualSound}>
                <Square className="h-4 w-4" />
              </IconButton>
              {!set.builtIn && (
                <IconButton label={`Usuń zestaw ${set.name}`} className="ml-auto h-9 w-9" onClick={() => removeSet(set)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              )}
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-ink-3">
        Wbudowane zestawy są skomponowane i syntezowane przez Decompressly (stereo, 20 s, bez praw osób trzecich): wszystkie dzielą jedną pięciodźwiękową melodię-sygnet — START gra ją energicznie na rytmicznym tle, CLOSE zaczyna tymi samymi nutami i spokojnie schodzi do domu. Działają offline. Zapisane zestawy nigdy nie są generowane ponownie.
      </p>

      <SectionTitle>Nowy zestaw</SectionTitle>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {(["nature", "system", "jazz", "orchestral", "custom"] as SoundStyle[]).map((s) => (
          <Chip key={s} active={style === s} onClick={() => setStyle(s)}>
            {STYLE_LABEL[s]}
          </Chip>
        ))}
      </div>
      {style !== "custom" && <p className="mt-2 px-1 text-[13px] text-ink-3">{STYLE_PRESETS.find((p) => p.id === style)?.description}</p>}

      <Card className="mt-3 space-y-4">
        <Notice>
          Dwie osobne generacje nie gwarantują identycznego motywu. Najpewniejsza droga: wygeneruj i zaakceptuj START, a CLOSE utwórz jako wariant tego samego motywu (bez kosztów) — albo wygeneruj kilka wersji CLOSE i wybierz najlepiej pasującą.
        </Notice>

        {style !== "custom" && (draft.promptStart !== STYLE_BY_ID[style].start || draft.promptClose !== STYLE_BY_ID[style].close) && (
          <button
            className="text-left text-[13px] text-sage-deep"
            onClick={() =>
              setDraft((d) => {
                d.promptStart = STYLE_BY_ID[style as keyof typeof STYLE_BY_ID].start;
                d.promptClose = STYLE_BY_ID[style as keyof typeof STYLE_BY_ID].close;
              })
            }
          >
            Użyj nowych promptów stylu (energetyczny START, kojący CLOSE)
          </button>
        )}

        <TakeEditor
          label="START"
          prompt={draft.promptStart}
          onPrompt={(v) => setDraft((d) => void (d.promptStart = v))}
          takes={draft.startTakes}
          selected={draft.start}
          onSelect={(id) => setDraft((d) => void (d.start = { kind: "blob", id }))}
          onRemoveTake={async (id) => {
            setDraft((d) => {
              d.startTakes = d.startTakes.filter((x) => x !== id);
              if (d.start?.kind === "blob" && d.start.id === id) d.start = undefined;
            });
            await deleteBlob(id);
          }}
          onGenerate={() => generate("start")}
          onImport={(f) => importFile("start", f)}
          onPlay={play}
          busy={busy === "start"}
        />

        <TakeEditor
          label="CLOSE"
          prompt={draft.promptClose}
          onPrompt={(v) => setDraft((d) => void (d.promptClose = v))}
          takes={draft.closeTakes}
          selected={draft.close}
          onSelect={(id) => setDraft((d) => void (d.close = { kind: "blob", id }))}
          onRemoveTake={async (id) => {
            setDraft((d) => {
              d.closeTakes = d.closeTakes.filter((x) => x !== id);
              if (d.close?.kind === "blob" && d.close.id === id) d.close = undefined;
            });
            await deleteBlob(id);
          }}
          onGenerate={() => generate("close")}
          onImport={(f) => importFile("close", f)}
          onPlay={play}
          busy={busy === "close"}
        />

        <Button variant="secondary" block onClick={() => setVariantOpen(true)} disabled={!draft.start && !draft.close}>
          <Wand2 className="h-4 w-4" /> Utwórz wariant z jednego motywu (bez kosztów)
        </Button>

        <div>
          <p className="mb-2 text-[13px] text-ink-2">Długość dźwięku</p>
          <Segmented<number>
            label="Długość dźwięku"
            size="sm"
            value={duration}
            onChange={(v) => setDraft((d) => void (d.duration = v))}
            options={[10, 15, 20, 30].map((v) => ({ value: v, label: `${v} s` }))}
          />
        </div>

        <Slider label="Wierność opisowi (prompt_influence)" value={draft.promptInfluence} min={0} max={1} step={0.05} onChange={(v) => setDraft((d) => void (d.promptInfluence = v))} format={(v) => v.toFixed(2)} />

        <div className="border-t border-line pt-4">
          <Button variant="quiet" block disabled={!draft.start || !draft.close} onClick={() => playPair(draft.start, draft.close)}>
            <Play className="h-4 w-4" /> Odsłuchaj parę START → CLOSE
          </Button>
          <div className="mt-3">
            <TextField label="Nazwa zestawu" value={name} onChange={(e) => setName(e.target.value)} placeholder={`${STYLE_LABEL[style]} · mój`} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" block disabled={!draft.start || !draft.close} onClick={() => save(false)}>
              Zapisz jako zestaw
            </Button>
            <Button variant="primary" block disabled={!draft.start || !draft.close} onClick={() => save(true)}>
              Zapisz i ustaw
            </Button>
          </div>
        </div>
      </Card>

      <Sheet open={variantOpen} onOpenChange={setVariantOpen} title="Wariant z motywu bazowego" description="Przetwarzanie odbywa się na urządzeniu — bez kosztów i bez wysyłania danych.">
        <div className="space-y-2">
          {draft.start && (
            <Button variant="quiet" block className="h-auto whitespace-normal py-3 text-left" onClick={() => variant("calmer", "start")}>
              CLOSE z wybranego START: {VARIANT_LABELS.calmer}
            </Button>
          )}
          {draft.start && (
            <Button variant="quiet" block className="h-auto whitespace-normal py-3 text-left" onClick={() => variant("reverse", "start")}>
              CLOSE z wybranego START: {VARIANT_LABELS.reverse}
            </Button>
          )}
          {draft.close && (
            <Button variant="quiet" block className="h-auto whitespace-normal py-3 text-left" onClick={() => variant("brighter", "close")}>
              START z wybranego CLOSE: {VARIANT_LABELS.brighter}
            </Button>
          )}
        </div>
      </Sheet>
    </Screen>
  );
}

function TakeEditor(props: {
  label: string;
  prompt: string;
  onPrompt: (v: string) => void;
  takes: string[];
  selected?: AudioRef;
  onSelect: (id: string) => void;
  onRemoveTake: (id: string) => void;
  onGenerate: () => void;
  onImport: (f: File) => void;
  onPlay: (r: AudioRef) => void;
  busy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedId = props.selected?.kind === "blob" ? props.selected.id : null;
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{props.label}</p>
      <TextArea aria-label={`Opis dźwięku ${props.label} (po angielsku)`} rows={4} className="text-[14px]" value={props.prompt} onChange={(e) => props.onPrompt(e.target.value)} />
      {props.takes.length > 0 && (
        <ul className="mt-2 space-y-1.5" aria-label={`Wersje ${props.label}`}>
          {props.takes.map((id, i) => (
            <TakeRow key={id} id={id} index={i} selected={id === selectedId} onSelect={() => props.onSelect(id)} onPlay={() => props.onPlay({ kind: "blob", id })} onRemove={() => props.onRemoveTake(id)} />
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="primary" onClick={props.onGenerate} disabled={props.busy}>
          <Sparkles className="h-3.5 w-3.5" /> {props.busy ? "Generuję…" : props.takes.length ? "Regeneruj" : `Generuj ${props.label}`}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Import MP3/WAV
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,.mp3,.wav,.m4a"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) props.onImport(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function TakeRow({ id, index, selected, onSelect, onPlay, onRemove }: { id: string; index: number; selected: boolean; onSelect: () => void; onPlay: () => void; onRemove: () => void }) {
  const [label, setLabel] = useState<string>(`Wersja ${index + 1}`);
  useEffect(() => {
    void getBlob(id).then((b) => b && b.kind !== "sfx" && setLabel(`${b.kind === "import" ? "Import" : "Wariant"}: ${b.label}`.slice(0, 40)));
  }, [id]);
  return (
    <li className={cn("flex items-center gap-2 rounded-xl px-2 py-1.5 ring-1", selected ? "bg-sage-soft ring-sage" : "ring-line")}>
      <IconButton label={`Odsłuchaj: ${label}`} className="h-9 w-9" onClick={onPlay}>
        <Play className="h-4 w-4" />
      </IconButton>
      <button className="flex-1 text-left text-[14px] text-ink" onClick={onSelect} aria-pressed={selected}>
        {label} {selected && <span className="text-sage-deep">· wybrana</span>}
      </button>
      <IconButton label={`Usuń: ${label}`} className="h-9 w-9" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </li>
  );
}
