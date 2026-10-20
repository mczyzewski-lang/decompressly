"use client";

import { ChevronRight } from "lucide-react";
import { update, useApp } from "@/lib/store";
import { nameForms, vocative } from "@/lib/names";
import { navigate } from "@/lib/router";
import { BREATH_MODES } from "@/lib/breath";
import { YOGA_SESSIONS } from "@/lib/yoga/sessions";
import type { BreathModeId } from "@/lib/types";
import { Card, Screen, ScreenHeader, SectionTitle, Segmented, TextField, Toggle, cn } from "../ui";

function LinkRow({ label, hint, to, first }: { label: string; hint?: string; to: string; first?: boolean }) {
  return (
    <button onClick={() => navigate(to)} className={cn("flex w-full items-center gap-3 py-3.5 text-left", !first && "border-t border-line/70")}>
      <span className="flex-1">
        <span className="block text-[16px] text-ink">{label}</span>
        {hint && <span className="block text-[13px] text-ink-3">{hint}</span>}
      </span>
      <ChevronRight className="h-4 w-4 text-ink-3" />
    </button>
  );
}

export default function Settings() {
  const s = useApp((x) => x);
  const set = s.soundSets.find((x) => x.id === s.activeSoundSetId);
  return (
    <Screen tabbed>
      <ScreenHeader title="Ustawienia" />

      <SectionTitle>Ty</SectionTitle>
      <Card>
        <div className="space-y-3">
          <TextField label="Imię" value={s.name} onChange={(e) => update((st) => void (st.name = e.target.value))} />
          <TextField
            label="Jak głos ma się do Ciebie zwracać (wołacz)"
            value={s.nameVocative ?? ""}
            placeholder={vocative(s.name)}
            onChange={(e) => update((st) => void (st.nameVocative = e.target.value || undefined))}
          />
          <p className="text-[12px] text-ink-3">
            Puste pole = automatycznie: „{vocative(s.name)}”. Głos w prowadzeniu, oddechu, jodze i sesjach audio używa tej formy, np. „{nameForms(s.name, s.nameVocative).voc}, to jest Twój czas”.
          </p>
        </div>
      </Card>

      <SectionTitle>Wygląd</SectionTitle>
      <Segmented
        label="Motyw"
        value={s.theme}
        onChange={(v) => update((st) => void (st.theme = v))}
        options={[
          { value: "system", label: "Systemowy" },
          { value: "light", label: "Jasny" },
          { value: "dark", label: "Ciemny" },
        ]}
      />

      <SectionTitle>Rytuały i dźwięki</SectionTitle>
      <Card className="py-1">
        <LinkRow first label="Moje rytuały" hint="Kroki START/CLOSE, godziny, stały rytm" to="rituals" />
        <LinkRow label="Motywy dźwiękowe" hint={set?.name} to="settings/sounds" />
        <LinkRow label="ElevenLabs" hint={s.eleven.voiceName ? `Głos: ${s.eleven.voiceName}` : "Głos, kod dostępu, biblioteka audio"} to="settings/eleven" />
      </Card>

      <SectionTitle>Oddech</SectionTitle>
      <Card className="space-y-4">
        <div>
          <p className="mb-2 text-[13px] text-ink-2">Domyślny rytm</p>
          <div className="no-scrollbar -mx-1 overflow-x-auto">
            <Segmented<BreathModeId>
              label="Domyślny rytm oddechu"
              size="sm"
              className="min-w-[380px]"
              value={s.breath.defaultMode}
              onChange={(v) => update((st) => void (st.breath.defaultMode = v))}
              options={BREATH_MODES.map((m) => ({ value: m.id, label: m.label.replace(" oddech", "") }))}
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] text-ink-2">Domyślny czas</p>
          <Segmented
            label="Domyślny czas oddechu"
            size="sm"
            value={s.breath.defaultMinutes}
            onChange={(v) => update((st) => void (st.breath.defaultMinutes = v))}
            options={[2, 5, 10].map((m) => ({ value: m, label: `${m} min` }))}
          />
        </div>
      </Card>

      <SectionTitle>Joga</SectionTitle>
      <Card>
        <p className="mb-2 text-[13px] text-ink-2">Ulubiona sesja</p>
        <select
          className="h-12 w-full rounded-2xl bg-surface px-3 text-[16px] text-ink ring-1 ring-line"
          value={s.yoga.favoriteSessionId}
          onChange={(e) => update((st) => void (st.yoga.favoriteSessionId = e.target.value))}
          aria-label="Ulubiona sesja jogi"
        >
          {YOGA_SESSIONS.map((y) => (
            <option key={y.id} value={y.id}>
              {y.category === "length" ? `Sesja ${y.title}` : y.title}
            </option>
          ))}
        </select>
        <Toggle label="Hands-free" checked={s.yoga.handsFree} onChange={(v) => update((st) => void (st.yoga.handsFree = v))} />
        <Toggle label="Głos w sesji" checked={s.yoga.voice} onChange={(v) => update((st) => void (st.yoga.voice = v))} />
      </Card>

      <SectionTitle>Twoje treści</SectionTitle>
      <Card className="py-1">
        <LinkRow first label="Parking pomysłów" hint={`${s.ideas.filter((i) => i.state === "parked").length} zaparkowanych`} to="ideas" />
        <LinkRow label="Historia refleksji" hint={`${s.reflections.length} zapisanych`} to="goal" />
        <LinkRow label="Biblioteka audio" hint="Wygenerowane i zaimportowane pliki" to="settings/eleven" />
        <LinkRow label="Mantry" to="mantras" />
        <LinkRow label="Moje myśli" hint={`${s.thoughtFavorites.length} ulubionych · ${s.thoughtHidden.length} odłożonych`} to="thoughts" />
      </Card>

      <SectionTitle>Prywatność i dane</SectionTitle>
      <Card className="py-1">
        <LinkRow first label="Import i eksport danych" hint="Kopia zapasowa, pamięć urządzenia" to="settings/data" />
        <Toggle
          label="Zezwól ElevenLabs na logowanie tekstu"
          description="Domyślnie wyłączone (enable_logging=false; dostępność zależy od planu ElevenLabs)."
          checked={s.privacy.elevenLogging}
          onChange={(v) => update((st) => void (st.privacy.elevenLogging = v))}
        />
      </Card>
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-ink-3">
        Wszystkie Twoje dane — rytuały, pomysły, refleksje, historia i nagrania — są przechowywane wyłącznie na tym urządzeniu. Do serwera trafia tylko tekst wysyłany do ElevenLabs, gdy sam zatwierdzisz generację.
      </p>

      <SectionTitle>Aplikacja</SectionTitle>
      <Card className="py-1">
        <LinkRow first label="Instalacja na iPhonie" hint="Dodaj do ekranu głównego" to="install" />
      </Card>
      <p className="mt-8 text-center text-[12px] text-ink-3">Decompressly · decompressly.com · v1.0</p>
    </Screen>
  );
}
