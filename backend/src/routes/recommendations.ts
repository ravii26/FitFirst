import { FastifyInstance } from "fastify";
import { PrismaClient, Prisma } from "@prisma/client";
import { scoreProducts, explainScore } from "../scoring/engine";
import { getAdjacentSizes, matchingSize, selectedSizes } from "../scoring/sizes";

export async function recommendationsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;
  app.get<{ Params: { id: string } }>("/sessions/:id/recommendations", async (request, reply) => {
    const authorized = await prisma.customerSession.findUnique({ where: { id: request.params.id } });
    if (!authorized) return reply.notFound("Session not found");
    if (!authorized.requestKey || request.headers["x-kiosk-key"] !== authorized.requestKey) return reply.unauthorized("This kiosk session is unavailable. Please start again.");
    return prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${request.params.id}))`;
      const session = await tx.customerSession.findUniqueOrThrow({ where: { id: request.params.id } });
      if (session.recommendationSnapshot) return session.recommendationSnapshot;
      const candidates = await tx.product.findMany({ where: { isActive: true, stockQty: { gt: 0 } }, orderBy: { id: "asc" } });
      const sizes = selectedSizes(session.sizeInput);
      let scored = scoreProducts(session, candidates);
      let isSizeRelaxed = false;
      const adjacent = [...new Set(sizes.flatMap(getAdjacentSizes))].filter(s => !sizes.includes(s));
      if (!scored.length && adjacent.length) {
        scored = scoreProducts({ ...session, sizeInput: adjacent.join(";") }, candidates);
        isSizeRelaxed = scored.length > 0;
      }
      const recommendations = scored.map(r => {
        const p = candidates.find(p => p.id === r.productId)!;
        return {
          rank: r.rank, score: r.score, scoreBreakdown: r.scoreBreakdown, reasons: explainScore(r),
          product: { id: p.id, sku: p.sku, name: p.name, description: p.description, category: p.category, gender: p.gender,
            colorFamily: p.colorFamily, pattern: p.pattern, fitType: p.fitType, price: p.price, imageUrl: p.imageUrl,
            stockQty: p.stockQty, sizeRange: p.sizeRange, sizeMatched: matchingSize(p.sizeRange, isSizeRelaxed ? adjacent : sizes) },
        };
      });
      const snapshot = { sessionId: session.id, count: recommendations.length, isSizeRelaxed, originalSize: session.sizeInput, generatedAt: new Date().toISOString(), recommendations };
      await tx.recommendation.createMany({ data: scored.map(r => ({ sessionId: session.id, productId: r.productId, rank: r.rank, score: r.score })) });
      await tx.customerSession.update({ where: { id: session.id }, data: { recommendationSnapshot: snapshot as unknown as Prisma.InputJsonValue } });
      return snapshot;
    });
  });
}
