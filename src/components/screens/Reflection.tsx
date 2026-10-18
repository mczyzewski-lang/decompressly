"use client";

import { useState } from "react";
import { logActivity, update } from "@/lib/store";
import { newId } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { back } from "@/lib/router";
import { toast } from "@/lib/ui-store";
import { Button, Screen, ScreenHeader, TextArea } from "../ui";

const QUESTIONS = [
  { key: "calm", q: "Kiedy czułem autentyczny spokój?" },
  { key: "pulled", q: "Kiedy ekscytacja pociągnęła mnie do działania?" },
  { key: "choose", q: "Co chciałbym częściej wybierać?" },
] as const;

export default function Reflection() {
  const [a, setA] = useState({ calm: "", pulled: "", choose: "" });
  const empty = !a.calm.trim() && !a.pulled.trim() && !a.choose.trim();
  return (
    <Screen tabbed>
      <ScreenHeader title="Refleksja tygodnia" subtitle="Odpowiedz tylko na to, na co masz ochotę. Bez ocen." fallback="goal" />
      <div className="mt-4 space-y-6">
        {QUESTIONS.map(({ key, q }) => (
          <TextArea key={key} label={q} rows={3} value={a[key]} onChange={(e) => setA({ ...a, [key]: e.target.value })} />
        ))}
      </div>
      <Button
        className="mt-8"
        variant="primary"
        size="lg"
        block
        disabled={empty}
        onClick={() => {
          update((s) => void s.reflections.push({ id: newId("rf"), date: toISODate(), createdAt: Date.now(), calm: a.calm.trim(), pulled: a.pulled.trim(), choose: a.choose.trim() }));
          logActivity("reflection");
          toast("Zapisane. Dziękuję.");
          back("goal");
        }}
      >
        Zapisz
      </Button>
    </Screen>
  );
}
