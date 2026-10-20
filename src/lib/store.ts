"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { AppState, DayMode, DayRecord, LogType } from "./types";
import { BUILTIN_SOUND_SETS, createDefaultState, STATE_VERSION } from "./defaults";
import { kvGet, kvSet, newId } from "./db";
import { toISODate } from "./dates";
import { nameForms } from "./names";

interface Store {
  hydrated: boolean;
  state: AppState;
  hydrate: () => Promise<void>;
  update: (fn: (s: AppState) => void) => void;
  replaceAll: (s: AppState) => void;
}

const STATE_KEY = "state";

export function migrate(input: Partial<AppState> | undefined): AppState {
  const base = createDefaultState();
  if (!input || typeof input !== "object") return base;
  const merged = { ...base, ...input } as AppState;
  // nested objects get defaults for newly added fields
  merged.eleven = { ...base.eleven, ...(input.eleven ?? {}) };
  merged.breath = { ...base.breath, ...(input.breath ?? {}) };
  merged.yoga = { ...base.yoga, ...(input.yoga ?? {}) };
  merged.audio = { ...base.audio, ...(input.audio ?? {}), sessions: { ...(input.audio?.sessions ?? {}) } };
  merged.trip = { ...base.trip, ...(input.trip ?? {}) };
  merged.privacy = { ...base.privacy, ...(input.privacy ?? {}) };
  merged.startRitual = { ...base.startRitual, ...(input.startRitual ?? {}) };
  merged.closeRitual = { ...base.closeRitual, ...(input.closeRitual ?? {}) };
  merged.templates = { ...base.templates, ...(input.templates ?? {}) };
  // built-in sound sets always present
  const sets = merged.soundSets ?? [];
  for (const b of BUILTIN_SOUND_SETS) if (!sets.some((s) => s.id === b.id)) sets.unshift(structuredClone(b));
  merged.soundSets = sets;
  if (!sets.some((s) => s.id === merged.activeSoundSetId)) merged.activeSoundSetId = "builtin-system";
  merged.version = STATE_VERSION;
  return merged;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: AppState | null = null;

function scheduleSave(s: AppState) {
  pending = s;
  // write almost immediately (coalescing changes from the same tick): closing the app right after a
  // change — e.g. a freshly generated sound set — must never lose it
  if (saveTimer) return;
  saveTimer = setTimeout(flushSave, 0);
}

let writing: Promise<void> = Promise.resolve();

/** Persists the latest state; resolves once it is safely in IndexedDB. Writes are serialised. */
export async function flushSave(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (pending) {
    const s = pending;
    pending = null;
    writing = writing.then(async () => {
      try {
        await kvSet(STATE_KEY, JSON.parse(JSON.stringify(s)));
      } catch (e) {
        console.error("Nie udało się zapisać danych", e);
      }
    });
  }
  return writing;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => void flushSave());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushSave();
  });
}

export const useStore = create<Store>()(
  immer((set, get) => ({
    hydrated: false,
    state: createDefaultState(),
    hydrate: async () => {
      if (get().hydrated) return;
      let loaded: Partial<AppState> | undefined;
      try {
        loaded = await kvGet<Partial<AppState>>(STATE_KEY);
      } catch (e) {
        console.error("IndexedDB niedostępne", e);
      }
      set((st) => {
        st.state = migrate(loaded);
        st.hydrated = true;
      });
    },
    update: (fn) => {
      set((st) => {
        fn(st.state);
      });
      scheduleSave(get().state);
    },
    replaceAll: (s) => {
      set((st) => {
        st.state = migrate(s);
      });
      scheduleSave(get().state);
    },
  })),
);

/** Name forms for spoken guidance: nominative ("Marek") and vocative ("Marku"). */
export function getNameForms() {
  const s = getState();
  return nameForms(s.name, s.nameVocative);
}
export function useNameForms() {
  const name = useApp((s) => s.name);
  const voc = useApp((s) => s.nameVocative);
  return nameForms(name, voc);
}

export const useApp = <T,>(sel: (s: AppState) => T) => useStore((st) => sel(st.state));
export const update = (fn: (s: AppState) => void) => useStore.getState().update(fn);
export const getState = () => useStore.getState().state;

export function buildDay(s: AppState, date: string, mode: DayMode): DayRecord {
  return {
    date,
    mode,
    items: s.templates[mode].map((t) => ({ ...t, id: newId("it"), status: "open" as const })),
    workState: "idle",
  };
}

/** Ensure a record exists for the date. Default mode: trip if trip mode is active, else work on weekdays, rest on weekends. */
export function ensureDay(date: string) {
  const s = getState();
  if (s.days[date]) return;
  const dow = new Date(date + "T12:00:00").getDay();
  const mode: DayMode = s.trip.active ? "trip" : dow === 0 || dow === 6 ? "rest" : "work";
  update((st) => {
    if (!st.days[date]) st.days[date] = buildDay(st, date, mode);
  });
}

export function setDayMode(date: string, mode: DayMode) {
  update((st) => {
    const prev = st.days[date];
    const fresh = buildDay(st, date, mode);
    // keep things already ticked off when switching modes
    if (prev) {
      fresh.startedAt = prev.startedAt;
      fresh.closedAt = prev.closedAt;
      fresh.workState = prev.workState;
      fresh.planned = prev.planned;
    }
    st.days[date] = fresh;
  });
}

export function logActivity(type: LogType, detail?: string) {
  update((st) => {
    st.log.push({ id: newId("log"), date: toISODate(), at: Date.now(), type, detail });
    if (st.log.length > 3000) st.log.splice(0, st.log.length - 3000);
  });
}
