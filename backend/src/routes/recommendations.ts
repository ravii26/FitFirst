import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { scoreProducts, explainScore, ScoringInput } from "../scoring/engine";

export async function recommendationsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // GET /api/sessions/:id/recommendations
  // Run scoring engine and return ranked recommendations.
  // Results are also persisted to DB for analytics.
  app.get<{ Params: { id: string } }>(
    "/sessions/:id/recommendations",
    async (request, reply) => {
      const session = await prisma.customerSession.findUnique({
        where: { id: request.params.id },
      });
      if (!session) return reply.notFound("Session not found");

      // Fetch all active, in-stock products
      const candidates = await prisma.product.findMany({
        where: { isActive: true, stockQty: { gt: 0 } },
      });

      const scoringInput: ScoringInput = {
        skinToneBucket: session.skinToneBucket,
        bodyShapeBucket: session.bodyShapeBucket,
        gender: session.gender,
        sizeInput: session.sizeInput,
        preferenceTags: session.preferenceTags,
      };

      const scored = scoreProducts(scoringInput, candidates);

      // Check if recommendations already exist for this session
      const existing = await prisma.recommendation.count({
        where: { sessionId: session.id },
      });

      // Persist recommendations (only on first call)
      if (existing === 0 && scored.length > 0) {
        await prisma.recommendation.createMany({
          data: scored.map((r) => ({
            sessionId: session.id,
            productId: r.productId,
            score: r.score,
            rank: r.rank,
          })),
        });
      }

      // Fetch full product details for the response
      const productMap = new Map(candidates.map((p) => [p.id, p]));

      const response = scored.map((r) => {
        const product = productMap.get(r.productId)!;
        return {
          rank: r.rank,
          score: r.score,
          scoreBreakdown: r.scoreBreakdown,
          reasons: explainScore(r),
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            category: product.category,
            gender: product.gender,
            colorFamily: product.colorFamily,
            pattern: product.pattern,
            fitType: product.fitType,
            price: product.price,
            imageUrl: product.imageUrl,
            stockQty: product.stockQty,
          },
        };
      });

      return { sessionId: session.id, count: response.length, recommendations: response };
    }
  );
}
