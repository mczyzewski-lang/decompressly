"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { update, useApp } from "@/lib/store";
import { formatRange, formatShort, toISODate } from "@/lib/dates";
import { goalPhase } from "@/lib/goal";
import { DEFAULT_GOAL } from "@/lib/defaults";
import { navigate } from "@/lib/router";
import type { Goal } from "@/lib/types";
import { Button, Card, Screen, ScreenHeader, SectionTitle, TextArea, TextField, cn } from "../ui";

export default function GoalScreen() {
  const goal = useApp((s) => s.goal);
  const reflections = useApp((s) => s.reflections);
  const [editing, setEditing] = useState(false);
  const today = toISODate();
  const phase = goalPhase(goal, today);
  const currentId = phase.kind === "stage" ? phase.stage.id : null;

  if (editing) return <GoalEditor goal={goal} onDone={() => setEditing(false)} />;

  return (
    <Screen tabbed>
      <ScreenHeader
        right={
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edytuj
          </Button>
        }
      />
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">Cel osobisty</p>
      <h1 className="mt-2 font-display text-[30px] leading-tight tracking-tight text-ink">{goal.title}</h1>
      <p className="mt-1 text-[14px] text-ink-3">{formatRange(goal.start, goal.end)}</p>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{goal.description}</p>

      <div className="mt-8 space-y-3">
        {goal.stages.map((s) => {
          const current = s.id === currentId;
          return (
            <Card key={s.id} className={cn(current ? "ring-2 ring-sage" : "opacity-90")}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3">{s.subtitle}</p>
                <p className="text-[13px] text-ink-3">{formatRange(s.start, s.end)}</p>
              </div>
              <p className="mt-1 font-display text-[22px] text-ink">{s.name}</p>
              {current && <p className="mt-2 text-[15px] leading-relaxed text-sage-deep">{s.reminder}</p>}
              <ul className="mt-3 space-y-1.5">
                {s.intentions.map((i, k) => (
                  <li key={k} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                    <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                    {i}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 px-1 text-[13px] text-ink-3">To dobrowolny eksperyment, nie surowy zakaz. Nie ma tu procentów ani wyników.</p>

      <SectionTitle
        action={
          <button className="text-[14px] text-sage-deep" onClick={() => navigate("reflection")}>
            Nowa refleksja
          </button>
        }
      >
        Refleksje
      </SectionTitle>
      {reflections.length === 0 ? (
        <p className="px-1 text-[15px] text-ink-3">Raz w tygodniu Decompressly zaproponuje trzy krótkie pytania. Zawsze możesz je pominąć.</p>
      ) : (
        <div className="space-y-3">
          {[...reflections].reverse().map((r) => (
            <Card key={r.id}>
              <p className="text-[13px] text-ink-3">{formatShort(r.date)}</p>
              {r.calm && <QA q="Kiedy czułem autentyczny spokój?" a={r.calm} />}
              {r.pulled && <QA q="Kiedy ekscytacja pociągnęła mnie do działania?" a={r.pulled} />}
              {r.choose && <QA q="Co chciałbym częściej wybierać?" a={r.choose} />}
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="mt-3">
      <p className="text-[13px] text-ink-3">{q}</p>
      <p className="mt-0.5 text-[15px] leading-relaxed text-ink">{a}</p>
    </div>
  );
}

function GoalEditor({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const [g, setG] = useState<Goal>(() => structuredClone(goal));
  const setStage = (i: number, patch: Partial<Goal["stages"][number]>) => setG((x) => ({ ...x, stages: x.stages.map((s, k) => (k === i ? { ...s, ...patch } : s)) }));
  return (
    <Screen tabbed>
      <ScreenHeader title="Edytuj cel" onBack={onDone} />
      <div className="space-y-3">
        <TextField label="Nazwa" value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} />
        <TextArea label="Opis" rows={3} value={g.description} onChange={(e) => setG({ ...g, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField type="date" label="Start" value={g.start} onChange={(e) => setG({ ...g, start: e.target.value })} />
          <TextField type="date" label="Koniec" value={g.end} onChange={(e) => setG({ ...g, end: e.target.value })} />
        </div>
      </div>
      {g.stages.map((s, i) => (
        <div key={s.id}>
          <SectionTitle>{s.subtitle}</SectionTitle>
          <div className="space-y-3">
            <TextField label="Nazwa etapu" value={s.name} onChange={(e) => setStage(i, { name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField type="date" label="Od" value={s.start} onChange={(e) => setStage(i, { start: e.target.value })} />
              <TextField type="date" label="Do" value={s.end} onChange={(e) => setStage(i, { end: e.target.value })} />
            </div>
            <TextArea label="Przypomnienie sensu" rows={2} value={s.reminder} onChange={(e) => setStage(i, { reminder: e.target.value })} />
            <TextArea
              label="Intencje (jedna w linii)"
              rows={5}
              value={s.intentions.join("\n")}
              onChange={(e) => setStage(i, { intentions: e.target.value.split("\n") })}
            />
          </div>
        </div>
      ))}
      <div className="mt-8 flex gap-3">
        <Button variant="ghost" onClick={() => setG(structuredClone(DEFAULT_GOAL))}>
          Przywróć domyślne
        </Button>
        <Button
          variant="primary"
          block
          onClick={() => {
            update((st) => {
              st.goal = { ...g, stages: g.stages.map((s) => ({ ...s, intentions: s.intentions.map((x) => x.trim()).filter(Boolean) })) };
            });
            onDone();
          }}
        >
          Zapisz
        </Button>
      </div>
    </Screen>
  );
}
