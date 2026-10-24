import type { Thought, ThoughtContext } from "./thoughts";

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
  /** how the voice addresses the user (wołacz), e.g. "Marku"; empty = automatic */
  nameVocative?: string;
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
  /** optional question from the thought library offered that week */
  extraQuestion?: string;
  extra?: string;
}

export type MomentTag = "rodzina" | "natura" | "cialo" | "smak" | "ludzie" | "spokoj" | "dumny";

export interface GoodMoment {
  id: string;
  text: string;
  tag: MomentTag;
  date: string;
  at: number;
}

export interface QuestionNote {
  id: string;
  questionId: string;
  date: string;
  createdAt: number;
  text: string;
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
  /** how the voice addresses the user (wołacz), e.g. "Marku"; empty = automatic */
  nameVocative?: string;
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
  /** seconds, 5–30 */
  duration?: number;
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
  /** saved voices to choose from (the default one is voiceId) */
  voices?: CollectionVoice[];
  /** ask before every paid generation (off by default — generation starts right away) */
  confirmBeforeGenerate: boolean;
}

export type BreathModeId = "calm" | "gentle" | "natural" | "custom";
export type BreathCue = "silent" | "tone" | "voice";

export interface BreathSettings {
  defaultMode: BreathModeId;
  defaultMinutes: number;
  customInhale: number;
  customExhale: number;
  cue: BreathCue;
  /** soft, synthesized sound of the inhale and exhale under the cue */
  air?: boolean;
  /** 0..1, kept low by default */
  airVolume?: number;
}

export type Background = "none" | "nature" | "jazz" | "system" | "orchestral";
export type Motif = "none" | "start" | "close";

export interface AudioSessionOverride {
  script?: string;
  background?: Background;
  motif?: Motif;
  /** recording made before lengths existed (kept until a new recording replaces it) */
  render?: SessionRender;
  /** recordings per chosen length in minutes ("10", "15", "20", "30") */
  renders?: Record<string, SessionRender>;
  /** chosen length in minutes */
  length?: number;
  /** ElevenLabs voice for this session (empty = default voice) */
  voiceId?: string;
  /** CLOSE motif returns quietly in the second half and ends at full volume (default on) */
  motifRamp?: boolean;
  /** multiplies every [pauza] in the script (1 = as written) */
  pauseScale?: number;
  /** silence between consecutive spoken paragraphs, seconds */
  gap?: number;
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
  /** how the voice addresses the user (wołacz), e.g. "Marku"; empty = automatic */
  nameVocative?: string;
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
  audio: { defaultBackground: Background; sessions: Record<string, AudioSessionOverride>; pauseScale?: number; gap?: number };
  trip: TripState;
  privacy: { elevenLogging: boolean };
  thoughtFavorites: string[];
  thoughtHidden: string[];
  thoughtEdits: Record<string, string>;
  thoughtContexts: Record<string, ThoughtContext[]>;
  customThoughts: Thought[];
  questionNotes: QuestionNote[];
  /** "Słoik dobrych chwil" — small good moments, one sentence each */
  moments?: GoodMoment[];
  /** OpenAI key pasted in Settings — retells path reflections; kept on this device only, never exported */
  openai?: { apiKey: string; model: string };
  /** "Ścieżki": the current run of each path (audio → reflection → audio) */
  paths?: Record<string, PathRun>;
  /** finished or restarted runs, newest first */
  pathArchive?: PathRun[];
  /** pose id → blob id of the user's own reference photo */
  yogaPhotos?: Record<string, string>;
  /** one-off data migrations already applied */
  migrations?: string[];
}

export interface PathNote {
  /** one sentence after the session; empty when the reflection was consciously skipped */
  text: string;
  at: number;
  /** kept for yourself only — never woven into the next recording */
  private?: boolean;
  /** the reflection retold in the second person, spoken by the next session instead of a quote */
  paraphrase?: string;
  /** the exact text the paraphrase was made from (an edit of the reflection makes it stale) */
  paraphraseOf?: string;
  /** "user" when you wrote it yourself */
  paraphraseBy?: "ai" | "user";
  /** style version of a generated paraphrase (older ones are made again) */
  paraphraseVersion?: number;
}

export interface PathRun {
  id: string;
  pathId: string;
  startedAt: number;
  finishedAt?: number;
  /** step number → reflection written after that step */
  notes: Record<number, PathNote>;
}

/** A voice in the collection; `modelId` overrides the default model for this voice */
export interface CollectionVoice {
  id: string;
  name: string;
  modelId?: string;
}

export interface SessionRender {
  blobId: string;
  voiceId: string;
  scriptHash: string;
  createdAt: number;
  durationSec: number;
  background: Background;
  motif: Motif;
  pauseScale?: number;
  gap?: number;
  layout?: string;
  length?: number;
}
