import type { SoundStyle } from "./types";

export interface StylePreset {
  id: Exclude<SoundStyle, "custom">;
  label: string;
  description: string;
  start: string;
  close: string;
}

/**
 * Prompts for ElevenLabs Sound Effects (POST /v1/sound-generation, model eleven_text_to_sound_v2).
 * START and CLOSE share instrumentation and a three-note motif so the pair feels related;
 * the generator still can't guarantee identical motifs, hence the listen-and-approve workflow
 * and the option to derive CLOSE from an approved START locally.
 */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "nature",
    label: "Natura",
    description: "Marimba, kalimba, ptaki i woda — świeży poranek / szum morza wieczorem.",
    start:
      "Twenty-second uplifting, energizing nature-inspired start-of-day jingle. A bright, catchy, instantly memorable five-note signature melody on warm wooden marimba, played over a lively rhythmic marimba arpeggio and light shaker groove, playful birdsong and sparkling water droplets, building with joyful momentum to a bright, confident major-chord finish. Fresh morning sunlight energy, no vocals.",
    close:
      "Twenty-second deeply calming, relaxing nature-inspired end-of-day melody. The same memorable five-note signature melody played slowly and tenderly on a soft wooden flute, warm kalimba notes answering, gentle ocean waves breathing in the background, resolving peacefully onto a warm major chord with a soft chime, long slow fade into quiet. Sunset serenity, no percussion, no vocals.",
  },
  {
    id: "system",
    label: "System",
    description: "Premium operating system: jasny dzwonek FM i puls / ciepłe wyciszenie.",
    start:
      "Twenty-second premium, energizing operating-system startup sound with a strong sonic identity. A bright, crystal-clear five-note signature melody on a glassy FM bell synth, driven by a pulsing synth arpeggio and a soft punchy beat, a rising airy swoosh at the start, building to a wide, shimmering, euphoric major chord. Modern, optimistic, motivating, polished like a flagship product launch, no vocals.",
    close:
      "Twenty-second premium, calming operating-system shutdown sound with a strong sonic identity. The same five-note signature melody played slowly on a soft, warm bell synth, descending gently to the home note, lush warm analog pad slowly closing its filter, a final soft crystal chime, long dissolving fade into silence. Deeply relaxing, reassuring, elegant, no beat, no vocals.",
  },
  {
    id: "jazz",
    label: "Jazz",
    description: "Swingujące trio na start / nastrojowa ballada na koniec dnia.",
    start:
      "Twenty-second upbeat, energizing jazz start-of-day jingle. A catchy, memorable five-note signature melody on bright acoustic piano with swing feel, walking upright bass, crisp ride cymbal swing pattern, Rhodes chord stabs, confident ii–V–I movement landing on a bright major ninth chord with a playful piano flourish. Feel-good morning cafe energy, no vocals.",
    close:
      "Twenty-second calming, relaxing late-night jazz ballad ending. The same memorable five-note signature melody played slowly and softly on felt piano, warm Rhodes major ninth chords, long gentle upright bass notes, soft brushes swirling, resolving tenderly to the home chord with a quiet piano chime, slow fade into silence. Cozy evening, intimate, no drums hits, no vocals.",
  },
  {
    id: "orchestral",
    label: "Orkiestra",
    description: "Filmowe otwarcie z waltornią i pizzicato / spokojne smyczki i harfa.",
    start:
      "Twenty-second uplifting, energizing cinematic orchestral opening. A heroic yet warm, instantly memorable five-note signature melody on French horn, driving pizzicato strings ostinato, soft timpani pulses, strings swelling with rising momentum to a radiant full-orchestra major chord with sparkling glockenspiel. Sunrise, optimism, fresh start, no vocals.",
    close:
      "Twenty-second calming, deeply relaxing cinematic orchestral ending. The same five-note signature melody played slowly and tenderly on solo cello, soft legato strings in warm major ninth harmony, gentle descending harp arpeggios, resolving peacefully to the home chord with a quiet glockenspiel chime, long fade into silence. Sunset, gratitude, rest, no percussion, no vocals.",
  },
];

export const STYLE_BY_ID = Object.fromEntries(STYLE_PRESETS.map((p) => [p.id, p])) as Record<StylePreset["id"], StylePreset>;

/** Default length of generated START/CLOSE sounds (the API allows 0.5–30 s). */
export const SOUND_DURATION = 20;

const NUMBER_WORDS: Record<number, string> = { 10: "Ten", 15: "Fifteen", 20: "Twenty", 25: "Twenty-five", 30: "Thirty" };

/** Keeps the length mentioned in the prompt in line with the requested duration. */
export function promptForDuration(prompt: string, seconds: number): string {
  const word = NUMBER_WORDS[seconds] ?? String(seconds);
  const replaced = prompt.replace(/^(Ten|Fifteen|Twenty|Twenty-five|Thirty|\d+)-second\b/i, `${word}-second`);
  if (replaced !== prompt || seconds <= 10) return replaced;
  return `${word}-second, slowly evolving. ${prompt}`;
}
export const SOUND_MODEL = "eleven_text_to_sound_v2";
export const DEFAULT_PROMPT_INFLUENCE = 0.5;
