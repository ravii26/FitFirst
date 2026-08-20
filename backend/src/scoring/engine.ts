/**
 * FitFirst Scoring Engine -- Phase 1 (Deterministic, No ML)
 *
 * Takes a customer session and a list of products, applies hard filters,
 * computes a composite fit score for each eligible product, and returns
 * a ranked list of recommendations.
 *
 * All weights and lookup tables are in tables.ts. Everything here is
 * deterministic and fully testable with no model calls.
 */

import {
  SkinToneBucket,
  BodyShapeBucket,
  ColorFamily,
  FitType,
  Category,
  Pattern,
  Gender,
} from "@prisma/client";

import {
  SKIN_TONE_COLOR_COMPAT,
  BODY_SHAPE_FIT_COMPAT,
  computeAgingBoost,
  MIN_FIT_SCORE_THRESHOLD,
  MAX_RECOMMENDATIONS,
} from "./tables";

// -- Types ------------------------------------------------------------------

export interface ScoringInput {
  skinToneBucket: SkinToneBucket;
  bodyShapeBucket: BodyShapeBucket;
  gender: Gender;
  sizeInput: string;
  preferenceTags: string[]; // e.g. ["KURTA", "CHECKS", "CASUAL"]
}

export interface ScoredProduct {
  productId: string;
  score: number;      // final score (0.0-1.1 range with aging)
  baseScore: number;  // score before aging boost (used for threshold check)
  rank: number;
  scoreBreakdown: {
    colorScore: number;
    fitScore: number;
    preferenceBoost: number;
    agingBoost: number;
  };
}

export interface ProductCandidate {
  id: string;
  category: Category;
  gender: Gender;
  colorFamily: ColorFamily;
  pattern: Pattern;
  fitType: FitType;
  sizeRange: string[];
  stockQty: number;
  daysInStock: number;
  isActive: boolean;
  price: number;
}

// -- Main Scoring Function --------------------------------------------------

/**
 * Score and rank products for a given customer session.
 * Returns up to MAX_RECOMMENDATIONS ranked recommendations.
 */
export function scoreProducts(
  session: ScoringInput,
  candidates: ProductCandidate[]
): ScoredProduct[] {
  const normalizedPrefs = session.preferenceTags.map((t) => t.toUpperCase());
  const normalizedSize = session.sizeInput.toUpperCase().trim();

  const scored: ScoredProduct[] = [];

  for (const product of candidates) {
    // Hard Filter 1: Active and in stock
    if (!product.isActive || product.stockQty <= 0) continue;

    // Hard Filter 2: Size match
    const sizeMatch = product.sizeRange.some(
      (s) => s.toUpperCase().trim() === normalizedSize
    );
    if (!sizeMatch) continue;

    // Hard Filter 3: Gender compatibility
    if (
      product.gender !== session.gender &&
      product.gender !== "UNISEX" &&
      session.gender !== "UNISEX"
    ) {
      continue;
    }

    // Color Score (40% weight)
    const colorScore =
      SKIN_TONE_COLOR_COMPAT[session.skinToneBucket][product.colorFamily] ?? 0.5;

    // Fit Score (40% weight)
    const fitScore =
      BODY_SHAPE_FIT_COMPAT[session.bodyShapeBucket][product.fitType] ?? 0.5;

    // Preference Boost (20% weight)
    const preferenceBoost = computePreferenceBoost(product, normalizedPrefs);

    // Base Score (before aging)
    const baseScore =
      colorScore * 0.40 +
      fitScore * 0.40 +
      preferenceBoost * 0.20;

    // Hard Gate: minimum base score -- aging boost CANNOT rescue a below-threshold product
    if (baseScore < MIN_FIT_SCORE_THRESHOLD) continue;

    // Aging Tiebreak Boost (max 10%, only for eligible products)
    const agingBoost = computeAgingBoost(product.daysInStock);

    const finalScore = baseScore + agingBoost;

    scored.push({
      productId: product.id,
      score: parseFloat(finalScore.toFixed(4)),
      baseScore: parseFloat(baseScore.toFixed(4)),
      rank: 0, // assigned after sorting
      scoreBreakdown: {
        colorScore: parseFloat(colorScore.toFixed(4)),
        fitScore: parseFloat(fitScore.toFixed(4)),
        preferenceBoost: parseFloat(preferenceBoost.toFixed(4)),
        agingBoost: parseFloat(agingBoost.toFixed(4)),
      },
    });
  }

  // Sort descending by final score, then assign ranks
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_RECOMMENDATIONS).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

// -- Preference Boost Calculator --------------------------------------------

/**
 * Returns 0.0-1.0 boost based on customer preference tag match.
 * Binary: 1.0 if any tag matches the product, 0.25 if none, 0.5 if no prefs given.
 */
function computePreferenceBoost(
  product: ProductCandidate,
  normalizedPrefs: string[]
): number {
  if (normalizedPrefs.length === 0) return 0.5; // neutral if no prefs

  const productSignals = [
    product.category.toString(),
    product.pattern.toString(),
    product.gender.toString(),
  ];

  for (const signal of productSignals) {
    if (normalizedPrefs.includes(signal)) return 1.0;
  }

  return 0.25; // no match -- de-weight slightly relative to neutral
}

// -- Score Explanation (for display) ----------------------------------------

/**
 * Returns human-readable reasons why a product was recommended.
 */
export function explainScore(scored: ScoredProduct): string[] {
  const reasons: string[] = [];
  const { colorScore, fitScore, preferenceBoost, agingBoost } = scored.scoreBreakdown;

  if (colorScore >= 0.90) reasons.push("Excellent colour match for your skin tone");
  else if (colorScore >= 0.75) reasons.push("Good colour match for your skin tone");

  if (fitScore >= 0.90) reasons.push("Cut and fit are very flattering for your body shape");
  else if (fitScore >= 0.75) reasons.push("Good fit for your body shape");

  if (preferenceBoost >= 0.9) reasons.push("Matches your stated style preference");

  if (agingBoost > 0.05) reasons.push("A fresh pick -- been in-store for a while, hasn't had its chance yet");

  if (reasons.length === 0) reasons.push("Solid all-round match");

  return reasons;
}
