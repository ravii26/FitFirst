import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const SessionSchema = z.object({
  skinToneBucket: z.enum(["FAIR", "WHEATISH", "MEDIUM", "DEEP"]).default("WHEATISH"),
  bodyShapeBucket: z.enum(["RECTANGLE", "TRIANGLE", "INVERTED_T", "HOURGLASS"]).default("HOURGLASS"),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]).default("WOMEN"),
  sizeInput: z.string().min(1).max(10).default("M"),
  preferenceTags: z.array(z.string()).default([]),
});

export async function sessionsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // POST /api/sessions — create a new customer session
  app.post("/sessions", async (request, reply) => {
    const result = SessionSchema.safeParse(request.body);
    if (!result.success) {
      return reply.badRequest(result.error.message);
    }
    const session = await prisma.customerSession.create({
      data: result.data as any,
    });
    return reply.code(201).send(session);
  });

  // GET /api/sessions/:id — get session details
  app.get<{ Params: { id: string } }>("/sessions/:id", async (request, reply) => {
    const session = await prisma.customerSession.findUnique({
      where: { id: request.params.id },
      include: {
        recommendations: { include: { product: true }, orderBy: { rank: "asc" } },
        purchaseEvents: { include: { product: true } },
      },
    });
    if (!session) return reply.notFound("Session not found");
    return session;
  });

  // GET /api/sessions — list recent sessions (staff dashboard)
  app.get("/sessions", async (request, reply) => {
    const sessions = await prisma.customerSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        recommendations: {
          orderBy: { rank: "asc" },
          select: {
            rank: true,
            score: true,
            productId: true,
            product: {
              select: { name: true, sku: true, price: true },
            },
          },
        },
        purchaseEvents: {
          select: { wasRecommended: true, amount: true, productId: true },
        },
      },
    });
    return sessions;
  });
}

