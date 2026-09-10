import { describe, it, expect, afterEach } from "vitest";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { authRoutes, requireStaffSession, hashToken } from "./authGuard";
const original = process.env.DASHBOARD_PIN;
const apps: ReturnType<typeof Fastify>[] = [];
afterEach(async () => { if (original === undefined) delete process.env.DASHBOARD_PIN; else process.env.DASHBOARD_PIN = original; await Promise.all(apps.splice(0).map(app => app.close())); });
async function buildApp() {
  process.env.DASHBOARD_PIN = "5678";
  const sessions = new Map<string, { tokenHash: string; expiresAt: Date }>();
  const app = Fastify(); apps.push(app);
  await app.register(sensible);
  app.decorate("prisma", { staffSession: {
    findUnique: async ({ where }: any) => sessions.get(where.tokenHash),
    create: async ({ data }: any) => { sessions.set(data.tokenHash, data); return data; },
    deleteMany: async ({ where }: any) => { for (const [key, value] of sessions) if (key === where.tokenHash || (where.expiresAt && value.expiresAt <= where.expiresAt.lte)) sessions.delete(key); },
  } });
  await app.register(authRoutes);
  app.get("/protected", { preHandler: requireStaffSession }, async () => ({ ok: true }));
  app.post("/protected", { preHandler: requireStaffSession }, async () => ({ ok: true }));
  return { app, sessions };
}
describe("staff authentication", () => {
  it("rejects the old PIN header without a session", async () => {
    const { app } = await buildApp();
    expect((await app.inject({ url: "/protected", headers: { "x-dashboard-pin": "5678" } })).statusCode).toBe(401);
  });
  it("validates login server-side, uses an HttpOnly cookie, and revokes it on logout", async () => {
    const { app, sessions } = await buildApp();
    const login = await app.inject({ method: "POST", url: "/auth/login", headers: { "x-fitfirst-request": "1" }, payload: { pin: "5678" } });
    expect(login.statusCode).toBe(200);
    const setCookie = String(login.headers["set-cookie"]);
    expect(setCookie).toContain("HttpOnly"); expect(setCookie).toContain("SameSite=Strict");
    const cookie = setCookie.split(";")[0];
    expect([...sessions.keys()][0]).toBe(hashToken(cookie.split("=")[1]));
    expect((await app.inject({ url: "/protected", headers: { cookie } })).statusCode).toBe(200);
    expect((await app.inject({ method: "POST", url: "/protected", headers: { cookie } })).statusCode).toBe(403);
    await app.inject({ method: "POST", url: "/auth/logout", headers: { cookie, "x-fitfirst-request": "1" } });
    expect((await app.inject({ url: "/protected", headers: { cookie } })).statusCode).toBe(401);
  });
  it("rejects expired sessions", async () => {
    const { app, sessions } = await buildApp(); const token = "a".repeat(64);
    sessions.set(hashToken(token), { tokenHash: hashToken(token), expiresAt: new Date(0) });
    expect((await app.inject({ url: "/protected", headers: { cookie: `fitfirst_staff=${token}` } })).statusCode).toBe(401);
  });
  it("limits incorrect login attempts", async () => {
    const { app } = await buildApp();
    for (let i = 0; i < 5; i++) expect((await app.inject({ method: "POST", url: "/auth/login", headers: { "x-fitfirst-request": "1" }, payload: { pin: "0000" } })).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/auth/login", headers: { "x-fitfirst-request": "1" }, payload: { pin: "5678" } })).statusCode).toBe(429);
  });
  it("fails closed if staff access is unconfigured", async () => {
    const { app } = await buildApp(); delete process.env.DASHBOARD_PIN;
    expect((await app.inject({ method: "POST", url: "/auth/login", headers: { "x-fitfirst-request": "1" }, payload: { pin: "5678" } })).statusCode).toBe(503);
  });
});
