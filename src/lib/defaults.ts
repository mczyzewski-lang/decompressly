import type { AppState, DayMode, Goal, RhythmTemplateItem, SoundSet, TripDay } from "./types";

export const STATE_VERSION = 1;

export const DEFAULT_GOAL: Goal = {
  title: "Keep Your Nervous System Healthy",
  description:
    "Chcę odzyskać swobodę odpoczywania po długim okresie mobilizacji i nauczyć się, że nie każda możliwość wymaga realizacji.",
  start: "2026-10-18",
  end: "2026-12-31",
  stages: [
    {
      id: "closure",
      name: "Domknięcie",
      subtitle: "Etap 1",
      start: "2026-10-18",
      end: "2026-10-31",
      intentions: [
        "Zamykam intensywny etap Nowego Etapu.",
        "Potwierdzam wyniki.",
        "Przekazuję odpowiedzialność.",
        "Celebruję zakończenie wysiłku.",
        "Nie rozpoczynam nowego dużego projektu.",
      ],
      reminder: "Domykasz to, co zbudowałeś. Zakończenie też jest częścią pracy — i zasługuje na świętowanie.",
    },
    {
      id: "demob",
      name: "Demobilizacja",
      subtitle: "Etap 2",
      start: "2026-11-01",
      end: "2026-11-30",
      intentions: [
        "Nie zaczynam nowych projektów biznesowych.",
        "Nie buduję nowych aplikacji w Claude Code.",
        "Nie uruchamiam nowych inicjatyw R&D.",
        "Pomysły zapisuję do parkingu.",
        "Pracuję tylko nad niezbędnymi obowiązkami.",
        "Świadomie zwiększam ilość odpoczynku.",
      ],
      reminder: "Dobrowolny eksperyment, nie zakaz. Pomysły mogą poczekać w parkingu — Ty możesz wrócić do domu.",
    },
    {
      id: "rhythm",
      name: "Nowy rytm",
      subtitle: "Etap 3",
      start: "2026-12-01",
      end: "2026-12-31",
      intentions: [
        "Zachowuję rytuał kończenia pracy.",
        "Świadomie wybieram nowe inicjatywy.",
        "Planuję odpoczynek równie naturalnie jak pracę.",
        "Sprawdzam, czy częściej doświadczam poczucia „nic nie muszę”.",
      ],
      reminder: "Teraz możesz wybierać. Tworzenie wraca jako wybór, nie jako odruch.",
    },
  ],
};

let seq = 0;
const tid = (p: string) => `${p}-${++seq}`;

const work: RhythmTemplateItem[] = [
  { id: tid("w"), time: "07:00", title: "Spokojny poranek", note: "Kawa bez telefonu." },
  { id: tid("w"), time: "09:00", title: "Rozpoczęcie pracy", link: "start" },
  { id: tid("w"), time: "12:30", title: "Krótka przerwa bez ekranu", note: "Kilka minut przy oknie albo na zewnątrz." },
  { id: tid("w"), time: "16:00", title: "Zamknięcie pracy", link: "close" },
  { id: tid("w"), time: "17:00", title: "Rodzina i obecność", note: "Monika, Leon, Gaja." },
  { id: tid("w"), time: "20:30", title: "Opcjonalne rozluźnienie", link: "yoga" },
  { id: tid("w"), time: "22:00", title: "Przygotowanie do snu", note: "Przyciemnione światło, ekran odłożony." },
];

const rest: RhythmTemplateItem[] = [
  { id: tid("r"), time: "08:00", title: "Niespieszny poranek", note: "Bez budzika, jeśli się da." },
  { id: tid("r"), time: "11:00", title: "Spacer lub ruch na zewnątrz" },
  { id: tid("r"), time: "15:00", title: "Czas bez planowania", link: "nothing" },
  { id: tid("r"), time: "17:00", title: "Rodzina i obecność" },
  { id: tid("r"), time: "21:30", title: "Wieczorne odpuszczanie", link: "audio/evening" },
];

const trip: RhythmTemplateItem[] = [];

const sick: RhythmTemplateItem[] = [
  { id: tid("s"), time: "09:00", title: "Odpoczynek — bez poczucia winy" },
  { id: tid("s"), time: "13:00", title: "Coś ciepłego do picia" },
  { id: tid("s"), time: "16:00", title: "Krótka relaksacja", link: "audio/present" },
  { id: tid("s"), time: "21:00", title: "Wcześniej do łóżka" },
];

export const DEFAULT_TEMPLATES: Record<DayMode, RhythmTemplateItem[]> = { work, rest, trip, sick };

export const DAY_MODES: { id: DayMode; label: string; hint: string }[] = [
  { id: "work", label: "Praca", hint: "Spokojny dzień pracy z wyraźnym końcem." },
  { id: "rest", label: "Odpoczynek", hint: "Dzień bez harmonogramu pracy." },
  { id: "trip", label: "Wyjazd", hint: "Minimum aplikacji, maksimum wyjazdu." },
  { id: "sick", label: "Regeneracja", hint: "Choroba albo potrzeba regeneracji. Nic nie musisz." },
];

export const DEFAULT_TRIP_DAYS: TripDay[] = [
  {
    day: 1,
    title: "Odłączenie",
    intention: "Wyłącz powiadomienia służbowe. Pozwól, żeby pierwszy dzień był trochę dziwny.",
    practice: { label: "Spokojny oddech · 5 min", route: "breath?min=5&mode=calm" },
    audio: { label: "Powrót do chwili obecnej · 3 min", route: "audio/present" },
    mantra: "Nie przegapiam niczego, kiedy jestem tutaj.",
  },
  {
    day: 2,
    title: "Niespieszność",
    intention: "Rób wszystko odrobinę wolniej niż zwykle. Śniadanie, spacer, rozmowy.",
    practice: { label: "Spacer bez celu", route: "nothing?kind=walk" },
    audio: { label: "Spokojny poranek · 5 min", route: "audio/morning" },
    mantra: "Świat może pędzić. Ja mogę iść spacerem.",
  },
  {
    day: 3,
    title: "Odpoczynek fizyczny",
    intention: "Słońce, woda, sen w ciągu dnia. Ciało odpoczywa we własnym tempie.",
    practice: { label: "Joga · 10 min", route: "yoga/run/s10" },
    audio: { label: "Leżak w Esteponie · 12 min", route: "audio/estepona" },
    mantra: "Mogę po prostu leżeć i niczego nie poprawiać.",
  },
  {
    day: 4,
    title: "Obecność z rodziną",
    intention: "Jeden dzień, w którym program ustalają Leon i Gaja.",
    practice: { label: "Rozluźnij barki i szczękę", route: "letgo?flow=tension" },
    mantra: "Obecność jest najlepszym, co dziś mogę dać.",
  },
  {
    day: 5,
    title: "Utrwalenie spokojnego rytmu",
    intention: "Zauważ, co z tego wyjazdu chcesz zabrać do zwykłych dni.",
    practice: { label: "Spokojny oddech · 10 min", route: "breath?min=10&mode=calm" },
    audio: { label: "Głęboka demobilizacja · 15 min", route: "audio/demob" },
    mantra: "Mam prawo cieszyć się tym, co już zbudowałem.",
  },
];

export const BUILTIN_SOUND_SETS: SoundSet[] = (["system", "nature", "jazz", "orchestral"] as const).map((style) => ({
  id: `builtin-${style}`,
  name:
    style === "system" ? "System (wbudowany)" : style === "nature" ? "Natura (wbudowany)" : style === "jazz" ? "Jazz (wbudowany)" : "Orkiestra (wbudowany)",
  style,
  start: { kind: "static", url: `/sounds/${style}-start.mp3` },
  close: { kind: "static", url: `/sounds/${style}-close.mp3` },
  builtIn: true,
  createdAt: 0,
  source: "builtin",
}));

export function createDefaultState(): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    name: "Marek",
    theme: "system",
    goal: structuredClone(DEFAULT_GOAL),
    templates: structuredClone(DEFAULT_TEMPLATES),
    days: {},
    startRitual: {
      steps: ["Przygotowuję kawę.", "Piję ją spokojnie.", "Wybieram, że rozpoczynam pracę.", "Uruchamiam dźwięk START."],
      drink: "kawa",
      mantra: "Dzisiaj mogę działać z ciekawością, ale bez pośpiechu.",
      showMantra: true,
    },
    closeRitual: {
      steps: [
        "Spisałem niedomknięte sprawy na jutro.",
        "Zamknąłem laptop.",
        "Powiedziałem: „Na dzisiaj kończę pracę.”",
        "Przygotowałem kombuchę lub inny ulubiony napój.",
      ],
      message: "Wojna się skończyła.\nNa dzisiaj nie musisz niczego więcej budować.\nTeraz możesz cieszyć się życiem.",
      defaultTime: "16:00",
      playNarration: false,
    },
    ideas: [],
    reflections: [],
    mantraFavorites: [],
    customMantras: [],
    mantraAudio: {},
    log: [],
    soundSets: structuredClone(BUILTIN_SOUND_SETS),
    activeSoundSetId: "builtin-system",
    soundDrafts: {},
    openai: { apiKey: "", model: "gpt-5.4-mini" },
    eleven: {
      accessKey: "",
      voiceId: "",
      voiceName: "",
      modelId: "eleven_multilingual_v2",
      stability: 0.6,
      similarity: 0.75,
      style: 0.1,
      speed: 0.9,
      confirmBeforeGenerate: false,
    },
    breath: { defaultMode: "calm", defaultMinutes: 5, customInhale: 4, customExhale: 6, cue: "voice", air: true, airVolume: 0.6 },
    voiceCues: {},
    yoga: { favoriteSessionId: "s10", handsFree: true, voice: true },
    audio: { defaultBackground: "nature", sessions: {} },
    trip: { active: false, startDate: "", days: structuredClone(DEFAULT_TRIP_DAYS) },
    privacy: { elevenLogging: false },
    thoughtFavorites: [],
    thoughtHidden: [],
    thoughtEdits: {},
    thoughtContexts: {},
    customThoughts: [],
    questionNotes: [],
  };
}
