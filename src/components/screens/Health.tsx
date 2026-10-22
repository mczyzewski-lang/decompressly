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
      <button onClick={() => navigate("moments")} className="mt-6 flex w-full items-center gap-4 rounded-3xl bg-sand/50 p-5 text-left active:scale-[0.99]">
        <svg viewBox="0 0 40 48" className="h-12 w-10 shrink-0" aria-hidden>
          <rect x="12" y="2" width="16" height="5" rx="2" fill="rgb(var(--clay))" opacity="0.6" />
          <path d="M14 7h12v3c6 2 9 6 9 12v18c0 4-3 6-6 6H11c-3 0-6-2-6-6V22c0-6 3-10 9-12z" fill="rgb(var(--surface))" stroke="rgb(var(--clay))" strokeOpacity="0.4" />
          <circle cx="14" cy="38" r="4" fill="#C98C6B" /><circle cx="23" cy="39" r="4" fill="#7E9A72" /><circle cx="30" cy="36" r="3.5" fill="#C9A34E" /><circle cx="19" cy="31" r="3.5" fill="#7FA3A8" />
        </svg>
        <span className="flex-1">
          <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-clay">Savor</span>
          <span className="mt-1 block text-[17px] text-ink">Słoik dobrych chwil</span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-2">Wrzuć jedną dobrą chwilę dnia. Kiedyś wylosujesz ją i posłuchasz.</span>
        </span>
        <ArrowRight className="h-5 w-5 text-ink-3" />
      </button>

      <p className="mt-8 px-2 text-[12px] leading-relaxed text-ink-3">{HEALTH_DISCLAIMER}</p>
    </Screen>
  );
}
