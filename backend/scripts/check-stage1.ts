import "dotenv/config";
/** Integration checks use an isolated, disposable PostgreSQL schema. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { PrismaClient } from "@prisma/client";
import { sessionsRoutes } from "../src/routes/sessions";
import { recommendationsRoutes } from "../src/routes/recommendations";
import { purchaseEventsRoutes } from "../src/routes/purchaseEvents";
import { productsRoutes } from "../src/routes/products";
import { analyticsRoutes } from "../src/routes/analytics";

dotenv.config();
async function main() {
  const baseUrl = process.env.DATABASE_URL;
  assert(baseUrl, "DATABASE_URL is required");
  const schema = `fitfirst_stage1_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new PrismaClient();
  const url = new URL(baseUrl); url.searchParams.set("schema", schema);
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const app = Fastify();
  try {
    execFileSync(process.execPath, [path.resolve("../node_modules/prisma/build/index.js"), "migrate", "deploy", "--schema", "prisma/schema.prisma"], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: "inherit" });
    await app.register(sensible); app.decorate("prisma", db);
    await app.register(sessionsRoutes); await app.register(recommendationsRoutes);
    await app.register(purchaseEventsRoutes); await app.register(productsRoutes); await app.register(analyticsRoutes);
    const p = await db.product.create({ data: { sku: "TEST-M", name: "Test kurta", category: "KURTA", gender: "WOMEN", colorFamily: "WARM_EARTH", pattern: "SOLID", fitType: "REGULAR", sizeRange: ["M"], price: 100, stockQty: 2 } });
    const input = { requestKey: randomUUID(), skinToneBucket: "WHEATISH", bodyShapeBucket: "RECTANGLE", gender: "WOMEN", sizeInput: "M", preferenceTags: ["KURTA"] };
    const starts = await Promise.all([1, 2].map(() => app.inject({ method: "POST", url: "/sessions", payload: input })));
    assert(starts.every(r => r.statusCode === 201), starts.map(r => r.body).join("\n"));
    assert.equal(starts[0].json().id, starts[1].json().id); assert.equal(await db.customerSession.count(), 1);
    const sessionId = starts[0].json().id;
    assert.equal((await app.inject({ url: `/sessions/${sessionId}` })).statusCode, 401);
    assert.equal((await app.inject({ url: `/sessions/${sessionId}/recommendations` })).statusCode, 401);
    const recs = await Promise.all([1, 2].map(() => app.inject({ url: `/sessions/${sessionId}/recommendations`, headers: { "x-kiosk-key": input.requestKey } })));
    assert(recs.every(r => r.statusCode === 200), recs.map(r => r.body).join("\n"));
    assert.deepEqual(recs[0].json(), recs[1].json()); assert.equal(await db.recommendation.count(), 1);
    await db.product.update({ where: { id: p.id }, data: { name: "Changed name" } });
    const refresh = await app.inject({ url: `/sessions/${sessionId}/recommendations`, headers: { "x-kiosk-key": input.requestKey } });
    assert.deepEqual(refresh.json(), recs[0].json(), "Recommendation snapshots must survive catalogue changes");
    const sale = { requestKey: randomUUID(), sessionId, productId: p.id, amount: 100, wasRecommended: false };
    const repeated = await Promise.all([1, 2].map(() => app.inject({ method: "POST", url: "/purchase-events", payload: sale })));
    assert.deepEqual(repeated.map(r => r.statusCode).sort(), [200, 201]);
    assert.equal(await db.purchaseEvent.count(), 1); assert.equal((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stockQty, 1);
    assert.equal(repeated[0].json().wasRecommended, true, "Attribution must be calculated by the server");
    assert.equal((await app.inject({ method: "POST", url: "/purchase-events", payload: { ...sale, amount: 999 } })).statusCode, 409);
    const competing = await Promise.all([1, 2].map(() => app.inject({ method: "POST", url: "/purchase-events", payload: { ...sale, requestKey: randomUUID() } })));
    assert.deepEqual(competing.map(r => r.statusCode).sort(), [201, 409]);
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stockQty, 0); assert.equal(await db.purchaseEvent.count(), 2);
    assert.equal((await app.inject({ method: "PATCH", url: `/products/${p.id}/stock`, payload: { stockQty: -1 } })).statusCode, 400);
    assert.equal((await app.inject({ method: "PATCH", url: `/products/${p.id}/stock`, payload: { stockQty: 1.5 } })).statusCode, 400);
    // Force the final insert to fail after stock is decremented: the transaction must roll back.
    await db.product.update({ where: { id: p.id }, data: { stockQty: 1 } });
    await db.$executeRawUnsafe('ALTER TABLE "PurchaseEvent" ADD CONSTRAINT "test_reject_amount" CHECK (amount <> 9999)');
    const rejected = await app.inject({ method: "POST", url: "/purchase-events", payload: { ...sale, requestKey: randomUUID(), amount: 9999 } });
    assert.equal(rejected.statusCode, 500); assert.equal((await db.product.findUniqueOrThrow({ where: { id: p.id } })).stockQty, 1);
    const summary = (await app.inject({ url: "/analytics/summary" })).json();
    assert.equal(summary.sessions.withPurchase, 1); assert.equal(summary.conversions.recommendedPurchaseRate, 1);
    assert.equal(summary.basketValue.kioskPeriod, 200); assert.equal(summary.basketValue.liftPct, null); assert.equal(summary.pilotVerdict, "INSUFFICIENT_DATA");
    console.log("Stage 1 PostgreSQL integration checks passed: migrations, session retry, snapshot consistency, access control, purchase retry, last-unit concurrency, rollback, stock validation and metrics.");
  } finally {
    await app.close(); await db.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
