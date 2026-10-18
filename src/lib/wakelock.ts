"use client";

import { useEffect } from "react";

type Sentinel = { release: () => Promise<void> };

/** Keeps the screen on while `active` (iOS 16.4+, Chrome). Silently no-ops elsewhere. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    const acquire = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === "visible") {
          sentinel = await nav.wakeLock.request("screen");
          if (cancelled) void sentinel.release();
        }
      } catch {
        /* not allowed — fine */
      }
    };
    void acquire();
    const onVis = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}

/** Calls `onHidden` whenever the page goes to the background. */
export function useOnHidden(onHidden: () => void) {
  useEffect(() => {
    const h = () => document.visibilityState === "hidden" && onHidden();
    document.addEventListener("visibilitychange", h);
    window.addEventListener("pagehide", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", h);
      window.removeEventListener("pagehide", onHidden);
    };
  }, [onHidden]);
}
