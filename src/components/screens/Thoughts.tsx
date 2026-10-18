"use client";

import { useMemo, useState } from "react";
import { Heart, Plus, Star, Pencil, EyeOff, Eye, Trash2, ChevronDown } from "lucide-react";
import { THOUGHT_CATEGORIES, CATEGORY_LABEL, REFLECTION_QUESTIONS, allThoughts, thoughtText, THOUGHTS, type Thought, type ThoughtCategory, type ReflectionQuestion } from "@/lib/thoughts";
import { update, useApp } from "@/lib/store";
import { newId } from "@/lib/db";
import { formatShort, toISODate } from "@/lib/dates";
import { toast } from "@/lib/ui-store";
import { Button, Chip, IconButton, Screen, ScreenHeader, Segmented, Sheet, TextArea, cn } from "../ui";

type Filter = ThoughtCategory | "all" | "fav" | "star";

export default function Thoughts() {
  const [tab, setTab] = useState<"thoughts" | "questions">("thoughts");
  return (
    <Screen tabbed>
      <ScreenHeader
        title="Biblioteka myśli"
        subtitle={`${THOUGHTS.length} myśli · ${REFLECTION_QUESTIONS.length} pytań do refleksji · ${THOUGHT_CATEGORIES.length} kategorii`}
      />
      <p className="mt-1 px-1 text-[13px] leading-relaxed text-ink-3">
        Opracowane na podstawie rozmów z 18.10.2026 i wcześniejszych. To parafrazy i propozycje, nie dosłowne cytaty — każde zdanie możesz zmienić albo odłożyć.
      </p>
      <div className="mt-5">
        <Segmented
          label="Widok biblioteki"
          value={tab}
          onChange={setTab}
          options={[
            { value: "thoughts", label: "Myśli" },
            { value: "questions", label: "Pytania" },
          ]}
        />
      </div>
      {tab === "thoughts" ? <ThoughtList /> : <QuestionList />}
    </Screen>
  );
}

function ThoughtList() {
  const custom = useApp((s) => s.customThoughts);
  const favs = useApp((s) => s.thoughtFavorites);
  const hidden = useApp((s) => s.thoughtHidden);
  const edits = useApp((s) => s.thoughtEdits);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Thought | null>(null);
  const [adding, setAdding] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const list = useMemo(() => allThoughts({ custom }), [custom]);
  const hiddenSet = new Set(hidden);
  const visible = list.filter((t) => !hiddenSet.has(t.id));
  const shown = visible.filter((t) => (filter === "all" ? true : filter === "fav" ? favs.includes(t.id) : filter === "star" ? t.star : t.category === filter));
  const groups = THOUGHT_CATEGORIES.map((c) => ({ ...c, items: shown.filter((t) => t.category === c.id) })).filter((g) => g.items.length);
  const hiddenItems = list.filter((t) => hiddenSet.has(t.id));

  return (
    <>
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Wszystkie
        </Chip>
        <Chip active={filter === "star"} onClick={() => setFilter("star")}>
          <Star className="h-3.5 w-3.5" /> Kluczowe
        </Chip>
        <Chip active={filter === "fav"} onClick={() => setFilter("fav")}>
          <Heart className="h-3.5 w-3.5" /> Ulubione
        </Chip>
        {THOUGHT_CATEGORIES.map((c) => (
          <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      {groups.length === 0 && <p className="py-10 text-center text-[15px] text-ink-3">Nic tu jeszcze nie ma.</p>}
      {groups.map((g) => (
        <section key={g.id} className="mt-7">
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">{g.label}</h2>
          <ul className="space-y-2">
            {g.items.map((t) => (
              <li key={t.id}>
                <button onClick={() => setActive(t)} className="flex w-full items-start gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left shadow-soft ring-1 ring-line/60">
                  <span className="flex-1 text-[16px] leading-snug text-ink">{thoughtText(t, edits)}</span>
                  <span className="mt-0.5 flex shrink-0 gap-1.5 text-ink-3">
                    {t.star && <Star className="h-4 w-4 fill-sand text-clay" aria-label="kluczowa" />}
                    {favs.includes(t.id) && <Heart className="h-4 w-4 fill-clay text-clay" aria-label="ulubiona" />}
                    {edits[t.id] && <Pencil className="h-4 w-4" aria-label="edytowana" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button onClick={() => setAdding(true)} className="mt-6 flex items-center gap-2 px-1 py-2 text-[14px] text-sage-deep">
        <Plus className="h-4 w-4" /> Dodaj własną myśl
      </button>

      {hiddenItems.length > 0 && (
        <div className="mt-6">
          <button className="flex items-center gap-2 px-1 text-[13px] text-ink-3" onClick={() => setShowHidden((v) => !v)} aria-expanded={showHidden}>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showHidden && "rotate-180")} /> Odłożone („to nie moje”): {hiddenItems.length}
          </button>
          {showHidden && (
            <ul className="mt-2 space-y-1">
              {hiddenItems.map((t) => (
                <li key={t.id} className="flex items-center gap-2 px-1">
                  <span className="flex-1 text-[14px] text-ink-3">{thoughtText(t, edits)}</span>
                  <Button size="sm" variant="ghost" onClick={() => update((s) => void (s.thoughtHidden = s.thoughtHidden.filter((x) => x !== t.id)))}>
                    Przywróć
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-10 px-1 text-[12px] leading-relaxed text-ink-3">
        Pojedyncze myśli pojawiają się czasem w aplikacji — zawsze najwyżej jedna naraz, w pasującym momencie. Nie ma tu nic do odhaczenia.
      </p>

      {active && <ThoughtSheet thought={active} onClose={() => setActive(null)} />}
      {adding && <AddThought onClose={() => setAdding(false)} />}
    </>
  );
}

function ThoughtSheet({ thought, onClose }: { thought: Thought; onClose: () => void }) {
  const favs = useApp((s) => s.thoughtFavorites);
  const hidden = useApp((s) => s.thoughtHidden);
  const edits = useApp((s) => s.thoughtEdits);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(thoughtText(thought, edits));
  const fav = favs.includes(thought.id);
  const isHidden = hidden.includes(thought.id);

  const save = () => {
    const t = draft.trim();
    update((s) => {
      if (thought.custom) {
        const c = s.customThoughts.find((x) => x.id === thought.id);
        if (c && t) c.text = t;
      } else if (!t || t === thought.text) delete s.thoughtEdits[thought.id];
      else s.thoughtEdits[thought.id] = t;
    });
    setEditing(false);
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={CATEGORY_LABEL[thought.category]}>
      {editing ? (
        <>
          <TextArea aria-label="Treść myśli" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={save}>
              Zapisz
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Anuluj
            </Button>
            {!thought.custom && edits[thought.id] && (
              <Button
                variant="ghost"
                onClick={() => {
                  update((s) => void delete s.thoughtEdits[thought.id]);
                  setDraft(thought.text);
                  setEditing(false);
                }}
              >
                Przywróć oryginał
              </Button>
            )}
          </div>
        </>
      ) : (
        <p className="font-display text-[23px] leading-snug text-ink">{thoughtText(thought, edits)}</p>
      )}
      {!editing && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="quiet" onClick={() => update((s) => void (s.thoughtFavorites = fav ? s.thoughtFavorites.filter((x) => x !== thought.id) : [...s.thoughtFavorites, thought.id]))}>
            <Heart className={cn("h-4 w-4", fav && "fill-clay text-clay")} /> {fav ? "Ulubiona" : "Do ulubionych"}
          </Button>
          <Button variant="quiet" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edytuj
          </Button>
          <Button
            variant="quiet"
            className="col-span-2"
            onClick={() => {
              update((s) => void (s.thoughtHidden = isHidden ? s.thoughtHidden.filter((x) => x !== thought.id) : [...s.thoughtHidden, thought.id]));
              if (!isHidden) {
                toast("Odłożone. Nie pojawi się ponownie.");
                onClose();
              }
            }}
          >
            {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} {isHidden ? "Przywróć" : "To nie moje — nie pokazuj ponownie"}
          </Button>
          {thought.custom && (
            <Button
              variant="danger"
              className="col-span-2"
              onClick={() => {
                update((s) => {
                  s.customThoughts = s.customThoughts.filter((x) => x.id !== thought.id);
                  s.thoughtFavorites = s.thoughtFavorites.filter((x) => x !== thought.id);
                });
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" /> Usuń
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function AddThought({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState<ThoughtCategory>("identity");
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Własna myśl">
      <TextArea aria-label="Treść myśli" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Jedno spokojne zdanie" autoFocus />
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {THOUGHT_CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <Button
        className="mt-5"
        variant="primary"
        block
        disabled={!text.trim()}
        onClick={() => {
          update((s) => void s.customThoughts.push({ id: newId("th"), category: cat, text: text.trim(), custom: true }));
          onClose();
        }}
      >
        Dodaj
      </Button>
    </Sheet>
  );
}

function QuestionList() {
  const notes = useApp((s) => s.questionNotes);
  const [active, setActive] = useState<ReflectionQuestion | null>(null);
  const groups = THOUGHT_CATEGORIES.map((c) => ({ ...c, items: REFLECTION_QUESTIONS.filter((q) => q.category === c.id) })).filter((g) => g.items.length);
  return (
    <>
      <p className="mt-5 px-1 text-[14px] leading-relaxed text-ink-2">Pytania do zatrzymania się, kiedy masz ochotę. Odpowiedź jest opcjonalna i zostaje tylko na tym urządzeniu.</p>
      {groups.map((g) => (
        <section key={g.id} className="mt-6">
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">{g.label}</h2>
          <ul className="space-y-2">
            {g.items.map((q) => {
              const n = notes.filter((x) => x.questionId === q.id).length;
              return (
                <li key={q.id}>
                  <button onClick={() => setActive(q)} className="w-full rounded-2xl bg-surface px-4 py-3.5 text-left shadow-soft ring-1 ring-line/60">
                    <span className="block text-[16px] leading-snug text-ink">{q.text}</span>
                    {n > 0 && <span className="mt-1 block text-[12px] text-ink-3">Notatki: {n}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {active && <QuestionSheet question={active} onClose={() => setActive(null)} />}
    </>
  );
}

function QuestionSheet({ question, onClose }: { question: ReflectionQuestion; onClose: () => void }) {
  const allNotes = useApp((s) => s.questionNotes);
  const notes = allNotes.filter((n) => n.questionId === question.id);
  const [text, setText] = useState("");
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={CATEGORY_LABEL[question.category]}>
      <p className="font-display text-[21px] leading-snug text-ink">{question.text}</p>
      <div className="mt-5">
        <TextArea aria-label="Notatka (opcjonalnie)" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Jeśli masz ochotę, zapisz kilka słów" />
        <Button
          className="mt-3"
          variant="primary"
          disabled={!text.trim()}
          onClick={() => {
            update((s) => void s.questionNotes.push({ id: newId("qn"), questionId: question.id, date: toISODate(), createdAt: Date.now(), text: text.trim() }));
            setText("");
            toast("Zapisane.");
          }}
        >
          Zapisz notatkę
        </Button>
      </div>
      {notes.length > 0 && (
        <ul className="mt-6 space-y-3">
          {[...notes].reverse().map((n) => (
            <li key={n.id} className="flex gap-2 rounded-2xl bg-surface px-4 py-3 ring-1 ring-line/60">
              <div className="flex-1">
                <p className="text-[12px] text-ink-3">{formatShort(n.date)}</p>
                <p className="mt-0.5 text-[15px] leading-relaxed text-ink">{n.text}</p>
              </div>
              <IconButton label="Usuń notatkę" className="h-8 w-8" onClick={() => update((s) => void (s.questionNotes = s.questionNotes.filter((x) => x.id !== n.id)))}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
