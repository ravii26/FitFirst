import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { sessionsRoutes } from "./routes/sessions";
import { recommendationsRoutes } from "./routes/recommendations";
import { purchaseEventsRoutes } from "./routes/purchaseEvents";
import { analyticsRoutes } from "./routes/analytics";
import { productsRoutes } from "./routes/products";
import { baselineRoutes } from "./routes/baseline";
import { uploadRoutes } from "./routes/upload";
import { scanGarmentRoutes } from "./routes/scanGarment";
import { requireStaffSession, authRoutes } from "./authGuard";

dotenv.config();

const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function main() {
  const app = Fastify({ logger: { redact: ["req.headers.cookie", "req.headers.authorization"] } });
  if (!/^\d{4}$/.test(process.env.DASHBOARD_PIN ?? "")) throw new Error("Configure a four-digit DASHBOARD_PIN on the backend");

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: [
      process.env.KIOSK_URL ?? "http://localhost:5174",
      process.env.DASHBOARD_URL ?? "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(sensible);
  app.setErrorHandler((error: any, request, reply) => {
    if (error.code === "P2002") return reply.code(409).send({ message: "This record already exists. Please check the SKU or request." });
    if (error.code === "P2025") return reply.code(404).send({ message: "Record not found" });
    if (error.code === "P2003") return reply.code(400).send({ message: "Related record not found" });
    request.log.error(error);
    return reply.code(error.statusCode ?? 500).send({ message: error.statusCode && error.statusCode < 500 ? error.message : "Unable to complete the request. Please try again." });
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: "/uploads/",
  });

  // ── Prisma Decorator ────────────────────────────────────────────────────────
  app.decorate("prisma", prisma);

  await app.register(authRoutes, { prefix: "/api" });

  // ── Routes ────────────────────────────────────────────────────────────────
  // Kiosk-facing: no auth (unattended customer devices can't hold a PIN).
  await app.register(sessionsRoutes, { prefix: "/api" });
  await app.register(recommendationsRoutes, { prefix: "/api" });

  // Staff-facing: require a valid server-issued staff session.
  await app.register(
    async (staffApp) => {
      staffApp.addHook("preHandler", requireStaffSession);
      await staffApp.register(purchaseEventsRoutes);
      await staffApp.register(analyticsRoutes);
      await staffApp.register(productsRoutes);
      await staffApp.register(baselineRoutes);
      await staffApp.register(uploadRoutes);
      await staffApp.register(scanGarmentRoutes);
    },
    { prefix: "/api" }
  );

  // ── Health Check ────────────────────────────────────────────────────────────
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // ── Start ──────────────────────────────────────────────────────────────────
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`FitFirst API running on port ${PORT}`);

  // Graceful shutdown
  const shutdown = async () => {
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
