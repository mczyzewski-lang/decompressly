"use client";

import { useEffect, useState } from "react";
import { update, useApp } from "@/lib/store";
import { addToCollection, parseVoiceIds } from "@/lib/voices";
import { TextField } from "./ui";

/**
 * The second ElevenLabs voice: yoga speaks with it (livelier), meditations keep the calm main voice.
 * A pasted ID is cleaned up (invisible characters, whole links) and added to the voice collection.
 */
export function YogaVoiceField() {
  const yogaId = useApp((s) => s.yoga.voiceId ?? "");
  const mainId = useApp((s) => s.eleven.voiceId);
  const name = useApp((s) => s.eleven.voices?.find((v) => v.id === s.yoga.voiceId)?.name);
  const [draft, setDraft] = useState(yogaId);
  useEffect(() => setDraft(yogaId), [yogaId]);

  // saved on paste or when leaving the field — typing letter by letter must not store half an ID
  const commit = (raw: string) => {
    const id = parseVoiceIds(raw)[0] ?? "";
    if (!raw.trim()) {
      update((s) => void (s.yoga.voiceId = ""));
      return;
    }
    if (!id) return; // still typing
    update((s) => {
      s.yoga.voiceId = id;
      addToCollection(s.eleven, [{ id, name: s.eleven.voices?.find((v) => v.id === id)?.name ?? "Głos do jogi" }]);
    });
  };

  return (
    <div>
      <TextField
        label="ID głosu ElevenLabs do jogi (dynamiczny)"
        placeholder="np. Hf6cweL2QiwvPv7zuh5B"
        value={draft}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => {
          const v = e.target.value;
          const pasted = v.length - draft.length >= 10;
          setDraft(v);
          if (pasted || !v.trim()) commit(v);
        }}
        onBlur={(e) => commit(e.target.value)}
      />
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
        {!yogaId
          ? "Puste — joga mówi głosem do medytacji. Wklej ID innego, bardziej energicznego głosu z ElevenLabs (np. szukając „energetic”, „fitness”, „coach”)."
          : yogaId === mainId
            ? "To ten sam głos co do medytacji — wklej ID innego głosu, żeby joga brzmiała inaczej."
            : `Joga mówi głosem „${name ?? "Głos do jogi"}”. Model tego głosu ustawisz w Ustawieniach → ElevenLabs → Kolekcja głosów.`}
      </p>
    </div>
  );
}
