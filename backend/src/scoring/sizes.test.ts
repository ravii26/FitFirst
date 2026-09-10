import { describe, it, expect } from "vitest";
import { normalizeSize, getAdjacentSizes, matchingSize } from "./sizes";
import { scoreProducts, ProductCandidate, ScoringInput } from "./engine";
import { SessionSchema } from "../routes/sessions";
const session: ScoringInput = { skinToneBucket: "WHEATISH", bodyShapeBucket: "RECTANGLE", gender: "WOMEN", sizeInput: "M", preferenceTags: [] };
const product: ProductCandidate = { id: "p", category: "KURTA", gender: "WOMEN", colorFamily: "WARM_EARTH", pattern: "SOLID", fitType: "REGULAR", sizeRange: ["M"], stockQty: 2, daysInStock: 0, price: 100, isActive: true };
describe("size and preference regressions", () => {
  it("normalizes XL aliases and keeps child sizes in their own scale", () => {
    expect(normalizeSize(" xxl ")).toBe("2XL"); expect(getAdjacentSizes("XL")).toEqual(["L", "2XL"]);
    expect(getAdjacentSizes("4Y")).toEqual(["2Y", "6Y"]); expect(getAdjacentSizes("2Y")).toEqual(["4Y"]);
    expect(getAdjacentSizes("40oops")).toEqual([]);
  });
  it("allows free-size items and respects selected categories", () => {
    expect(matchingSize(["FREE"], ["M"])).toBe("FREE");
    expect(scoreProducts({ ...session, preferenceTags: ["SAREE"] }, [{ ...product, category: "SAREE", sizeRange: ["FREE"] }, product])).toHaveLength(1);
    expect(scoreProducts({ ...session, sizeInput: "XXL" }, [{ ...product, sizeRange: ["2XL"] }])).toHaveLength(1);
  });
  it("accepts multiple selected sizes longer than ten characters", () => {
    expect(SessionSchema.safeParse({ ...session, requestKey: "00000000-0000-4000-8000-000000000001", sizeInput: "S;M;L;XL;2XL;3XL" }).success).toBe(true);
  });
  it("uses the visible colour preference in ranking", () => {
    const [result] = scoreProducts({ ...session, preferenceTags: ["BRIGHT_WARM"] }, [{ ...product, colorFamily: "BRIGHT_WARM" }]);
    expect(result.scoreBreakdown.preferenceBoost).toBe(1);
  });
});
