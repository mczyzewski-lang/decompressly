"use client";

import { update, useApp } from "@/lib/store";
import { navigate } from "@/lib/router";
import { unlockAudio } from "@/lib/audio/engine";
import { Button } from "../ui";

export default function FirstRun() {
  const name = useApp((s) => s.name);
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-between px-8 py-10">
      <div />
      <div className="animate-fade-up">
        <p className="font-display text-[40px] leading-none tracking-tight text-ink">decompressly.</p>
        <div className="mt-6 h-px w-12 bg-sage" aria-hidden />
        <p className="mt-6 font-display text-[22px] leading-snug text-ink-2">
          {name}, to jest miejsce, w którym niczego nie musisz osiągać.
        </p>
      </div>
      <div className="animate-fade-up [animation-delay:300ms]">
        <Button
          variant="primary"
          size="xl"
          block
          onClick={() => {
            void unlockAudio();
            update((s) => {
              s.onboarded = true;
            });
            navigate("today", { replace: true });
          }}
        >
          Zacznij spokojnie
        </Button>
        <p className="mt-4 text-center text-[12px] text-ink-3">Enjoy what you&apos;ve built.</p>
      </div>
    </main>
  );
}
