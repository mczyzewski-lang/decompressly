const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD (never UTC — evenings must stay "today"). */
export function toISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function isWithin(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

const MONTHS_GEN = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
export const MONTHS_NOM = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const WEEKDAYS = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
export const WEEKDAYS_SHORT = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export function formatLong(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function formatRange(a: string, b: string): string {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) {
    return `${da.getDate()}–${db.getDate()} ${MONTHS_GEN[db.getMonth()]}`;
  }
  return `${formatShort(a)} – ${formatShort(b)}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nowHHMM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function shiftTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  let total = (h * 60 + m + minutes) % 1440;
  if (total < 0) total += 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** ISO week key, e.g. "2026-W43". Monday-based. */
export function weekKey(iso: string): string {
  const d = parseISODate(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${pad(week)}`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** Deterministic 32-bit hash used for "random but stable for the day" choices. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function greeting(name: string, date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return `Dobrej nocy, ${name}.`;
  if (h < 18) return `Dzień dobry, ${name}.`;
  return `Dobry wieczór, ${name}.`;
}
