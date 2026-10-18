"use client";

import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { HEALTH, HEALTH_DISCLAIMER } from "@/lib/health";
import { navigate } from "@/lib/router";
import { Screen, ScreenHeader, cn } from "../ui";

export default function Health() {
  const [open, setOpen] = useState<string | null>("sleep");
  return (
    <Screen tabbed>
      <ScreenHeader title="Keep Your Nervous System Healthy" subtitle="Siedem prostych obszarów. Bez pomiarów i bez ocen." />
      <div className="mt-4 space-y-3">
        {HEALTH.map((c) => {
          const isOpen = open === c.id;
          return (
            <section key={c.id} className="overflow-hidden rounded-3xl bg-surface shadow-soft ring-1 ring-line/60">
              <button className="flex w-full items-center gap-4 p-5 text-left" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}>
                <span className="flex-1">
                  <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-sage-deep">{c.title}</span>
                  <span className="mt-1 block text-[16px] text-ink">{c.subtitle}</span>
                </span>
                <ChevronDown className={cn("h-5 w-5 text-ink-3 transition-transform duration-300", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="animate-fade-in px-5 pb-5">
                  <p className="text-[15px] leading-relaxed text-ink-2">{c.description}</p>
                  <ul className="mt-4 space-y-2.5">
                    {c.tips.map((t, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                        <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate(c.action.route)} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-sage-soft px-4 py-3.5 text-left">
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-sage-deep">Propozycja</span>
                      <span className="block text-[15px] text-ink">{c.action.label}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-sage-deep" />
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-8 px-2 text-[12px] leading-relaxed text-ink-3">{HEALTH_DISCLAIMER}</p>
    </Screen>
  );
}
