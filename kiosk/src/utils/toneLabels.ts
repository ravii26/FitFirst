import type { SkinToneBucket } from "./visionAnalyzer";

// Shopper-facing skin-tone labels are neutral numbers (DEC-24). The internal
// codes stay unchanged for the API and scoring, but must never be shown:
// every screen that names a tone reads it from here.
export const SKIN_TONE_LABEL: Record<SkinToneBucket, string> = {
  FAIR: "Tone 1",
  WHEATISH: "Tone 2",
  MEDIUM: "Tone 3",
  DEEP: "Tone 4",
};
