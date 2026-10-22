"use client";

import { useState } from "react";
import { BookOpen, Check, ChevronRight, Headphones, Lock, PenLine, Repeat } from "lucide-react";
import { PATH_BY_ID, PATHS, currentStep, pathSessionId, stepOpen } from "@/lib/paths";
import { newId } from "@/lib/db";
import { update, useApp } from "@/lib/store";
import { navigate } from "@/lib/router";
import { askConfirm, toast } from "@/lib/ui-store";
import { formatShort, toISODate } from "@/lib/dates";
import type { PathRun } from "@/lib/types";
import { Button, Card, Screen, ScreenHeader, SectionTitle, cn } from "../ui";
import { saveNote } from "../PathReflection";

const NO_RUNS: PathRun[] = [];

export default function PathScreen({ id }: { id?: string }) {
  const path = PATH_BY_ID[id ?? ""] ?? PATHS[0];
  const run = useApp((s) => s.paths?.[path.id]);
  const archive = (useApp((s) => s.pathArchive) ?? NO_RUNS).filter((r) => r.pathId === path.id);
  const current = currentStep(path, run);
  const finished = !!run && current === null;

  const restart = async () => {
    if (run && !(await askConfirm("Zacząć drogę od nowa?", "Obecne refleksje przejdą do „Poprzednich przejść” — nic nie zniknie. Nagrania pierwszego etapu zostaną użyte ponownie.", "Zacznij od nowa"))) return;
    update((s) => {
      const r = s.paths?.[path.id];
      if (r) {
        s.pathArchive = [{ ...r, finishedAt: r.finishedAt ?? Date.now() }, ...(s.pathArchive ?? [])];
        delete s.paths![path.id];
      }
    });
    navigate(`audio/${pathSessionId(path.id, 1)}`);
  };

  return (
    <Screen tabbed>
      <ScreenHeader fallback="audio" />
      <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{path.title}</h1>
      <p className="mt-1 text-[15px] text-ink-2">{path.subtitle}</p>
      <p className="mt-4 px-1 text-[15px] leading-relaxed text-ink-2">{path.description}</p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { Icon: Headphones, label: "Słuchasz sesji" },
          { Icon: PenLine, label: "Zapisujesz jedno zdanie" },
          { Icon: Repeat, label: "Kolejna sesja je przytacza" },
        ].map(({ Icon, label }) => (
          <div key={label} className="rounded-2xl bg-surface-2 px-2 py-3">
            <Icon className="mx-auto h-5 w-5 text-sage-deep" strokeWidth={1.7} />
            <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{label}</p>
          </div>
        ))}
      </div>

      {finished && run && <Closure first={firstText(run)} last={lastText(run)} />}

      <SectionTitle>Etapy</SectionTitle>
      <ol className="relative">
        {path.steps.map((step, i) => {
          const note = run?.notes[step.n];
          const open = stepOpen(run, step.n);
          const isNow = step.n === current;
          return (
            <li key={step.n} className="relative flex gap-4 pb-5">
              {i < path.steps.length - 1 && <span aria-hidden className="absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-px bg-line" />}
              <span
                className={cn(
                  "tabular z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px]",
                  note ? "bg-sage-deep text-bg" : isNow ? "bg-sage-soft text-sage-deep ring-2 ring-sage" : "bg-surface-2 text-ink-3",
                )}
              >
                {note ? <Check className="h-4 w-4" /> : step.n}
              </span>
              <div className={cn("min-w-0 flex-1", !open && "opacity-55")}>
                <button
                  disabled={!open}
                  onClick={() => navigate(`audio/${pathSessionId(path.id, step.n)}`)}
                  className="flex w-full items-start gap-2 text-left disabled:cursor-default"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] leading-snug text-ink">{step.title}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-3">
                      ok. {step.minutes} min · {step.theme}
                    </span>
                  </span>
                  {open && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />}
                </button>
                {note && <NoteLine pathId={path.id} n={step.n} text={note.text} priv={!!note.private} />}
                {isNow && (
                  <Button className="mt-3" size="sm" variant="primary" onClick={() => navigate(`audio/${pathSessionId(path.id, step.n)}`)}>
                    <Headphones className="h-4 w-4" /> {step.n === 1 && !run ? "Zacznij drogę" : "Słuchaj teraz"}
                  </Button>
                )}
                {!open && <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-3"><Lock className="h-3 w-3" /> Otworzy się po refleksji z etapu {step.n - 1}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {run && (
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => void restart()}>
            Zacznij od nowa
          </Button>
        </div>
      )}

      {archive.length > 0 && (
        <>
          <SectionTitle>Poprzednie przejścia</SectionTitle>
          <div className="space-y-2">
            {archive.map((r) => (
              <details key={r.id} className="rounded-2xl bg-surface px-4 py-3 ring-1 ring-line/60">
                <summary className="cursor-pointer text-[14px] text-ink">
                  {formatShort(toISODate(new Date(r.startedAt)))}
                  {r.finishedAt ? ` – ${formatShort(toISODate(new Date(r.finishedAt)))}` : ""}
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {path.steps.map((st) =>
                    r.notes[st.n]?.text ? (
                      <li key={st.n} className="text-[13px] leading-relaxed text-ink-2">
                        <span className="text-ink-3">{st.n}.</span> „{r.notes[st.n].text}”
                      </li>
                    ) : null,
                  )}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}

      <p className="mt-10 px-2 text-center text-[12px] leading-relaxed text-ink-3">
        To praktyka relaksacji i refleksji, nie terapia — niczego tu nie oceniamy ani nie diagnozujemy. Możesz przerwać w dowolnym momencie. Jeśli pojawia się coś bardzo
        trudnego, porozmawiaj z kimś bliskim albo ze specjalistą. W kryzysie: 116 123 (telefon zaufania dla dorosłych) lub 112.
      </p>
    </Screen>
  );
}

function firstText(run: PathRun): string | null {
  const keys = Object.keys(run.notes).map(Number).sort((a, b) => a - b);
  for (const k of keys) if (run.notes[k].text) return run.notes[k].text;
  return null;
}
function lastText(run: PathRun): string | null {
  const keys = Object.keys(run.notes).map(Number).sort((a, b) => b - a);
  for (const k of keys) if (run.notes[k].text) return run.notes[k].text;
  return null;
}

function Closure({ first, last }: { first: string | null; last: string | null }) {
  const [saved, setSaved] = useState(false);
  return (
    <Card className="mt-6 bg-sand/40 shadow-none ring-0">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-clay">Droga domknięta</p>
      {first && first !== last && (
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          Na początku: <span className="text-ink">„{first}”</span>
        </p>
      )}
      {last && (
        <p className="mt-2 font-display text-[20px] leading-snug text-ink">„{last}”</p>
      )}
      {last && !saved && (
        <Button
          className="mt-4"
          size="sm"
          variant="secondary"
          onClick={() => {
            update((s) => void s.customThoughts.push({ id: newId("th"), category: "identity", text: last, custom: true }));
            setSaved(true);
            toast("Dodano do Moich myśli.");
          }}
        >
          <BookOpen className="h-4 w-4" /> Dodaj do Moich myśli
        </Button>
      )}
    </Card>
  );
}

function NoteLine({ pathId, n, text, priv }: { pathId: string; n: number; text: string; priv: boolean }) {
  const path = PATH_BY_ID[pathId];
  if (!text) return <p className="mt-1.5 text-[13px] italic text-ink-3">bez słów</p>;
  return (
    <div className="mt-1.5">
      <p className="text-[14px] leading-relaxed text-ink-2">
        {priv && <Lock className="mr-1 inline h-3 w-3 text-ink-3" aria-label="Tylko dla Ciebie" />}„{text}”
      </p>
      <button className="mt-0.5 text-[12px] text-sage-deep" onClick={() => saveNote(path, n, { text, private: !priv })}>
        {priv ? "Pozwól przytoczyć w kolejnej sesji" : "Zachowaj tylko dla siebie"}
      </button>
    </div>
  );
}
