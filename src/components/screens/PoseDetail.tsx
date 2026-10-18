"use client";

import { POSE_BY_ID } from "@/lib/yoga/poses";
import { formatClock } from "@/lib/dates";
import { Card, Screen, ScreenHeader, SectionTitle } from "../ui";
import { PoseImage } from "../PoseImage";

export default function PoseDetail({ id }: { id: string }) {
  const p = POSE_BY_ID[id];
  if (!p) {
    return (
      <Screen tabbed>
        <ScreenHeader title="Nie znaleziono pozycji" fallback="yoga" />
      </Screen>
    );
  }
  return (
    <Screen tabbed>
      <ScreenHeader fallback="yoga" />
      <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{p.name}</h1>
      <p className="mt-1 text-[15px] text-ink-2">
        {p.english}
        {p.sanskrit ? ` · ${p.sanskrit}` : ""}
      </p>
      <PoseImage pose={p} className="mt-5" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-3">Czas utrzymania</p>
          <p className="tabular mt-1 text-[17px] text-ink">
            {formatClock(p.holdRange[0])}–{formatClock(p.holdRange[1])}
            {p.bilateral ? " łącznie" : ""}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-3">Strony</p>
          <p className="mt-1 text-[17px] text-ink">{p.bilateral ? "Obie strony" : "Jedna pozycja"}</p>
        </Card>
      </div>

      <SectionTitle>Pozycja początkowa</SectionTitle>
      <p className="px-1 text-[16px] leading-relaxed text-ink">{p.start}</p>

      <SectionTitle>Krok po kroku</SectionTitle>
      <ol className="space-y-3 px-1">
        {p.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink">
            <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[13px] text-sage-deep">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <SectionTitle>Wyjście z pozycji</SectionTitle>
      <p className="px-1 text-[16px] leading-relaxed text-ink">{p.exit}</p>

      <SectionTitle>Typowe błędy</SectionTitle>
      <ul className="space-y-2 px-1">
        {p.mistakes.map((m, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
            <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
            {m}
          </li>
        ))}
      </ul>

      <SectionTitle>Dla początkujących</SectionTitle>
      <p className="px-1 text-[15px] leading-relaxed text-ink-2">{p.beginner}</p>
      {p.props.length > 0 && <p className="mt-2 px-1 text-[14px] text-ink-3">Pomoce: {p.props.join(", ")}.</p>}

      <SectionTitle>Kiedy pominąć</SectionTitle>
      <Card className="bg-sand/40 shadow-none ring-0">
        <p className="text-[15px] leading-relaxed text-ink">{p.skipWhen}</p>
      </Card>
    </Screen>
  );
}
