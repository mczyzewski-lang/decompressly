"use client";

import { useMemo, useState } from "react";
import { Heart, Pin, Volume2, Sun, Plus, Sparkles, Trash2 } from "lucide-react";
import { MANTRA_CATEGORIES, allMantras, mantraForDate } from "@/lib/mantras";
import { update, useApp } from "@/lib/store";
import { newId } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { confirmPaid, describeChars } from "@/lib/eleven-client";
import { generateClip } from "@/lib/audio/narration";
import { playCue, unlockAudio } from "@/lib/audio/engine";
import { toast } from "@/lib/ui-store";
import type { Mantra, MantraCategory } from "@/lib/types";
import { Button, Chip, IconButton, Screen, ScreenHeader, Sheet, TextField, cn } from "../ui";

type Filter = MantraCategory | "all" | "fav";

export default function Mantras() {
  const custom = useApp((s) => s.customMantras);
  const favs = useApp((s) => s.mantraFavorites);
  const pinned = useApp((s) => s.mantraPinned);
  const override = useApp((s) => s.mantraOfDay);
  const audio = useApp((s) => s.mantraAudio);
  const voiceSet = useApp((s) => !!s.eleven.voiceId);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Mantra | null>(null);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newCat, setNewCat] = useState<MantraCategory>("obecnosc");
  const today = toISODate();
  const list = useMemo(() => allMantras(custom), [custom]);
  const todays = mantraForDate(today, { custom, pinned, override });

  const shown = list.filter((m) => (filter === "all" ? true : filter === "fav" ? favs.includes(m.id) : m.category === filter));

  const listen = async (m: Mantra) => {
    await unlockAudio();
    await playCue(audio[m.id], m.text, 0.9);
  };

  const generate = async (m: Mantra) => {
    if (!voiceSet) return toast("Najpierw wybierz głos w Ustawieniach → ElevenLabs.");
    if (!(await confirmPaid(`Nagranie mantry: „${m.text}”`, describeChars(m.text.length)))) return;
    try {
      const id = await generateClip(m.text, "tts", `Mantra: ${m.text.slice(0, 40)}`);
      update((s) => void (s.mantraAudio[m.id] = id));
      toast("Mantra nagrana i zapisana offline.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Nie udało się.", 5000);
    }
  };

  return (
    <Screen tabbed>
      <ScreenHeader
        title="Mantry"
        subtitle="Krótkie zdania na chwile, w których łatwo zapomnieć, co ważne."
        right={
          <IconButton label="Dodaj własną mantrę" onClick={() => setAdding(true)}>
            <Plus className="h-5 w-5" />
          </IconButton>
        }
      />
      <div className="mt-2 rounded-3xl bg-sage-soft p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">Mantra dnia{pinned === todays.id ? " · przypięta" : ""}</p>
        <p className="mt-2 font-display text-[22px] leading-snug text-ink">{todays.text}</p>
      </div>

      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Wszystkie
        </Chip>
        <Chip active={filter === "fav"} onClick={() => setFilter("fav")}>
          <Heart className="h-3.5 w-3.5" /> Ulubione
        </Chip>
        {MANTRA_CATEGORIES.map((c) => (
          <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {shown.map((m) => (
          <li key={m.id}>
            <button onClick={() => setActive(m)} className="flex w-full items-start gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left shadow-soft ring-1 ring-line/60">
              <span className="flex-1 text-[16px] leading-snug text-ink">{m.text}</span>
              <span className="mt-0.5 flex shrink-0 gap-1.5 text-ink-3">
                {pinned === m.id && <Pin className="h-4 w-4 fill-current" aria-label="przypięta" />}
                {favs.includes(m.id) && <Heart className="h-4 w-4 fill-clay text-clay" aria-label="ulubiona" />}
                {audio[m.id] && <Volume2 className="h-4 w-4" aria-label="nagrana" />}
              </span>
            </button>
          </li>
        ))}
        {shown.length === 0 && <p className="py-8 text-center text-[15px] text-ink-3">Brak mantr w tym widoku.</p>}
      </ul>

      {active && (
        <Sheet open onOpenChange={(o) => !o && setActive(null)} title="Mantra">
          <p className="font-display text-[24px] leading-snug text-ink">{active.text}</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="quiet" onClick={() => update((s) => void (s.mantraFavorites = s.mantraFavorites.includes(active.id) ? s.mantraFavorites.filter((x) => x !== active.id) : [...s.mantraFavorites, active.id]))}>
              <Heart className={cn("h-4 w-4", favs.includes(active.id) && "fill-clay text-clay")} /> {favs.includes(active.id) ? "Ulubiona" : "Ulubiona?"}
            </Button>
            <Button variant="quiet" onClick={() => update((s) => void (s.mantraPinned = s.mantraPinned === active.id ? undefined : active.id))}>
              <Pin className="h-4 w-4" /> {pinned === active.id ? "Odepnij" : "Przypnij"}
            </Button>
            <Button variant="quiet" onClick={() => (update((s) => void (s.mantraOfDay = { date: today, id: active.id })), toast("Mantra na dziś wybrana."))}>
              <Sun className="h-4 w-4" /> Na dziś
            </Button>
            <Button variant="quiet" onClick={() => listen(active)}>
              <Volume2 className="h-4 w-4" /> Odsłuchaj
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => generate(active)}>
              <Sparkles className="h-4 w-4" /> {audio[active.id] ? "Nagraj ponownie (ElevenLabs)" : "Nagraj głosem ElevenLabs"}
            </Button>
            {active.custom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  update((s) => void (s.customMantras = s.customMantras.filter((x) => x.id !== active.id)));
                  setActive(null);
                }}
              >
                <Trash2 className="h-4 w-4" /> Usuń
              </Button>
            )}
          </div>
          {!audio[active.id] && <p className="mt-2 text-[12px] text-ink-3">Bez nagrania „Odsłuchaj” używa głosu systemowego.</p>}
        </Sheet>
      )}

      <Sheet open={adding} onOpenChange={setAdding} title="Własna mantra">
        <TextField value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Krótkie, naturalne zdanie" maxLength={160} />
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {MANTRA_CATEGORIES.map((c) => (
            <Chip key={c.id} active={newCat === c.id} onClick={() => setNewCat(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
        <Button
          className="mt-5"
          variant="primary"
          block
          disabled={!newText.trim()}
          onClick={() => {
            update((s) => void s.customMantras.push({ id: newId("cm"), text: newText.trim(), category: newCat, custom: true }));
            setNewText("");
            setAdding(false);
          }}
        >
          Dodaj
        </Button>
      </Sheet>
    </Screen>
  );
}
