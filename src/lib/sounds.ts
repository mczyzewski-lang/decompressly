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
    description: "Wiatr, woda, organiczne dźwięki.",
    start:
      "Ten-second calm nature opening sound. Soft breeze rising through tall grass, a gentle stream of water, three delicate ascending wooden kalimba notes, warm morning air, organic and spacious, no percussion, no vocals, no birds screeching, gentle natural ending.",
    close:
      "Ten-second calm nature closing sound. Soft evening breeze settling down, slow gentle stream of water, three delicate descending wooden kalimba notes, warm and peaceful, organic and spacious, no percussion, no vocals, slow fade into quiet silence.",
  },
  {
    id: "system",
    label: "System",
    description: "Subtelny, futurystyczny operating system.",
    start:
      "Ten-second premium minimalist operating system startup sound. Warm analog synthesizer, delicate ascending three-note motif, soft airy texture, elegant, calm, reassuring, no percussion, no vocals, gentle ending.",
    close:
      "Ten-second premium minimalist operating system shutdown sound. Warm analog synthesizer, gently descending three-note motif, softly dissolving digital texture, deeply peaceful, no percussion, no vocals, slow fade into silence.",
  },
  {
    id: "jazz",
    label: "Jazz",
    description: "Ciepłe pianino, kontrabas, miękkie akordy.",
    start:
      "Ten-second warm jazz opening sting. Soft felt piano playing an ascending three-note motif over a gentle major seventh chord, warm upright double bass pluck, brushed cymbal shimmer barely audible, relaxed late-morning cafe feeling, no vocals, smooth gentle ending.",
    close:
      "Ten-second warm jazz closing sting. Soft felt piano playing a descending three-note motif resolving onto a gentle major ninth chord, warm upright double bass holding the root, relaxed evening feeling, no drums, no vocals, slow fade into silence.",
  },
  {
    id: "orchestral",
    label: "Orkiestra",
    description: "Delikatne smyczki, pianino i subtelne frazy.",
    start:
      "Ten-second gentle orchestral opening. Soft legato strings swelling slowly, solo piano playing a hopeful ascending three-note phrase, warm and cinematic but understated, calm sunrise feeling, no percussion, no brass, no vocals, gentle ending.",
    close:
      "Ten-second gentle orchestral closing. Soft legato strings settling into a warm sustained chord, solo piano playing a tender descending three-note phrase, peaceful and understated, sunset feeling, no percussion, no brass, no vocals, slow fade into silence.",
  },
];

export const STYLE_BY_ID = Object.fromEntries(STYLE_PRESETS.map((p) => [p.id, p])) as Record<StylePreset["id"], StylePreset>;

export const SOUND_DURATION = 10;
export const SOUND_MODEL = "eleven_text_to_sound_v2";
export const DEFAULT_PROMPT_INFLUENCE = 0.5;
