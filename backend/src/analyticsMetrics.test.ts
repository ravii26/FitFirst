import { it, expect } from "vitest";
import { purchaseMetrics, baselineMetrics } from "./analyticsMetrics";
it("counts one conversion for a three-item session and groups spend by purchasing session", () => {
  const result = purchaseMetrics([100, 200, 300].map(amount => ({ sessionId: "s1", amount, wasRecommended: true })), 2);
  expect(result.purchasingSessions).toBe(1); expect(result.recommendedSessions).toBe(1);
  expect(result.recommendedPurchaseRate).toBe(0.5); expect(result.spendPerPurchasingSession).toBe(600);
});
it("weights daily baseline averages by transaction count", () => {
  const result = baselineMetrics([{ totalTransactions: 1, totalRevenue: 100, avgUnitsPerCustomer: 1 }, { totalTransactions: 9, totalRevenue: 2700, avgUnitsPerCustomer: 3 }]);
  expect(result.avgBasket).toBe(280); expect(result.avgUnits).toBe(2.8);
});
it("handles an empty reporting period", () => {
  expect(purchaseMetrics([], 0).recommendedPurchaseRate).toBe(0); expect(baselineMetrics([]).avgBasket).toBe(0);
});
