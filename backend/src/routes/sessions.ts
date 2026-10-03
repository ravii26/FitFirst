import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";
import { requireStaffSession } from "../authGuard";

export const SessionSchema = z.object({
  requestKey: z.string().uuid(),
  skinToneBucket: z.enum(["FAIR", "WHEATISH", "MEDIUM", "DEEP"]).default("WHEATISH"),
  bodyShapeBucket: z.enum(["RECTANGLE", "TRIANGLE", "INVERTED_T", "HOURGLASS"]).default("HOURGLASS"),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]).default("WOMEN"),
  sizeInput: z.string().min(1).max(100).default("M"),
  preferenceTags: z.array(z.string().max(40)).max(30).default([]),
});

const ANSWER_FIELDS = ["skinToneBucket", "bodyShapeBucket", "gender", "sizeInput", "preferenceTags"] as const;

export async function sessionsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // POST /api/sessions — create a new customer session
  app.post("/sessions", async (request, reply) => {
    const result = SessionSchema.safeParse(request.body);
    if (!result.success) {
      return reply.badRequest(result.error.message);
    }
    // upsert is read-then-write, so two concurrent calls with the same requestKey
    // can both attempt the insert. The loser hits the unique index; since requestKey
    // is an idempotency key, that means the row we wanted already exists — read it.
    let session;
    try {
      session = await prisma.customerSession.upsert({
        where: { requestKey: result.data.requestKey }, update: {}, create: result.data,
      });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
      session = await prisma.customerSession.findUniqueOrThrow({
        where: { requestKey: result.data.requestKey },
      });
    }
    if (ANSWER_FIELDS.some(field => JSON.stringify(session[field]) !== JSON.stringify(result.data[field]))) return reply.conflict("Start a new request after changing your answers");
    return reply.code(201).send({ id: session.id });
  });

  // PUT /api/sessions/:id/answers — "Edit preferences" on the kiosk. Replaces the
  // answers on the same session (same handoff code) and clears its recommendations
  // so the next fetch recalculates them, instead of leaving a stale second session.
  app.put<{ Params: { id: string } }>("/sessions/:id/answers", async (request, reply) => {
    const result = SessionSchema.omit({ requestKey: true }).safeParse(request.body);
    if (!result.success) return reply.badRequest(result.error.message);
    const authorized = await prisma.customerSession.findUnique({ where: { id: request.params.id } });
    if (!authorized) return reply.notFound("Session not found");
    if (!authorized.requestKey || request.headers["x-kiosk-key"] !== authorized.requestKey) return reply.unauthorized("This kiosk session is unavailable. Please start again.");
    // Same lock as the recommendations route, so a snapshot cannot be written from the old answers.
    return prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${request.params.id}))`;
      // Unchanged answers are a no-op, so a retried or duplicated request cannot wipe
      // recommendations that were already recalculated from them.
      const current = await tx.customerSession.findUniqueOrThrow({ where: { id: request.params.id } });
      if (ANSWER_FIELDS.every(field => JSON.stringify(current[field]) === JSON.stringify(result.data[field]))) return { id: current.id };
      if (await tx.purchaseEvent.count({ where: { sessionId: request.params.id } })) return reply.conflict("A purchase is already recorded for this visit. Please start again.");
      await tx.recommendation.deleteMany({ where: { sessionId: request.params.id } });
      await tx.customerSession.update({ where: { id: request.params.id }, data: { ...result.data, recommendationSnapshot: Prisma.DbNull } });
      return { id: request.params.id };
    });
  });

  // GET /api/sessions/:id — get session details
  app.get<{ Params: { id: string } }>("/sessions/:id", { preHandler: requireStaffSession }, async (request, reply) => {
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
  app.get("/sessions", { preHandler: requireStaffSession }, async (request, reply) => {
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

