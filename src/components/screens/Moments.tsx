"use client";

import { useMemo, useState } from "react";
import { Shuffle, Volume2, Trash2 } from "lucide-react";
import { update, useApp, getNameForms } from "@/lib/store";
import { newId } from "@/lib/db";
import { formatShort, hashString, toISODate } from "@/lib/dates";
import { MOMENT_PROMPTS, MOMENT_TAGS, TAG_BY_ID, pebbleLayout } from "@/lib/moments";
import { say, stopVoice } from "@/lib/audio/voice";
import { unlockAudio } from "@/lib/audio/engine";
import type { GoodMoment, MomentTag } from "@/lib/types";
import { Button, Chip, IconButton, Screen, ScreenHeader, Sheet, TextArea } from "../ui";

const NO_MOMENTS: GoodMoment[] = [];
const MAX_VISIBLE = 66; // the jar shows the most recent pebbles; older ones stay in the jar's memory

export default function Moments() {
  const moments = useApp((s) => s.moments) ?? NO_MOMENTS;
  const [text, setText] = useState("");
  const [tag, setTag] = useState<MomentTag>("rodzina");
  const [open, setOpen] = useState<GoodMoment | null>(null);
  const today = toISODate();
  const prompt = MOMENT_PROMPTS[hashString(today) % MOMENT_PROMPTS.length];
  const visible = moments.slice(-MAX_VISIBLE);
  const layout = useMemo(() => pebbleLayout(visible.length), [visible.length]);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    update((s) => void (s.moments = [...(s.moments ?? []), { id: newId("gm"), text: t, tag, date: today, at: Date.now() }]));
    setText("");
  };

  const random = () => {
    if (!moments.length) return;
    // favour older moments a little — the point is to rediscover them
    const i = Math.floor(Math.pow(Math.random(), 1.6) * moments.length);
    setOpen(moments[i]);
  };

  return (
    <Screen tabbed>
      <ScreenHeader title="Słoik dobrych chwil" subtitle="Małe, dobre momenty — zapisane jednym zdaniem, żeby można było do nich wrócić." fallback="health" />

      <div className="mt-2 flex justify-center">
        <svg viewBox="0 0 200 240" className="h-[300px] w-[250px]" role="img" aria-label="Słoik z kamykami dobrych chwil">
          <rect x="62" y="6" width="76" height="16" rx="6" fill="rgb(var(--sand))" />
          <path d="M70 22 h60 v10 c22 6 36 22 36 48 v124 c0 18 -14 30 -32 30 h-68 c-18 0 -32 -12 -32 -30 v-124 c0 -26 14 -42 36 -48 z" fill="rgb(var(--surface))" stroke="rgb(var(--line))" strokeWidth="2.5" />
          <g>
            {visible.map((m, i) => {
              const p = layout[i];
              return (
                <circle
                  key={m.id}
                  cx={34 + p.x * 132}
                  cy={30 + p.y * 200}
                  r={p.r * 132}
                  fill={TAG_BY_ID[m.tag]?.color ?? "#999"}
                  opacity={0.9}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onClick={() => setOpen(m)}
                >
                  <title>{m.text}</title>
                </circle>
              );
            })}
          </g>
          <path d="M44 70 c-4 30 -4 90 0 130" stroke="white" strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {moments.length === 0 ? (
        <p className="text-center text-[14px] text-ink-3">Słoik jest jeszcze pusty. Pierwsza dobra chwila może być bardzo zwyczajna.</p>
      ) : (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={random}>
            <Shuffle className="h-4 w-4" /> Wylosuj chwilę
          </Button>
        </div>
      )}

      <div className="mt-8 rounded-3xl bg-surface p-5 shadow-soft ring-1 ring-line/60">
        <p className="font-display text-[19px] leading-snug text-ink">{prompt}</p>
        <TextArea className="mt-3" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Jedno zdanie, np. Leon śmiał się przy śniadaniu." aria-label="Dobra chwila" maxLength={220} />
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {MOMENT_TAGS.map((t) => (
            <Chip key={t.id} active={tag === t.id} onClick={() => setTag(t.id)}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} aria-hidden /> {t.label}
            </Chip>
          ))}
        </div>
        <Button className="mt-4" variant="primary" block onClick={add} disabled={!text.trim()}>
          Wrzuć do słoika
        </Button>
      </div>

      <p className="mt-6 px-1 text-[12px] leading-relaxed text-ink-3">
        Zauważanie i zatrzymywanie się przy drobnych przyjemnościach (tzw. savoring) to prosta praktyka, która pomaga częściej dostrzegać to, co już jest dobre. Bez liczników i bez obowiązku — wrzucasz, kiedy masz ochotę.
      </p>

      {open && <MomentSheet moment={open} onClose={() => setOpen(null)} />}
    </Screen>
  );
}

function MomentSheet({ moment, onClose }: { moment: GoodMoment; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const tag = TAG_BY_ID[moment.tag];
  const listen = async () => {
    if (playing) {
      stopVoice();
      setPlaying(false);
      return;
    }
    await unlockAudio();
    setPlaying(true);
    await say(`${getNameForms().voc}, pamiętasz? ${moment.text}`);
    setPlaying(false);
  };
  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) {
          stopVoice();
          onClose();
        }
      }}
      title={formatShort(moment.date)}
    >
      <p className="flex items-center gap-2 text-[12px] text-ink-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tag?.color }} aria-hidden /> {tag?.label}
      </p>
      <p className="mt-3 font-display text-[24px] leading-snug text-ink">{moment.text}</p>
      <div className="mt-6 flex gap-2">
        <Button variant="primary" onClick={listen}>
          <Volume2 className="h-4 w-4" /> {playing ? "Zatrzymaj" : "Posłuchaj"}
        </Button>
        <IconButton
          label="Wyjmij ze słoika"
          className="ml-auto"
          onClick={() => {
            update((s) => void (s.moments = (s.moments ?? []).filter((x) => x.id !== moment.id)));
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </Sheet>
  );
}
