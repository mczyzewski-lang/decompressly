"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { paraphraseReflection } from "@/lib/eleven-client";
import { update, useApp } from "@/lib/store";
import { Button, Card, Chip, IconButton, Notice, Screen, ScreenHeader, SectionTitle, TextField } from "../ui";

const MODELS = ["gpt-5.4-mini", "gpt-5.4", "gpt-5.5"];

export default function OpenAISettings() {
  const o = useApp((s) => s.openai) ?? { apiKey: "", model: "gpt-5.4-mini" };
  const [show, setShow] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (fn: (x: { apiKey: string; model: string }) => void) => update((s) => fn((s.openai ??= { apiKey: "", model: "gpt-5.4-mini" })));

  const check = async () => {
    setBusy(true);
    setTest(null);
    try {
      const p = await paraphraseReflection("Dziś było mi trochę lżej, chociaż w głowie wciąż kręci się praca.", "Co jest teraz lżejsze?");
      setTest({ ok: true, text: p });
    } catch (e) {
      setTest({ ok: false, text: e instanceof Error ? e.message : "Nie udało się." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="OpenAI" subtitle="Refleksje w Ścieżce ujęte własnymi słowami" fallback="settings" />

      <Card className="space-y-4">
        <p className="text-[14px] leading-relaxed text-ink-2">
          Po każdej sesji Ścieżki zapisujesz jedno zdanie. Z kluczem OpenAI kolejna sesja nie odczyta go słowo w słowo, tylko nawiąże do niego własnymi słowami (krótka parafraza w drugiej osobie). Bez klucza sesja cytuje Twoje zdanie.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink-2">Klucz API OpenAI</span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className="h-12 w-full rounded-2xl bg-surface pl-4 pr-12 text-[16px] text-ink ring-1 ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="sk-…"
              value={o.apiKey}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              aria-label="Klucz API OpenAI"
              onChange={(e) => set((x) => void (x.apiKey = e.target.value.replace(/\s+/g, "")))}
            />
            <IconButton label={show ? "Ukryj klucz" : "Pokaż klucz"} className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2" onClick={() => setShow((v) => !v)}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconButton>
          </div>
        </label>
        <p className="text-[12px] leading-relaxed text-ink-3">
          Klucz utworzysz na{" "}
          <a className="text-sage-deep underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
            platform.openai.com/api-keys
          </a>{" "}
          (konto musi mieć doładowane środki w Billing). Najlepiej osobny klucz z limitem wydatków.
        </p>

        <div>
          <TextField label="Model" value={o.model} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => set((x) => void (x.model = e.target.value.trim()))} />
          <div className="mt-2 flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <Chip key={m} active={o.model === m} onClick={() => set((x) => void (x.model = m))}>
                {m}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-ink-3">Do krótkich parafraz w zupełności wystarczy mały model — kosztuje ułamek centa za refleksję.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={!o.apiKey || !o.model || busy} onClick={() => void check()}>
            {busy ? "Sprawdzam…" : "Sprawdź klucz"}
          </Button>
          {o.apiKey && (
            <Button variant="danger" onClick={() => (set((x) => void (x.apiKey = "")), setTest(null))}>
              Usuń klucz
            </Button>
          )}
        </div>
        {test && (
          <Notice tone={test.ok ? "neutral" : "warn"}>
            {test.ok ? (
              <>
                Działa. Przykładowa parafraza: <span className="text-ink">{test.text}</span>
              </>
            ) : (
              test.text
            )}
          </Notice>
        )}
      </Card>

      <SectionTitle>Prywatność</SectionTitle>
      <p className="px-1 text-[13px] leading-relaxed text-ink-3">
        Klucz jest zapisany tylko na tym urządzeniu i nie trafia do eksportu danych. Przy parafrazie klucz i treść refleksji przechodzą przez serwer aplikacji do OpenAI (bez zapisywania na serwerze; zapytanie ma wyłączone przechowywanie po stronie OpenAI). Refleksje oznaczone „tylko dla siebie” nigdzie nie są wysyłane.
      </p>
    </Screen>
  );
}
