import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { z } from "zod";
import { registerErrorHandling } from "./errors";
import { booleanParam, id, parseBody, parseIdParams, parseQuery } from "./validate";

/** A real cuid, the shape Prisma generates for every model in this schema. */
const CUID = "clz9k2h4x0000qwerty123456";

async function buildApp() {
  const app = Fastify();
  await app.register(sensible);
  registerErrorHandling(app);
  app.post("/body", async (request) =>
    parseBody(z.object({ name: z.string().min(2), age: z.number().int() }), request),
  );
  app.post("/body-worded", async (request) =>
    parseBody(z.object({ stockQty: z.number().int().min(0) }), request, "Stock must be a whole number"),
  );
  app.get<{ Params: { id: string } }>("/thing/:id", async (request) =>
    parseIdParams(request, "Thing not found"),
  );
  app.get("/list", async (request) =>
    parseQuery(z.object({ active: booleanParam.optional(), q: z.string().optional() }), request),
  );
  return app;
}

describe("the shared request validation", () => {
  it("returns the parsed body, with defaults applied", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/body", payload: { name: "Kurta", age: 3 } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ name: "Kurta", age: 3 });
    await app.close();
  });

  it("answers a bad body with one error shape that names each bad field", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/body", payload: { name: "x", age: 1.5 } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      error: {
        code: "VALIDATION_FAILED",
        message: "Some values need correcting",
        details: [{ path: "name" }, { path: "age" }],
      },
    });
    await app.close();
  });

  it("keeps a route's own wording when it passes one", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/body-worded", payload: { stockQty: -1 } });
    expect(res.json().error.message).toBe("Stock must be a whole number");
    await app.close();
  });

  it("accepts a cuid in the path and refuses junk, rather than passing it to the database", async () => {
    const app = await buildApp();
    expect((await app.inject({ url: `/thing/${CUID}` })).json()).toEqual({ id: CUID });

    // A malformed id reads as "no such thing", the same answer an unknown id
    // has always given, so no caller sees a status it did not see before.
    for (const bad of ["not-an-id", "123", "' OR 1=1 --"]) {
      const res = await app.inject({ url: `/thing/${encodeURIComponent(bad)}` });
      expect(res.statusCode, `path "${bad}" should not reach the handler`).toBe(404);
      expect(res.json()).toEqual({ error: { code: "NOT_FOUND", message: "Thing not found" } });
    }
    await app.close();
  });

  it("rejects a uuid, because ids in this schema are cuids", () => {
    expect(id.safeParse("3f0c4e2a-7b1d-4c8e-9a2b-5d6e7f801234").success).toBe(false);
    expect(id.safeParse(CUID).success).toBe(true);
  });

  it("reads a query flag as text and hands back a boolean", async () => {
    const app = await buildApp();
    expect((await app.inject({ url: "/list?active=true" })).json()).toEqual({ active: true });
    expect((await app.inject({ url: "/list?active=false" })).json()).toEqual({ active: false });
    // Unknown keys are dropped, not rejected.
    expect((await app.inject({ url: "/list?q=kurta&page=2" })).json()).toEqual({ q: "kurta" });
    // A flag that is neither true nor false is the caller's mistake.
    const bad = await app.inject({ url: "/list?active=yes" });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.message).toBe("Those filters are not valid");
    await app.close();
  });
});
