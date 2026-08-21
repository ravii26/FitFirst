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

dotenv.config();

const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function main() {
  const app = Fastify({ logger: true });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: [
      process.env.KIOSK_URL ?? "http://localhost:5174",
      process.env.DASHBOARD_URL ?? "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(sensible);

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: "/uploads/",
  });

  // ── Prisma Decorator ────────────────────────────────────────────────────────
  app.decorate("prisma", prisma);

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(sessionsRoutes, { prefix: "/api" });
  await app.register(recommendationsRoutes, { prefix: "/api" });
  await app.register(purchaseEventsRoutes, { prefix: "/api" });
  await app.register(analyticsRoutes, { prefix: "/api" });
  await app.register(productsRoutes, { prefix: "/api" });
  await app.register(baselineRoutes, { prefix: "/api" });
  await app.register(uploadRoutes, { prefix: "/api" });

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
