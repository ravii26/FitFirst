import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { scoreProducts, explainScore, ScoringInput } from "../scoring/engine";

function getAdjacentSizes(size: string): string[] {
  const normalized = size.toUpperCase().trim();
  
  // standard letter sizing mapping
  const letterSequence = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const letterIndex = letterSequence.indexOf(normalized);
  if (letterIndex !== -1) {
    const adjacent: string[] = [];
    if (letterIndex > 0) adjacent.push(letterSequence[letterIndex - 1]);
    if (letterIndex < letterSequence.length - 1) adjacent.push(letterSequence[letterIndex + 1]);
    return adjacent;
  }

  // numeric sizing mapping (e.g. 28, 30, 32 or 38, 40, 42)
  const numericVal = parseInt(normalized);
  if (!isNaN(numericVal)) {
    return [(numericVal - 2).toString(), (numericVal + 2).toString()];
  }

  // kids age-based sizing (e.g. 2Y, 4Y, 6Y)
  const kidsMatch = normalized.match(/^(\d+)(Y)?$/i);
  if (kidsMatch) {
    const age = parseInt(kidsMatch[1]);
    const suffix = kidsMatch[2] ? "Y" : "";
    if (age > 2) {
      return [`${age - 2}${suffix}`, `${age + 2}${suffix}`];
    }
    return [`${age + 2}${suffix}`];
  }

  return [];
}

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

      let scored = scoreProducts(scoringInput, candidates);
      let isSizeRelaxed = false;

      // Fallback 1: Relax size filter to adjacent sizes if 0 matches found in exact size
      if (scored.length === 0) {
        const selectedSizes = session.sizeInput.split(";").map(s => s.trim()).filter(Boolean);
        const adjacentSizes = new Set<string>();
        for (const sz of selectedSizes) {
          const adj = getAdjacentSizes(sz);
          for (const a of adj) adjacentSizes.add(a.toUpperCase().trim());
        }
        // Remove original selections from the adjacent matches
        for (const sz of selectedSizes) {
          adjacentSizes.delete(sz.toUpperCase().trim());
        }

        if (adjacentSizes.size > 0) {
          const allRelaxed: any[] = [];
          for (const adjSize of Array.from(adjacentSizes)) {
            const relaxedInput = { ...scoringInput, sizeInput: adjSize };
            const results = scoreProducts(relaxedInput, candidates);
            allRelaxed.push(...results);
          }

          // Sort and de-duplicate by product ID
          allRelaxed.sort((a, b) => b.score - a.score);
          const seen = new Set<string>();
          const uniqueRelaxed: any[] = [];
          for (const item of allRelaxed) {
            if (!seen.has(item.productId)) {
              seen.add(item.productId);
              uniqueRelaxed.push(item);
            }
          }

          scored = uniqueRelaxed.slice(0, 5).map((item, index) => ({
            ...item,
            rank: index + 1,
          }));
          isSizeRelaxed = true;
        }
      }

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
        
        // Find which size in the product's range matched (either exact or adjacent)
        const selectedSizes = session.sizeInput.split(";").map(s => s.toUpperCase().trim()).filter(Boolean);
        const exactMatch = product.sizeRange.find(
          (s) => selectedSizes.includes(s.toUpperCase().trim())
        );
        let sizeMatched = exactMatch || session.sizeInput;

        if (!exactMatch) {
          const adjacent = new Set<string>();
          for (const sz of selectedSizes) {
            getAdjacentSizes(sz).forEach((a) => adjacent.add(a.toUpperCase().trim()));
          }
          const foundAdj = product.sizeRange.find((s) =>
            adjacent.has(s.toUpperCase().trim())
          );
          if (foundAdj) sizeMatched = foundAdj;
        }

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
            sizeRange: product.sizeRange,
            sizeMatched, // returns the specific size that matched
          },
        };
      });

      return {
        sessionId: session.id,
        count: response.length,
        isSizeRelaxed,
        originalSize: session.sizeInput,
        recommendations: response,
      };
    }
  );
}
