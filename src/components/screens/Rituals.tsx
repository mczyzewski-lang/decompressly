"use client";

import { useState } from "react";
import { Plus, X, Sparkles, Play } from "lucide-react";
import { getNameForms, update, useApp } from "@/lib/store";
import { closeNarration } from "@/lib/audio/phrases";
import { DAY_MODES, DEFAULT_TEMPLATES } from "@/lib/defaults";
import { newId, deleteBlob } from "@/lib/db";
import { navigate } from "@/lib/router";
import { confirmPaid, describeChars } from "@/lib/eleven-client";
import { generateClip } from "@/lib/audio/narration";
import { playRef, unlockAudio } from "@/lib/audio/engine";
import { toast } from "@/lib/ui-store";
import type { DayMode, RhythmTemplateItem } from "@/lib/types";
import { Button, Card, IconButton, Screen, ScreenHeader, SectionTitle, Segmented, TextArea, TextField, Toggle } from "../ui";

export function StringListEditor({ items, onChange, label, placeholder }: { items: string[]; onChange: (v: string[]) => void; label: string; placeholder?: string }) {
  return (
    <div className="space-y-2" aria-label={label}>
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="tabular w-5 text-center text-[13px] text-ink-3">{i + 1}</span>
          <input
            className="h-11 flex-1 rounded-xl bg-surface px-3 text-[16px] text-ink ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-sage"
            value={s}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))}
          />
          <IconButton label={`Usuń ${i + 1}`} className="h-9 w-9" onClick={() => onChange(items.filter((_, k) => k !== i))}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
      <button className="flex items-center gap-2 px-1 py-2 text-[14px] text-sage-deep" onClick={() => onChange([...items, placeholder ?? ""])}>
        <Plus className="h-4 w-4" /> Dodaj krok
      </button>
    </div>
  );
}

export default function Rituals() {
  const start = useApp((s) => s.startRitual);
  const close = useApp((s) => s.closeRitual);
  const templates = useApp((s) => s.templates);
  const set = useApp((s) => s.soundSets.find((x) => x.id === s.activeSoundSetId));
  const [mode, setMode] = useState<DayMode>("work");
  const [busy, setBusy] = useState(false);

  const genNarration = async () => {
    const text = closeNarration(close.message, getNameForms());
    if (!(await confirmPaid("Narracja zamknięcia dnia (jeden krótki plik).", describeChars(text.length)))) return;
    setBusy(true);
    try {
      const id = await generateClip(text, "tts", "Narracja CLOSE");
      const old = close.narration?.kind === "blob" ? close.narration.id : null;
      update((s) => {
        s.closeRitual.narration = { kind: "blob", id };
        s.closeRitual.playNarration = true;
      });
      if (old) await deleteBlob(old);
      toast("Narracja zapisana.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nie udało się.", 5000);
    } finally {
      setBusy(false);
    }
  };

  const items = templates[mode];
  const setItems = (fn: (arr: RhythmTemplateItem[]) => RhythmTemplateItem[]) =>
    update((s) => {
      s.templates[mode] = fn(s.templates[mode]).sort((a, b) => a.time.localeCompare(b.time));
    });

  return (
    <Screen tabbed>
      <ScreenHeader title="Moje rytuały" subtitle="Wszystko tutaj możesz zmienić. Prostota jest ważniejsza niż kompletność." />

      <SectionTitle>Start day</SectionTitle>
      <Card className="space-y-4">
        <StringListEditor label="Krok START" items={start.steps} onChange={(v) => update((s) => void (s.startRitual.steps = v))} />
        <TextField
          label="Ulubiony napój na start"
          value={start.drink}
          onChange={(e) => update((s) => void (s.startRitual.drink = e.target.value))}
        />
        <TextArea label="Mantra po rozpoczęciu" rows={2} value={start.mantra} onChange={(e) => update((s) => void (s.startRitual.mantra = e.target.value))} />
        <Toggle label="Pokazuj mantrę po rozpoczęciu" checked={start.showMantra} onChange={(v) => update((s) => void (s.startRitual.showMantra = v))} />
      </Card>

      <SectionTitle>Close day</SectionTitle>
      <Card className="space-y-4">
        <StringListEditor label="Krok CLOSE" items={close.steps} onChange={(v) => update((s) => void (s.closeRitual.steps = v))} />
        <TextField label="Orientacyjna godzina zamknięcia" type="time" value={close.defaultTime} onChange={(e) => {
          const t = e.target.value;
          update((s) => {
            s.closeRitual.defaultTime = t;
            const it = s.templates.work.find((x) => x.link === "close");
            if (it) it.time = t;
          });
        }} />
        <TextArea label="Tekst po zamknięciu" rows={3} value={close.message} onChange={(e) => update((s) => void (s.closeRitual.message = e.target.value))} />
        <Toggle
          label="Narracja po dźwięku CLOSE"
          description={close.narration ? "Wygenerowana i zapisana offline" : "Najpierw wygeneruj narrację"}
          checked={close.playNarration && !!close.narration}
          onChange={(v) => update((s) => void (s.closeRitual.playNarration = v))}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={genNarration} disabled={busy}>
            <Sparkles className="h-4 w-4" /> {busy ? "Generuję…" : close.narration ? "Wygeneruj ponownie" : "Wygeneruj narrację ElevenLabs"}
          </Button>
          {close.narration && (
            <Button variant="ghost" size="sm" onClick={async () => (await unlockAudio(), void playRef(close.narration))}>
              <Play className="h-4 w-4" /> Odsłuchaj
            </Button>
          )}
        </div>
        <p className="text-[12px] text-ink-3">Bez natarczywych powiadomień — Decompressly nie wysyła przypomnień o zaległościach.</p>
      </Card>

      <SectionTitle>Dźwięki rytuałów</SectionTitle>
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-[15px] text-ink">{set?.name ?? "—"}</p>
          <p className="text-[13px] text-ink-3">Aktywny zestaw START/CLOSE</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate("settings/sounds")}>
          Zmień
        </Button>
      </Card>

      <SectionTitle>Stały rytm dnia</SectionTitle>
      <Segmented label="Rodzaj dnia" size="sm" value={mode} onChange={setMode} options={DAY_MODES.map((m) => ({ value: m.id, label: m.label }))} />
      <Card className="mt-3 space-y-2">
        {mode === "trip" ? (
          <p className="text-[14px] text-ink-2">W trybie wyjazdu nie ma harmonogramu. Plan wyjazdu edytujesz w „Tryb wyjazdu”.</p>
        ) : (
          <>
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2">
                <input
                  type="time"
                  aria-label={`Godzina: ${it.title}`}
                  className="tabular h-11 w-[96px] rounded-xl bg-surface px-2 text-[16px] text-ink ring-1 ring-line"
                  value={it.time}
                  onChange={(e) => setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, time: e.target.value } : x)))}
                />
                <input
                  aria-label="Nazwa"
                  className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-[16px] text-ink ring-1 ring-line"
                  value={it.title}
                  onChange={(e) => setItems((arr) => arr.map((x) => (x.id === it.id ? { ...x, title: e.target.value } : x)))}
                />
                <IconButton label={`Usuń: ${it.title}`} className="h-9 w-9" onClick={() => setItems((arr) => arr.filter((x) => x.id !== it.id))}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <button className="flex items-center gap-2 px-1 py-2 text-[14px] text-sage-deep" onClick={() => setItems((arr) => [...arr, { id: newId("t"), time: "12:00", title: "Nowy punkt" }])}>
                <Plus className="h-4 w-4" /> Dodaj
              </button>
              <button className="px-1 py-2 text-[13px] text-ink-3" onClick={() => setItems(() => structuredClone(DEFAULT_TEMPLATES[mode]))}>
                Przywróć domyślne
              </button>
            </div>
          </>
        )}
      </Card>
      <p className="mt-3 px-1 text-[12px] text-ink-3">Zmiany obowiązują od kolejnych dni. Dzisiejszy plan edytujesz bezpośrednio na ekranie Dziś.</p>
    </Screen>
  );
}
