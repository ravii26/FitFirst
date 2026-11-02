import { describe, it, expect, afterEach } from "vitest";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { z } from "zod";
import { AppError, ErrorCode, badRequest, notFound, registerErrorHandling } from "./errors";

const apps: ReturnType<typeof Fastify>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function buildApp() {
  // `logger: false` keeps the expected 500 out of the test output.
  const app = Fastify({ logger: false });
  apps.push(app);
  await app.register(sensible);
  registerErrorHandling(app);
  return app;
}

describe("the API error contract", () => {
  it("shapes an AppError as { error: { code, message } } with the code's status", async () => {
    const app = await buildApp();
    app.get("/boom", async () => {
      throw notFound("Session not found");
    });

    const res = await app.inject({ url: "/boom" });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: "NOT_FOUND", message: "Session not found" } });
  });

  it("omits details when there are none, and includes them when there are", async () => {
    const app = await buildApp();
    app.get("/plain", async () => {
      throw badRequest("No good");
    });
    app.get("/detailed", async () => {
      throw badRequest("CSV validation failed", ["row 2: bad size"]);
    });

    expect(res2json(await app.inject({ url: "/plain" }))).toEqual({
      code: "VALIDATION_FAILED",
      message: "No good",
    });
    expect(res2json(await app.inject({ url: "/detailed" }))).toEqual({
      code: "VALIDATION_FAILED",
      message: "CSV validation failed",
      details: ["row 2: bad size"],
    });
  });

  it("turns a zod failure into VALIDATION_FAILED and names each bad field", async () => {
    const app = await buildApp();
    const schema = z.object({ sku: z.string().min(1), stockQty: z.number().int() });
    app.post("/products", async (request) => schema.parse(request.body));

    const res = await app.inject({ method: "POST", url: "/products", payload: { stockQty: 1.5 } });

    expect(res.statusCode).toBe(400);
    const body = res.json().error;
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(body.details.map((d: { path: string }) => d.path).sort()).toEqual(["sku", "stockQty"]);
  });

  it("maps a Prisma unique-constraint failure to ALREADY_EXISTS", async () => {
    const app = await buildApp();
    app.get("/dupe", async () => {
      throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    });

    const res = await app.inject({ url: "/dupe" });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("ALREADY_EXISTS");
  });

  it("normalises a @fastify/sensible helper into the same shape", async () => {
    const app = await buildApp();
    app.get("/sensible", async (_request, reply) => reply.conflict("Start a new request"));

    const res = await app.inject({ url: "/sensible" });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: { code: "CONFLICT", message: "Start a new request" } });
  });

  it("hides the cause of an unexpected error behind INTERNAL", async () => {
    const app = await buildApp();
    app.get("/crash", async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:5434");
    });

    const res = await app.inject({ url: "/crash" });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: { code: "INTERNAL", message: "Unable to complete the request. Please try again." },
    });
    expect(res.payload).not.toContain("ECONNREFUSED");
  });

  it("answers an unknown route with NOT_FOUND in the same shape", async () => {
    const app = await buildApp();

    const res = await app.inject({ url: "/nope" });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("maps an oversized upload to PAYLOAD_TOO_LARGE", async () => {
    const app = await buildApp();
    app.get("/big", async () => {
      throw Object.assign(new Error("request file too large"), {
        code: "FST_REQ_FILE_TOO_LARGE",
        statusCode: 413,
      });
    });

    const res = await app.inject({ url: "/big" });

    expect(res.statusCode).toBe(413);
    expect(res.json().error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("gives every code a status, so a new code cannot ship without one", () => {
    for (const code of Object.values(ErrorCode)) {
      expect(new AppError(code, "x").statusCode).toBeGreaterThanOrEqual(400);
    }
  });
});

function res2json(res: { json: () => { error: unknown } }) {
  return res.json().error;
}
