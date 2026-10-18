"use client";

import { useUI } from "@/lib/ui-store";
import { Button, Sheet } from "./ui";

export function ConfirmHost() {
  const c = useUI((s) => s.confirm);
  return (
    <Sheet open={!!c} onOpenChange={(o) => !o && c?.resolve(false)} title={c?.title ?? ""}>
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{c?.body}</p>
      <div className="mt-6 flex gap-3">
        <Button block variant="secondary" onClick={() => c?.resolve(false)}>
          Anuluj
        </Button>
        <Button block variant="primary" onClick={() => c?.resolve(true)}>
          {c?.confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

export function ToastHost() {
  const t = useUI((s) => s.toast);
  if (!t) return null;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-6">
      <div key={t.id} className="animate-fade-up rounded-full bg-ink px-5 py-3 text-[14px] text-bg shadow-lift">{t.text}</div>
    </div>
  );
}
