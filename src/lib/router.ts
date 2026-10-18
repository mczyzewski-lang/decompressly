"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny hash router. The whole app is a single prerendered page, which keeps the
 * service-worker offline story simple and reliable on iOS (one HTML document + static chunks).
 */
export interface Route {
  path: string; // e.g. "yoga/run/s10"
  segments: string[];
  params: URLSearchParams;
}

function read(): string {
  if (typeof window === "undefined") return "today";
  const h = window.location.hash.replace(/^#\/?/, "");
  return h || "today";
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function parseRoute(raw: string): Route {
  const [p, q = ""] = raw.split("?");
  const path = p.replace(/\/+$/, "") || "today";
  return { path, segments: path.split("/"), params: new URLSearchParams(q) };
}

export function useRoute(): Route {
  const raw = useSyncExternalStore(subscribe, read, () => "today");
  return parseRoute(raw);
}

let depth = 0; // in-app navigations we can safely go back through

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const target = `#/${to.replace(/^#?\/?/, "")}`;
  if (opts.replace) {
    history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    depth++;
    window.location.hash = target;
  }
  window.scrollTo({ top: 0 });
}

export function back(fallback = "today") {
  if (depth > 0) {
    depth--;
    history.back();
  } else {
    navigate(fallback, { replace: true });
  }
}

export const TABS = ["today", "breath", "yoga", "audio"] as const;
export type Tab = (typeof TABS)[number];

export function tabFor(path: string): Tab | null {
  const first = path.split("/")[0];
  if (first === "today" || first === "breath" || first === "yoga" || first === "audio") return first;
  return null;
}
