"use client";

import { Headphones, Sun, Wind, Flower2 } from "lucide-react";
import { navigate, tabFor, useRoute, type Tab } from "@/lib/router";
import { cn } from "./ui";

const ITEMS: { id: Tab; label: string; Icon: typeof Sun }[] = [
  { id: "today", label: "Dziś", Icon: Sun },
  { id: "breath", label: "Oddech", Icon: Wind },
  { id: "yoga", label: "Joga", Icon: Flower2 },
  { id: "audio", label: "Audio", Icon: Headphones },
];

export function TabBar() {
  const route = useRoute();
  const active = tabFor(route.path) ?? "today";
  return (
    <nav aria-label="Główna nawigacja" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/88 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-lg justify-around px-2 pt-1.5">
        {ITEMS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => (on && route.path === id ? window.scrollTo({ top: 0, behavior: "smooth" }) : navigate(id))}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-medium tracking-wide transition-colors duration-300",
                  on ? "text-sage-deep" : "text-ink-3",
                )}
              >
                <Icon className="h-[23px] w-[23px]" strokeWidth={on ? 2 : 1.6} aria-hidden />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
