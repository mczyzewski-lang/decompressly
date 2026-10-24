"use client";

import { forwardRef, useState } from "react";
import { ArrowRight, Lock, PenLine } from "lucide-react";
import { newId } from "@/lib/db";
import { logActivity, update, useApp } from "@/lib/store";
import { navigate } from "@/lib/router";
import { pathSessionId, type PathDef, type PathStep } from "@/lib/paths";
import { openaiConfigured, paraphraseReflection } from "@/lib/eleven-client";
import { getState } from "@/lib/store";
import type { PathRun } from "@/lib/types";
import { Button, Card, TextArea, Toggle } from "./ui";

export function newPathRun(pathId: string): PathRun {
  return { id: newId("path"), pathId, startedAt: Date.now(), notes: {} };
}

/** Writes (or clears) the reflection of one step; creates the run on the first reflection. */
export function saveNote(path: PathDef, n: number, note: { text: string; private?: boolean } | null) {
  update((s) => {
    const runs = (s.paths ??= {});
    const run = (runs[path.id] ??= newPathRun(path.id));
    if (note) {
      const prev = run.notes[n];
      const text = note.text.trim();
      // a paraphrase stays with its reflection as long as the words are the same
      const keep = prev && prev.paraphraseOf === text ? { paraphrase: prev.paraphrase, paraphraseOf: prev.paraphraseOf } : {};
      run.notes[n] = { text, private: note.private || undefined, at: Date.now(), ...keep };
    } else delete run.notes[n];
    const done = path.steps.every((x) => run.notes[x.n]);
    run.finishedAt = done ? (run.finishedAt ?? Date.now()) : undefined;
  });
}

const inflight = new Set<string>();

/**
 * Asks OpenAI (with the key from Settings) to retell a reflection in the second person, so the next session speaks
 * about it in its own words instead of quoting it. Quietly does nothing when that is not possible —
 * the session then falls back to quoting.
 */
export async function ensureParaphrase(path: PathDef, n: number): Promise<"ok" | "skipped" | string> {
  const note = getState().paths?.[path.id]?.notes[n];
  if (!note || !note.text.trim() || note.private || !openaiConfigured()) return "skipped";
  if (note.paraphrase && note.paraphraseOf === note.text) return "ok";
  const key = `${path.id}:${n}:${note.text}`;
  if (inflight.has(key)) return "skipped";
  inflight.add(key);
  try {
    const step = path.steps.find((s) => s.n === n);
    const paraphrase = await paraphraseReflection(note.text, step?.question ?? "");
    update((s) => {
      const cur = s.paths?.[path.id]?.notes[n];
      if (cur && cur.text === note.text) Object.assign(cur, { paraphrase, paraphraseOf: note.text });
    });
    return "ok";
  } catch (e) {
    return e instanceof Error ? e.message : "Nie udało się przeredagować.";
  } finally {
    inflight.delete(key);
  }
}

/** Your own wording of what the next session should say (replaces the generated paraphrase). */
export function setParaphrase(path: PathDef, n: number, paraphrase: string) {
  update((s) => {
    const cur = s.paths?.[path.id]?.notes[n];
    if (cur) Object.assign(cur, { paraphrase: paraphrase.trim(), paraphraseOf: cur.text });
  });
}

/** One sentence after the session — the next session of the path picks it up. */
export const PathReflection = forwardRef<HTMLDivElement, { path: PathDef; step: PathStep }>(function PathReflection({ path, step }, ref) {
  const note = useApp((s) => s.paths?.[path.id]?.notes[step.n]);
  const [editing, setEditing] = useState(!note);
  const [text, setText] = useState(note?.text ?? "");
  const [priv, setPriv] = useState(note?.private ?? false);
  const next = path.steps.find((x) => x.n === step.n + 1);

  const save = (skip: boolean) => {
    saveNote(path, step.n, { text: skip ? "" : text, private: !skip && priv });
    if (!note) logActivity("reflection", `${path.title} · etap ${step.n}`);
    setEditing(false);
    if (!skip && !priv && next) void ensureParaphrase(path, step.n);
  };

  return (
    <div ref={ref} className="mt-4 scroll-mt-24">
    <Card className="bg-sage-soft/50 ring-sage/30">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">Refleksja po sesji</p>
      <p className="mt-2 font-display text-[21px] leading-snug text-ink">{step.question}</p>
      {editing ? (
        <>
          <TextArea
            className="mt-3"
            rows={3}
            maxLength={300}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={step.placeholder}
            aria-label="Twoja refleksja"
          />
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
            Możesz też podyktować — mikrofon na klawiaturze iPhone&apos;a.
            {next && " Kolejna sesja nie odczyta tego słowo w słowo: zdanie przeredaguje OpenAI (Twoim kluczem z Ustawień), a sesja nawiąże do niego własnymi słowami. Z opcją „tylko dla siebie” tekst nigdzie nie trafia."}
          </p>
          {next && (
            <Toggle
              checked={priv}
              onChange={setPriv}
              label="Zachowaj tylko dla siebie"
              description="Kolejna sesja nie przytoczy tego zdania — zostanie tylko tutaj."
            />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="primary" disabled={!text.trim()} onClick={() => save(false)}>
              <PenLine className="h-4 w-4" /> Zapisz refleksję
            </Button>
            {!note && (
              <Button variant="ghost" onClick={() => save(true)}>
                Dziś bez słów
              </Button>
            )}
            {note && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Anuluj
              </Button>
            )}
          </div>
        </>
      ) : (
        note && (
          <>
            {note.text ? (
              <p className="mt-3 flex gap-2 text-[16px] leading-relaxed text-ink">
                {note.private && <Lock className="mt-1 h-4 w-4 shrink-0 text-ink-3" aria-label="Tylko dla Ciebie" />}„{note.text}”
              </p>
            ) : (
              <p className="mt-3 text-[15px] text-ink-2">Tym razem bez słów. To też jest w porządku.</p>
            )}
            <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
              {!next
                ? "To było ostatnie zdanie tej drogi."
                : note.text && !note.private
                  ? `Etap ${next.n} „${next.title}” nawiąże do tego własnymi słowami i będzie z tym pracował.`
                  : `Etap ${next.n} „${next.title}” nawiąże do drogi bez cytowania.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {next ? (
                <Button variant="primary" onClick={() => navigate(`audio/${pathSessionId(path.id, next.n)}`)}>
                  Etap {next.n}: {next.title} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="primary" onClick={() => navigate(`paths/${path.id}`)}>
                  Zobacz całą drogę <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setText(note.text);
                  setPriv(!!note.private);
                  setEditing(true);
                }}
              >
                Zmień
              </Button>
            </div>
            {next && <p className="mt-3 text-[12px] text-ink-3">Nie musisz iść dalej od razu. Kolejny etap poczeka — dzień, dwa albo tydzień.</p>}
          </>
        )
      )}
    </Card>
    </div>
  );
});
