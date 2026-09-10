import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

export const PurchaseEventSchema = z.object({
  requestKey: z.string().uuid(),
  sessionId: z.string().min(1),
  productId: z.string().min(1),
  amount: z.number().int().positive().max(2147483647),
});

export async function purchaseEventsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;
  app.post("/purchase-events", async (request, reply) => {
    const result = PurchaseEventSchema.safeParse(request.body);
    if (!result.success) return reply.badRequest(result.error.message);
    const { requestKey, sessionId, productId, amount } = result.data;
    try {
      const result = await prisma.$transaction(async tx => {
        // Serialise identical requests before checking their stored outcome.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${requestKey}))`;
        const existing = await tx.purchaseEvent.findUnique({ where: { requestKey } });
        if (existing) {
          if (existing.sessionId !== sessionId || existing.productId !== productId || existing.amount !== amount) throw app.httpErrors.conflict("This request was already used for a different purchase");
          return { event: existing, replay: true };
        }
        if (!await tx.customerSession.findUnique({ where: { id: sessionId } })) throw app.httpErrors.notFound("Session not found");
        const changed = await tx.product.updateMany({ where: { id: productId, isActive: true, stockQty: { gt: 0 } }, data: { stockQty: { decrement: 1 } } });
        if (changed.count !== 1) throw app.httpErrors.conflict("This item is no longer available. Refresh the catalogue and choose another item.");
        const wasRecommended = await tx.recommendation.count({ where: { sessionId, productId } }) > 0;
        const event = await tx.purchaseEvent.create({ data: { requestKey, sessionId, productId, amount, wasRecommended } });
        return { event, replay: false };
      });
      return reply.code(result.replay ? 200 : 201).send(result.event);
    } catch (error) { throw error; }
  });
  app.get("/purchase-events", async () => prisma.purchaseEvent.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    include: { product: { select: { name: true, sku: true, category: true, price: true } }, session: { select: { skinToneBucket: true, bodyShapeBucket: true, gender: true } } },
  }));
}
