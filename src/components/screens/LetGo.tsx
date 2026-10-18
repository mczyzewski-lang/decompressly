"use client";

import { useState } from "react";
import { Lightbulb, Waves, Sofa, ChevronRight, Check } from "lucide-react";
import { logActivity, update, useApp } from "@/lib/store";
import { newId } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { isDemobilization } from "@/lib/goal";
import { navigate } from "@/lib/router";
import { toast } from "@/lib/ui-store";
import { Button, Card, CardButton, Screen, ScreenHeader, TextField, cn } from "../ui";

type Flow = "menu" | "idea" | "tension" | "rest";

export default function LetGo({ initialFlow }: { initialFlow: string | null }) {
  const [flow, setFlow] = useState<Flow>(initialFlow === "idea" || initialFlow === "tension" || initialFlow === "rest" ? initialFlow : "menu");

  return (
    <Screen tabbed>
      <ScreenHeader onBack={flow !== "menu" && !initialFlow ? () => setFlow("menu") : undefined} />
      {flow === "menu" && (
        <div className="animate-fade-in">
          <h1 className="font-display text-[32px] leading-tight tracking-tight text-ink">Nie każda możliwość wymaga realizacji.</h1>
          <div className="mt-8 space-y-3">
            {[
              { id: "idea" as const, label: "Mam nowy pomysł", Icon: Lightbulb },
              { id: "tension" as const, label: "Czuję napięcie", Icon: Waves },
              { id: "rest" as const, label: "Chcę odpocząć", Icon: Sofa },
            ].map((a) => (
              <CardButton key={a.id} onClick={() => setFlow(a.id)} className="flex items-center gap-4 py-6">
                <a.Icon className="h-6 w-6 text-sage-deep" strokeWidth={1.6} />
                <span className="flex-1 text-[18px] text-ink">{a.label}</span>
                <ChevronRight className="h-5 w-5 text-ink-3" />
              </CardButton>
            ))}
          </div>
        </div>
      )}
      {flow === "idea" && <IdeaFlow />}
      {flow === "tension" && <TensionFlow />}
      {flow === "rest" && <RestFlow />}
    </Screen>
  );
}

function IdeaFlow() {
  const goal = useApp((s) => s.goal);
  const [choice, setChoice] = useState<null | "create" | "rest" | "park">(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const november = isDemobilization(goal, toISODate());

  const save = () => {
    const t = text.trim();
    if (!t) return;
    update((s) => {
      s.ideas.unshift({ id: newId("idea"), text: t, createdAt: Date.now(), state: "parked" });
    });
    setSaved(true);
    toast("Pomysł zaparkowany.");
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-[28px] leading-snug tracking-tight text-ink">Czy chcę świadomie tworzyć, czy automatycznie wypełniam wolny czas kolejnym projektem?</h1>
      <div className="mt-8 space-y-2">
        {[
          { id: "create" as const, label: "Chcę świadomie tworzyć." },
          { id: "rest" as const, label: "Wolę dzisiaj odpocząć." },
          { id: "park" as const, label: "Zapiszę pomysł na później." },
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => setChoice(o.id)}
            className={cn("w-full rounded-3xl p-5 text-left text-[17px] ring-1 transition-all duration-300", choice === o.id ? "bg-surface text-ink shadow-soft ring-sage" : "text-ink ring-line")}
            aria-pressed={choice === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>

      {choice === "create" && (
        <Card className="mt-6 animate-fade-up">
          <p className="text-[16px] leading-relaxed text-ink">To Twój wybór i jest w porządku. Tworzenie z wyboru to coś innego niż tworzenie z odruchu.</p>
          <p className="mt-2 text-[14px] text-ink-2">Może warto ustalić, do której godziny dzisiaj działasz?</p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate("today")}>
            Wróć do dnia
          </Button>
        </Card>
      )}
      {choice === "rest" && (
        <Card className="mt-6 animate-fade-up">
          <p className="text-[16px] leading-relaxed text-ink">Dobry wybór. Pomysł może poczekać — a jeśli chcesz, zapisz go jednym zdaniem.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate("letgo?flow=rest")}>
              Wybierz odpoczynek
            </Button>
            <Button variant="ghost" onClick={() => setChoice("park")}>
              Zapisz pomysł
            </Button>
          </div>
        </Card>
      )}
      {choice === "park" && (
        <div className="mt-6 animate-fade-up">
          {november && <p className="mb-4 font-display text-[20px] leading-snug text-sage-deep">To dobry pomysł. Może poczekać do grudnia.</p>}
          {!saved ? (
            <>
              <TextField
                label="Jeden pomysł = jedno zdanie"
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="np. Aplikacja do planowania wspólnych wyjazdów"
                autoFocus
              />
              <Button className="mt-3" variant="primary" block size="lg" onClick={save} disabled={!text.trim()}>
                Zaparkuj pomysł
              </Button>
            </>
          ) : (
            <Card className="text-center">
              <Check className="mx-auto h-6 w-6 text-sage" />
              <p className="mt-2 text-[16px] text-ink">Pomysł jest bezpieczny w parkingu.</p>
              <p className="mt-1 text-[14px] text-ink-2">Nie zniknie. Ty możesz wrócić do swojego dnia.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => navigate("ideas")}>
                  Parking
                </Button>
                <Button variant="primary" onClick={() => navigate("today")}>
                  Dziś
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

const TENSION_STEPS = [
  { title: "Zauważ doznanie.", body: "Gdzie je czujesz? Klatka, brzuch, kark, dłonie. Nie musisz go nazywać ani analizować." },
  { title: "Rozluźnij barki i szczękę.", body: "Pozwól barkom opaść od uszu. Rozsuń lekko zęby. Język może swobodnie leżeć." },
  { title: "Poczuj podparcie ciała.", body: "Stopy na podłodze, ciężar na krześle albo materacu. Coś Cię niesie." },
  { title: "Jeśli masz ochotę, uruchom spokojny oddech.", body: "Kilka oddechów z wydechem dłuższym niż wdech. Tylko jeśli masz ochotę." },
  { title: "Wróć do wybranej czynności.", body: "Napięcie może zostać trochę dłużej. To w porządku." },
];

function TensionFlow() {
  const [step, setStep] = useState(0);
  const last = step === TENSION_STEPS.length - 1;
  return (
    <div className="animate-fade-in">
      <p className="font-display text-[22px] leading-snug text-ink-2">Nie musisz natychmiast pozbywać się napięcia. Możesz pozwolić mu być.</p>
      <ol className="mt-8 space-y-2">
        {TENSION_STEPS.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => setStep(i)}
              className={cn("w-full rounded-3xl p-5 text-left transition-all duration-500", i === step ? "bg-surface shadow-soft ring-1 ring-line" : "opacity-50")}
              aria-current={i === step ? "step" : undefined}
            >
              <p className="text-[17px] text-ink">
                <span className="tabular mr-2 text-ink-3">{i + 1}.</span>
                {s.title}
              </p>
              {i === step && <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex gap-3">
        {step === 3 && (
          <Button variant="secondary" size="lg" onClick={() => navigate("breath?min=2&mode=calm")}>
            Spokojny oddech
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => {
            if (last) {
              logActivity("tension");
              navigate("today");
            } else setStep((s) => s + 1);
          }}
        >
          {last ? "Wracam do dnia" : "Dalej"}
        </Button>
      </div>
    </div>
  );
}

function RestFlow() {
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">Jak chcesz odpocząć?</h1>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {[
          { label: "Nic nie robię", hint: "5 minut", to: "nothing?min=5" },
          { label: "Oddech", hint: "5 minut", to: "breath?min=5&mode=calm" },
          { label: "Joga", hint: "10 minut", to: "yoga/run/s10" },
          { label: "Audio", hint: "15 minut", to: "audio/demob" },
        ].map((o) => (
          <CardButton key={o.label} onClick={() => navigate(o.to)} className="flex aspect-square flex-col justify-end">
            <span className="text-[18px] text-ink">{o.label}</span>
            <span className="mt-1 text-[13px] text-ink-3">{o.hint}</span>
          </CardButton>
        ))}
      </div>
    </div>
  );
}
