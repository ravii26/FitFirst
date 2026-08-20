/**
 * FitFirst Scoring Engine — Lookup Tables
 *
 * All compatibility data is deterministic and fully explainable.
 * Every table is independently tunable based on real conversion data
 * once pilot results are in.
 *
 * Scoring formula (§4.3):
 *   colorScore     × 0.40  (skin tone → color family compatibility)
 *   fitScore       × 0.40  (body shape → fit type compatibility)
 *   preferenceBoost × 0.20 (preference tag match)
 *   agingBoost     ≤ 0.10  (tiebreak only, among already-eligible products)
 *
 * Hard gate: rawScore must be ≥ 0.55 before a product is eligible.
 * Hard filter: size must be in product.sizeRange, stockQty > 0, isActive = true.
 */

import {
  SkinToneBucket,
  BodyShapeBucket,
  ColorFamily,
  FitType,
  Pattern,
  Category,
  Gender,
} from "@prisma/client";

// ─── Skin Tone → Color Family Compatibility ───────────────────────────────────
// Score: 1.0 = excellent / 0.75 = good / 0.50 = neutral / 0.25 = avoid
// Based on standard color theory for Indian skin tone undertones.

export const SKIN_TONE_COLOR_COMPAT: Record<
  SkinToneBucket,
  Record<ColorFamily, number>
> = {
  FAIR: {
    WHITE: 0.70,
    CREAM_IVORY: 0.80,
    LIGHT_PASTELS: 1.00,
    WARM_EARTH: 0.75,
    BRIGHT_WARM: 0.75,
    BRIGHT_COOL: 0.90,
    DARK_NEUTRAL: 0.85,
    JEWEL_TONES: 0.95,
    MULTICOLOR: 0.70,
  },
  WHEATISH: {
    WHITE: 0.85,
    CREAM_IVORY: 0.90,
    LIGHT_PASTELS: 0.75,
    WARM_EARTH: 1.00,
    BRIGHT_WARM: 1.00,
    BRIGHT_COOL: 0.85,
    DARK_NEUTRAL: 0.80,
    JEWEL_TONES: 0.95,
    MULTICOLOR: 0.75,
  },
  MEDIUM: {
    WHITE: 0.90,
    CREAM_IVORY: 0.85,
    LIGHT_PASTELS: 0.65,
    WARM_EARTH: 0.90,
    BRIGHT_WARM: 0.95,
    BRIGHT_COOL: 0.80,
    DARK_NEUTRAL: 0.85,
    JEWEL_TONES: 1.00,
    MULTICOLOR: 0.80,
  },
  DEEP: {
    WHITE: 1.00,
    CREAM_IVORY: 0.90,
    LIGHT_PASTELS: 0.60,
    WARM_EARTH: 0.80,
    BRIGHT_WARM: 1.00,
    BRIGHT_COOL: 0.85,
    DARK_NEUTRAL: 0.70,
    JEWEL_TONES: 1.00,
    MULTICOLOR: 0.85,
  },
};

// ─── Body Shape → Fit Type Compatibility ─────────────────────────────────────
// Score: 1.0 = flatters / 0.75 = works / 0.50 = neutral / 0.25 = avoid

export const BODY_SHAPE_FIT_COMPAT: Record<
  BodyShapeBucket,
  Record<FitType, number>
> = {
  RECTANGLE: {
    SLIM: 0.75,
    REGULAR: 1.00,
    RELAXED_LOOSE: 0.80,
    FLARED_ANARKALI: 0.90,
    STRAIGHT_CUT: 0.85,
    A_LINE: 0.90,
    WRAPAROUND: 0.80,
    TAILORED_STRUCTURED: 1.00,
  },
  TRIANGLE: {
    // Pear shape — balance hips with volume on top
    SLIM: 0.60,
    REGULAR: 0.80,
    RELAXED_LOOSE: 0.90,
    FLARED_ANARKALI: 0.70,
    STRAIGHT_CUT: 0.75,
    A_LINE: 0.50,
    WRAPAROUND: 1.00,
    TAILORED_STRUCTURED: 0.85,
  },
  INVERTED_T: {
    // Broad shoulders — balance with volume below
    SLIM: 0.70,
    REGULAR: 0.85,
    RELAXED_LOOSE: 0.90,
    FLARED_ANARKALI: 1.00,
    STRAIGHT_CUT: 0.80,
    A_LINE: 1.00,
    WRAPAROUND: 0.75,
    TAILORED_STRUCTURED: 0.65,
  },
  HOURGLASS: {
    // Defined waist — show it off
    SLIM: 0.90,
    REGULAR: 1.00,
    RELAXED_LOOSE: 0.60,
    FLARED_ANARKALI: 1.00,
    STRAIGHT_CUT: 0.70,
    A_LINE: 0.95,
    WRAPAROUND: 1.00,
    TAILORED_STRUCTURED: 1.00,
  },
};

// ─── Category → Pattern Affinity ─────────────────────────────────────────────
// Some patterns look better on certain garment types.
// Used as a soft modifier only (max ±0.05 on final score).

export const CATEGORY_PATTERN_AFFINITY: Partial<
  Record<Category, Partial<Record<Pattern, number>>>
> = {
  SAREE: {
    FLORAL: 1.0,
    PAISLEY: 1.0,
    EMBROIDERED: 1.0,
    BLOCK_PRINT: 1.0,
    GEOMETRIC: 0.8,
    SOLID: 0.7,
  },
  KURTA: {
    EMBROIDERED: 1.0,
    BLOCK_PRINT: 1.0,
    SOLID: 1.0,
    CHECKS: 0.9,
    FLORAL: 0.8,
  },
  SHIRT: {
    CHECKS: 1.0,
    STRIPES: 1.0,
    SOLID: 1.0,
    GEOMETRIC: 0.8,
  },
  LEHENGA: {
    EMBROIDERED: 1.0,
    FLORAL: 1.0,
    PAISLEY: 0.9,
    SOLID: 0.8,
  },
  SHERWANI: {
    EMBROIDERED: 1.0,
    SOLID: 1.0,
    PAISLEY: 0.8,
  },
};

// ─── Aging Boost Calculation ──────────────────────────────────────────────────
// Max boost of 0.10, applied only to products that already cleared the 0.55 threshold.
// Linear: 0 → 0.10 as daysInStock goes from 0 → 90.
// Never pushes a borderline product above threshold.

export const MAX_AGING_BOOST = 0.10;
export const AGING_BOOST_RAMP_DAYS = 90;

export function computeAgingBoost(daysInStock: number): number {
  const clamped = Math.min(daysInStock, AGING_BOOST_RAMP_DAYS);
  return (clamped / AGING_BOOST_RAMP_DAYS) * MAX_AGING_BOOST;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MIN_FIT_SCORE_THRESHOLD = 0.55;
export const MAX_RECOMMENDATIONS = 8;

