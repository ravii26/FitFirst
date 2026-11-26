import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
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
import { registerErrorHandling } from "./lib/errors";
import { ConfigError, loadConfig } from "./lib/config";
import { loggerOptions, registerRequestLogging, serverOptions } from "./lib/logger";

// Validate the whole environment before anything else starts. A bad value
// stops the boot here, naming the variable, rather than failing mid-request.
// A configuration problem is the operator's to fix, so it prints as a plain
// message with no stack trace: the fix is in the message, not in the code.
const config = (() => {
  try {
    return loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
})();

const prisma = new PrismaClient();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function main() {
  const app = Fastify({ ...serverOptions, logger: loggerOptions });
  registerRequestLogging(app);

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: [config.KIOSK_URL, config.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(sensible);
  registerErrorHandling(app);

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
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`FitFirst API running on port ${config.PORT}`);

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
