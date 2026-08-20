import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

export async function analyticsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // GET /api/analytics/summary — main dashboard metrics
  app.get("/analytics/summary", async (_request, reply) => {
    const [
      totalSessions,
      totalPurchaseEvents,
      allPurchaseEvents,
      allRecommendations,
      baselines,
      killThreshold,
    ] = await Promise.all([
      prisma.customerSession.count(),
      prisma.purchaseEvent.count(),
      prisma.purchaseEvent.findMany({ select: { wasRecommended: true, amount: true } }),
      prisma.recommendation.count(),
      prisma.dailyBaseline.findMany({ orderBy: { date: "asc" } }),
      prisma.killThreshold.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

    const recommendedPurchases = allPurchaseEvents.filter((e) => e.wasRecommended);
    const totalRevenue = allPurchaseEvents.reduce((sum, e) => sum + e.amount, 0);
    const recommendedRevenue = recommendedPurchases.reduce((sum, e) => sum + e.amount, 0);

    // Recommended purchase rate: recommended purchases / total sessions
    const recommendedPurchaseRate =
      totalSessions > 0 ? recommendedPurchases.length / totalSessions : 0;

    // Avg basket value during kiosk period
    const kioskAvgBasket =
      totalPurchaseEvents > 0 ? totalRevenue / totalPurchaseEvents : 0;

    // Baseline averages (pre-kiosk days)
    const preKioskDays = baselines.filter((b) => !b.isKioskActive);
    const baselineAvgBasket =
      preKioskDays.length > 0
        ? preKioskDays.reduce((s, b) => s + b.avgBasketValue, 0) / preKioskDays.length
        : 0;

    const baselineAvgUnits =
      preKioskDays.length > 0
        ? preKioskDays.reduce((s, b) => s + b.avgUnitsPerCustomer, 0) / preKioskDays.length
        : 0;

    // Basket value lift %
    const basketValueLiftPct =
      baselineAvgBasket > 0
        ? ((kioskAvgBasket - baselineAvgBasket) / baselineAvgBasket) * 100
        : null;

    // Pilot verdict against kill threshold
    let pilotVerdict: "PASSING" | "FAILING" | "INSUFFICIENT_DATA" | null = null;
    if (killThreshold && totalSessions >= 20) {
      const passing =
        (basketValueLiftPct ?? 0) >= killThreshold.minBasketValueLiftPct &&
        recommendedPurchaseRate >= killThreshold.minRecommendedPurchaseRate;
      pilotVerdict = passing ? "PASSING" : "FAILING";
    } else if (totalSessions > 0) {
      pilotVerdict = "INSUFFICIENT_DATA";
    }

    return {
      sessions: {
        total: totalSessions,
        withPurchase: totalPurchaseEvents > 0 ? totalPurchaseEvents : 0,
      },
      conversions: {
        totalPurchases: totalPurchaseEvents,
        recommendedPurchases: recommendedPurchases.length,
        recommendedPurchaseRate: parseFloat(recommendedPurchaseRate.toFixed(4)),
        totalRevenue,
        recommendedRevenue,
      },
      basketValue: {
        kioskPeriod: parseFloat(kioskAvgBasket.toFixed(2)),
        baseline: parseFloat(baselineAvgBasket.toFixed(2)),
        liftPct: basketValueLiftPct !== null ? parseFloat(basketValueLiftPct.toFixed(2)) : null,
      },
      baseline: {
        avgUnitsPerCustomer: parseFloat(baselineAvgUnits.toFixed(2)),
        daysLogged: preKioskDays.length,
      },
      recommendations: {
        total: allRecommendations,
      },
      killThreshold: killThreshold
        ? {
            minBasketValueLiftPct: killThreshold.minBasketValueLiftPct,
            minRecommendedPurchaseRate: killThreshold.minRecommendedPurchaseRate,
            minUsageRatePct: killThreshold.minUsageRatePct,
            pilotWeeks: killThreshold.pilotWeeks,
            lockedAt: killThreshold.lockedAt,
          }
        : null,
      pilotVerdict,
    };
  });

  // GET /api/analytics/baseline-chart — daily baseline data for charts
  app.get("/analytics/baseline-chart", async () => {
    const data = await prisma.dailyBaseline.findMany({
      orderBy: { date: "asc" },
      select: {
        date: true,
        totalTransactions: true,
        totalRevenue: true,
        avgBasketValue: true,
        avgUnitsPerCustomer: true,
        isKioskActive: true,
      },
    });
    return data;
  });

  // GET /api/analytics/top-recommendations — which products are recommended most
  app.get("/analytics/top-recommendations", async () => {
    const data = await prisma.recommendation.groupBy({
      by: ["productId"],
      _count: { productId: true },
      _avg: { score: true, rank: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    });

    const productIds = data.map((d) => d.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, category: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return data.map((d) => ({
      product: productMap.get(d.productId),
      timesRecommended: d._count.productId,
      avgScore: parseFloat((d._avg.score ?? 0).toFixed(4)),
      avgRank: parseFloat((d._avg.rank ?? 0).toFixed(1)),
    }));
  });

  // GET /api/analytics/slow-stock — items with highest daysInStock that are recommended
  app.get("/analytics/slow-stock", async () => {
    return prisma.product.findMany({
      where: { isActive: true, stockQty: { gt: 0 }, daysInStock: { gt: 30 } },
      orderBy: { daysInStock: "desc" },
      take: 20,
      select: {
        id: true, sku: true, name: true, category: true,
        daysInStock: true, stockQty: true, price: true,
        colorFamily: true, fitType: true,
        _count: { select: { recommendations: true, purchaseEvents: true } },
      },
    });
  });
}

