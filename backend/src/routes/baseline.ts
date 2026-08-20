import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const BaselineSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  totalTransactions: z.number().int().positive(),
  totalRevenue: z.number().int().positive(),
  avgUnitsPerCustomer: z.number().positive(),
  isKioskActive: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function baselineRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // POST /api/baseline — log a daily sales entry (staff manual entry)
  app.post("/baseline", async (request, reply) => {
    const result = BaselineSchema.safeParse(request.body);
    if (!result.success) return reply.badRequest(result.error.message);

    const { date, totalTransactions, totalRevenue, avgUnitsPerCustomer, isKioskActive, notes } =
      result.data;

    const parsedDate = new Date(date);
    const avgBasketValue = totalRevenue / totalTransactions;

    const entry = await prisma.dailyBaseline.upsert({
      where: { date: parsedDate },
      update: { totalTransactions, totalRevenue, avgBasketValue, avgUnitsPerCustomer, isKioskActive, notes },
      create: { date: parsedDate, totalTransactions, totalRevenue, avgBasketValue, avgUnitsPerCustomer, isKioskActive, notes },
    });

    return reply.code(201).send(entry);
  });

  // GET /api/baseline — list all baseline entries
  app.get("/baseline", async () => {
    return prisma.dailyBaseline.findMany({ orderBy: { date: "asc" } });
  });

  // GET /api/baseline/kill-threshold — current kill threshold
  app.get("/baseline/kill-threshold", async () => {
    return prisma.killThreshold.findFirst({ orderBy: { createdAt: "desc" } });
  });
}

