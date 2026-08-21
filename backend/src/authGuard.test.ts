import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { requireDashboardPin } from "./authGuard";

async function buildApp() {
  const app = Fastify();
  await app.register(sensible);
  app.get("/protected", { preHandler: requireDashboardPin }, async () => ({ ok: true }));
  return app;
}

describe("requireDashboardPin", () => {
  const originalPin = process.env.DASHBOARD_PIN;

  beforeEach(() => {
    process.env.DASHBOARD_PIN = "1234";
  });

  afterEach(() => {
    process.env.DASHBOARD_PIN = originalPin;
  });

  it("rejects a request with no PIN header", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/protected" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects a request with the wrong PIN", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { "x-dashboard-pin": "0000" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("allows a request with the correct PIN", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { "x-dashboard-pin": "1234" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("rejects every request when DASHBOARD_PIN is unset (fail closed, not open)", async () => {
    delete process.env.DASHBOARD_PIN;
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { "x-dashboard-pin": "1234" },
    });
    expect(res.statusCode).toBe(401);
  });
});
