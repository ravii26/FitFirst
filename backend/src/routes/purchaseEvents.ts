import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const PurchaseEventSchema = z.object({
  sessionId: z.string(),
  productId: z.string(),
  wasRecommended: z.boolean(),
  amount: z.number().int().positive(),
  staffId: z.string().optional(),
});

export async function purchaseEventsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // POST /api/purchase-events — log a purchase
  app.post("/purchase-events", async (request, reply) => {
    const result = PurchaseEventSchema.safeParse(request.body);
    if (!result.success) return reply.badRequest(result.error.message);

    const { sessionId, productId, wasRecommended, amount, staffId } =
      result.data;

    // Verify session exists
    const session = await prisma.customerSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return reply.notFound("Session not found");

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return reply.notFound("Product not found");

    const event = await prisma.purchaseEvent.create({
      data: { sessionId, productId, wasRecommended, amount, staffId },
    });

    // Decrement stock
    await prisma.product.update({
      where: { id: productId },
      data: { stockQty: { decrement: 1 } },
    });

    return reply.code(201).send(event);
  });

  // GET /api/purchase-events — recent purchase events (for staff dashboard)
  app.get("/purchase-events", async (request, reply) => {
    const events = await prisma.purchaseEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        product: { select: { name: true, sku: true, category: true, price: true } },
        session: { select: { skinToneBucket: true, bodyShapeBucket: true, gender: true } },
      },
    });
    return events;
  });
}

