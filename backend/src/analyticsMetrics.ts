export function purchaseMetrics(events: { sessionId: string; amount: number; wasRecommended: boolean }[], totalSessions: number) {
  const purchasingSessions = new Set(events.map(e => e.sessionId)).size;
  const recommendedSessions = new Set(events.filter(e => e.wasRecommended).map(e => e.sessionId)).size;
  const totalRevenue = events.reduce((sum, e) => sum + e.amount, 0);
  return {
    purchasingSessions, recommendedSessions, totalRevenue,
    recommendedRevenue: events.filter(e => e.wasRecommended).reduce((sum, e) => sum + e.amount, 0),
    recommendedPurchaseRate: totalSessions ? recommendedSessions / totalSessions : 0,
    spendPerPurchasingSession: purchasingSessions ? totalRevenue / purchasingSessions : 0,
  };
}
export function baselineMetrics(days: { totalTransactions: number; totalRevenue: number; avgUnitsPerCustomer: number }[]) {
  const transactions = days.reduce((sum, d) => sum + d.totalTransactions, 0);
  return {
    avgBasket: transactions ? days.reduce((sum, d) => sum + d.totalRevenue, 0) / transactions : 0,
    avgUnits: transactions ? days.reduce((sum, d) => sum + d.avgUnitsPerCustomer * d.totalTransactions, 0) / transactions : 0,
  };
}
