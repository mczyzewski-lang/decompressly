"use client";

import { useRef, useState } from "react";
import { Star, Play, ChevronRight, ChevronLeft } from "lucide-react";
import { YOGA_SESSIONS, sessionTotal, type YogaSession } from "@/lib/yoga/sessions";
import { POSES, POSE_BY_ID, POSE_GROUPS, type PoseGroup } from "@/lib/yoga/poses";
import { update, useApp } from "@/lib/store";
import { navigate } from "@/lib/router";
import { formatClock } from "@/lib/dates";
import { Button, Chip, IconButton, Screen, SectionTitle, Segmented, Sheet, Toggle, cn } from "../ui";
import { PoseImage } from "../PoseImage";

export default function Yoga() {
  const fav = useApp((s) => s.yoga.favoriteSessionId);
  const yoga = useApp((s) => s.yoga);
  const [len, setLen] = useState<"s10" | "s20" | "s30">(() => (["s10", "s20", "s30"].includes(fav) ? (fav as "s10") : "s10"));
  const [detail, setDetail] = useState<YogaSession | null>(null);
  const [group, setGroup] = useState<PoseGroup | "all">("all");
  const shown = group === "all" ? POSES : POSES.filter((p) => p.group === group);
  const main = YOGA_SESSIONS.find((s) => s.id === len)!;
  const categories = YOGA_SESSIONS.filter((s) => s.category !== "length");

  return (
    <Screen tabbed>
      <header className="safe-top pt-6">
        <h1 className="font-display text-[34px] leading-tight tracking-tight text-ink">Joga</h1>
        <p className="mt-2 text-[15px] text-ink-2">Łagodny ruch i odpoczynek. Bez wysiłku, bez spalania kalorii.</p>
      </header>

      <div className="mt-7">
        <Segmented
          label="Długość sesji"
          value={len}
          onChange={setLen}
          options={[
            { value: "s10", label: "10 minut" },
            { value: "s20", label: "20 minut" },
            { value: "s30", label: "30 minut" },
          ]}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-line/60">
        <PoseImage pose={POSE_BY_ID[main.steps[Math.min(2, main.steps.length - 1)].poseId]} className="rounded-none ring-0" zoomable={false} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[22px] text-ink">Sesja {main.title}</p>
              <p className="mt-1 text-[14px] text-ink-2">{main.subtitle}</p>
            </div>
            <FavButton id={main.id} active={fav === main.id} />
          </div>
          <p className="mt-3 text-[13px] text-ink-3">{main.steps.map((s) => POSE_BY_ID[s.poseId].name).join(" · ")}</p>
          <div className="mt-5 flex gap-3">
            <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate(`yoga/run/${main.id}`)}>
              <Play className="h-4 w-4" /> Rozpocznij
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setDetail(main)}>
              Plan
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-surface px-5 py-1 shadow-soft ring-1 ring-line/60">
        <Toggle
          label="Hands-free"
          description="Automatyczne przejście do następnej pozycji"
          checked={yoga.handsFree}
          onChange={(v) => update((s) => void (s.yoga.handsFree = v))}
        />
        <div className="h-px bg-line/70" />
        <Toggle
          label="Głos"
          description="Krótka instrukcja przed każdą pozycją"
          checked={yoga.voice}
          onChange={(v) => update((s) => void (s.yoga.voice = v))}
        />
      </div>

      <SectionTitle>Na konkretny moment</SectionTitle>
      <div className="space-y-3">
        {categories.map((s) => (
          <button key={s.id} onClick={() => setDetail(s)} className="flex w-full items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-soft ring-1 ring-line/60 active:scale-[0.99]">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
              <PoseImage pose={POSE_BY_ID[s.steps[Math.floor(s.steps.length / 2)].poseId]} className="h-full rounded-none ring-0 [&>div]:p-1" zoomable={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] text-ink">{s.title}</p>
              <p className="text-[13px] text-ink-3">{s.subtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-3" />
          </button>
        ))}
      </div>

      <SectionTitle>Biblioteka pozycji · {POSES.length}</SectionTitle>
      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>
          Wszystkie
        </Chip>
        {POSE_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {shown.map((p) => (
          <button key={p.id} onClick={() => navigate(`yoga/pose/${p.id}`)} className="overflow-hidden rounded-3xl bg-surface text-left shadow-soft ring-1 ring-line/60 active:scale-[0.99]">
            <PoseImage pose={p} className="rounded-none ring-0" zoomable={false} />
            <div className="px-3.5 pb-3.5 pt-1">
              <p className="text-[15px] leading-snug text-ink">{p.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-3">
                {p.english}
                {p.level === 2 && <span className="ml-1 text-clay">· średnio zaaw.</span>}
              </p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 px-2 text-center text-[12px] leading-relaxed text-ink-3">
        Ćwicz w komfortowym zakresie. Przy bólu, urazie lub w ciąży skonsultuj praktykę z lekarzem lub fizjoterapeutą.
      </p>

      {detail && <SessionSheet session={detail} onClose={() => setDetail(null)} fav={fav === detail.id} />}
    </Screen>
  );
}

function FavButton({ id, active }: { id: string; active: boolean }) {
  return (
    <IconButton label={active ? "Ulubiona sesja" : "Ustaw jako ulubioną"} onClick={() => update((s) => void (s.yoga.favoriteSessionId = id))}>
      <Star className={cn("h-5 w-5", active ? "fill-clay text-clay" : "text-ink-3")} />
    </IconButton>
  );
}

/** Swipe left/right through the poses of a plan, one photo at a time. */
function PlanSlider({ session, index, onIndex, scroller }: { session: YogaSession; index: number; onIndex: (i: number) => void; scroller: React.RefObject<HTMLDivElement | null> }) {
  const n = session.steps.length;
  const go = (k: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: Math.max(0, Math.min(n - 1, k)) * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="relative -mx-5">
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        onScroll={(e) => {
          const el = e.currentTarget;
          const k = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (k !== index) onIndex(k);
        }}
        aria-label="Pozycje w planie — przesuń w lewo lub w prawo"
        role="region"
      >
        {session.steps.map((st, i) => {
          const p = POSE_BY_ID[st.poseId];
          return (
            <div key={i} className="w-full shrink-0 snap-center px-5" aria-roledescription="slajd" aria-label={`${i + 1} z ${n}: ${p.name}`}>
              <div className="relative">
                <PoseImage pose={p} zoomable={false} />
                {i > 0 && (
                  <IconButton label="Poprzednia pozycja" onClick={() => go(i - 1)} className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 bg-black/40 text-white backdrop-blur hover:bg-black/55">
                    <ChevronLeft className="h-5 w-5" />
                  </IconButton>
                )}
                {i < n - 1 && (
                  <IconButton label="Następna pozycja" onClick={() => go(i + 1)} className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 bg-black/40 text-white backdrop-blur hover:bg-black/55">
                    <ChevronRight className="h-5 w-5" />
                  </IconButton>
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-ink-3">
                    {i + 1} / {n}
                  </p>
                  <p className="mt-0.5 text-[18px] leading-snug text-ink">{p.name}</p>
                  <p className="mt-0.5 text-[13px] text-ink-3">
                    {formatClock(st.seconds)}
                    {st.sides === 2 ? ` · ${formatClock(st.seconds / 2)} na stronę` : ""}
                  </p>
                </div>
                <Button size="sm" variant="quiet" onClick={() => navigate(`yoga/pose/${p.id}`)}>
                  Szczegóły
                </Button>
              </div>
              <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{p.cue}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionSheet({ session, onClose, fav }: { session: YogaSession; onClose: () => void; fav: boolean }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const show = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    el.closest("[role=dialog]")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={session.title} description={`${session.subtitle} · razem ${formatClock(sessionTotal(session))}`}>
      <PlanSlider session={session} index={index} onIndex={setIndex} scroller={scroller} />
      <ol className="mt-5 divide-y divide-line">
        {session.steps.map((st, i) => {
          const p = POSE_BY_ID[st.poseId];
          return (
            <li key={i} className={cn("flex items-center justify-between py-3", i === index && "-mx-2 rounded-xl bg-surface-2 px-2")}>
              <button className="text-left" onClick={() => show(i)} aria-current={i === index ? "step" : undefined}>
                <span className="text-[15px] text-ink">
                  <span className="tabular mr-2 text-ink-3">{i + 1}.</span>
                  {p.name}
                </span>
                {st.sides === 2 && <span className="ml-2 text-[12px] text-ink-3">{formatClock(st.seconds / 2)} / strona</span>}
              </button>
              <span className="tabular text-[15px] text-ink-3">{formatClock(st.seconds)}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12px] text-ink-3">Czas każdej pozycji obejmuje spokojne przejście do następnej. W pozycjach dwustronnych na zmianę strony przeznaczone jest kilka sekund w połowie.</p>
      <div className="mt-5 flex gap-3">
        <FavButton id={session.id} active={fav} />
        <Button variant="primary" size="lg" block onClick={() => (onClose(), navigate(`yoga/run/${session.id}`))}>
          <Play className="h-4 w-4" /> Rozpocznij
        </Button>
      </div>
    </Sheet>
  );
}
