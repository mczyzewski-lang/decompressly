export type DayMode = "work" | "rest" | "trip" | "sick";

export type ItemStatus = "open" | "done" | "skipped";

export interface RhythmTemplateItem {
  id: string;
  time: string; // "HH:MM"
  title: string;
  note?: string;
  link?: string; // route inside the app, e.g. "breath"
}

export interface DayItem extends RhythmTemplateItem {
  status: ItemStatus;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  mode: DayMode;
  items: DayItem[];
  startedAt?: number;
  closedAt?: number;
  resumedAt?: number;
  workState?: "idle" | "working" | "after";
  planned?: PlannedPractice[]; // practices chosen for this date (calendar)
}

export interface PlannedPractice {
  id: string;
  kind: PracticeKind;
  label: string;
  time?: string;
}

export type PracticeKind = "breath" | "yoga" | "audio" | "walk" | "nothing" | "ritual" | "other";

export type LogType = "start" | "close" | "breath" | "yoga" | "audio" | "walk" | "nothing" | "tension" | "reflection";

export interface LogEntry {
  id: string;
  date: string;
  at: number;
  type: LogType;
  detail?: string;
}

export interface GoalStage {
  id: string;
  name: string;
  subtitle: string;
  start: string;
  end: string;
  intentions: string[];
  reminder: string;
}

export interface Goal {
  title: string;
  description: string;
  start: string;
  end: string;
  stages: GoalStage[];
}

export interface Idea {
  id: string;
  text: string;
  createdAt: number;
  state: "parked" | "chosen" | "released";
}

export interface Reflection {
  id: string;
  date: string;
  createdAt: number;
  calm: string;
  pulled: string;
  choose: string;
}

export interface Mantra {
  id: string;
  text: string;
  category: MantraCategory;
  custom?: boolean;
}

export type MantraCategory =
  | "odpuszczanie"
  | "ekscytacja"
  | "fomo"
  | "rodzina"
  | "regeneracja"
  | "obecnosc"
  | "satysfakcja"
  | "zakonczenie";

export type SoundStyle = "nature" | "system" | "jazz" | "orchestral" | "custom";

/** Reference to an audio file: either a bundled static URL or a blob stored in IndexedDB. */
export type AudioRef = { kind: "static"; url: string } | { kind: "blob"; id: string };

export interface SoundSet {
  id: string;
  name: string;
  style: SoundStyle;
  start: AudioRef;
  close: AudioRef;
  builtIn?: boolean;
  createdAt: number;
  promptStart?: string;
  promptClose?: string;
  source: "builtin" | "elevenlabs" | "import" | "variant";
}

export interface SoundDraft {
  style: SoundStyle;
  promptStart: string;
  promptClose: string;
  promptInfluence: number;
  start?: AudioRef;
  close?: AudioRef;
  /** ids of previously generated takes that can still be compared */
  startTakes: string[];
  closeTakes: string[];
}

export interface ElevenSettings {
  accessKey: string;
  voiceId: string;
  voiceName: string;
  modelId: string;
  stability: number;
  similarity: number;
  style: number;
  speed: number;
}

export type BreathModeId = "calm" | "gentle" | "natural" | "custom";
export type BreathCue = "silent" | "tone" | "voice";

export interface BreathSettings {
  defaultMode: BreathModeId;
  defaultMinutes: number;
  customInhale: number;
  customExhale: number;
  cue: BreathCue;
}

export type Background = "none" | "nature" | "jazz" | "system" | "orchestral";
export type Motif = "none" | "start" | "close";

export interface AudioSessionOverride {
  script?: string;
  background?: Background;
  motif?: Motif;
  render?: { blobId: string; voiceId: string; scriptHash: string; createdAt: number; durationSec: number; background: Background; motif: Motif };
}

export interface TripDay {
  day: number;
  title: string;
  intention: string;
  practice: { label: string; route: string };
  audio?: { label: string; route: string };
  mantra: string;
}

export interface TripState {
  active: boolean;
  startDate: string;
  days: TripDay[];
}

export interface StartRitual {
  steps: string[];
  drink: string;
  mantra: string;
  showMantra: boolean;
}

export interface CloseRitual {
  steps: string[];
  message: string;
  defaultTime: string;
  playNarration: boolean;
  narration?: AudioRef;
}

export interface AppState {
  version: number;
  onboarded: boolean;
  name: string;
  theme: "system" | "light" | "dark";
  goal: Goal;
  templates: Record<DayMode, RhythmTemplateItem[]>;
  days: Record<string, DayRecord>;
  startRitual: StartRitual;
  closeRitual: CloseRitual;
  ideas: Idea[];
  reflections: Reflection[];
  reflectionSnoozedWeek?: string;
  mantraFavorites: string[];
  mantraPinned?: string;
  mantraOfDay?: { date: string; id: string };
  customMantras: Mantra[];
  mantraAudio: Record<string, string>; // mantra id -> blob id
  log: LogEntry[];
  soundSets: SoundSet[];
  activeSoundSetId: string;
  soundDrafts: Partial<Record<SoundStyle, SoundDraft>>;
  eleven: ElevenSettings;
  breath: BreathSettings;
  voiceCues: Record<string, string>; // cue key -> blob id ("inhale", "exhale", "yoga:<poseId>")
  yoga: { favoriteSessionId: string; handsFree: boolean; voice: boolean };
  audio: { defaultBackground: Background; sessions: Record<string, AudioSessionOverride> };
  trip: TripState;
  privacy: { elevenLogging: boolean };
}
