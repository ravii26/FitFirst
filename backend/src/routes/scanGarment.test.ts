import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import multipart from "@fastify/multipart";
import FormData from "form-data";
import { scanGarmentRoutes } from "./scanGarment";

async function buildApp() {
  const app = Fastify();
  await app.register(sensible);
  await app.register(multipart);
  await app.register(scanGarmentRoutes, { prefix: "/api" });
  return app;
}

const REAL_JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const SPOOFED_BYTES = Buffer.from("<script>alert(1)</script>", "ascii");

function multipartRequest(bytes: Buffer, filename: string, contentType: string) {
  const form = new FormData();
  form.append("file", bytes, { filename, contentType });
  return { payload: form.getBuffer(), headers: form.getHeaders() };
}

describe("POST /api/scan-garment", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects a file whose bytes don't match its claimed Content-Type without calling the AI service", async () => {
    const app = await buildApp();
    const req = multipartRequest(SPOOFED_BYTES, "fake.jpg", "image/jpeg");

    const res = await app.inject({ method: "POST", url: "/api/scan-garment", ...req });

    expect(res.statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proxies a genuine image to the AI service and returns its predictions", async () => {
    const fakePredictions = { category: { value: "KURTA", confidence: 0.8, all_scores: {}, engine: "heuristic" } };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => fakePredictions,
    });

    const app = await buildApp();
    const req = multipartRequest(REAL_JPEG_BYTES, "garment.jpg", "image/jpeg");
    const res = await app.inject({ method: "POST", url: "/api/scan-garment", ...req });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.aiServiceAvailable).toBe(true);
    expect(body.predictions).toEqual(fakePredictions);
  });

  it("sends the real multipart bytes to the AI service, not \"[object FormData]\"", async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });

    const app = await buildApp();
    const req = multipartRequest(REAL_JPEG_BYTES, "garment.jpg", "image/jpeg");
    await app.inject({ method: "POST", url: "/api/scan-garment", ...req });

    const [, init] = (global.fetch as any).mock.calls[0];
    expect(Buffer.isBuffer(init.body)).toBe(true);
    const sent: Buffer = init.body;
    expect(sent.toString("latin1")).not.toContain("[object FormData]");
    expect(sent.includes(REAL_JPEG_BYTES)).toBe(true);
    const boundary = /boundary=(.+)$/.exec(init.headers["content-type"])?.[1];
    expect(boundary).toBeTruthy();
    expect(sent.toString("latin1")).toContain(`--${boundary}`);
  });

  it("returns a 200 with aiServiceAvailable:false and a visible error when the AI service is unreachable", async () => {
    (global.fetch as any).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const app = await buildApp();
    const req = multipartRequest(REAL_JPEG_BYTES, "garment.jpg", "image/jpeg");
    const res = await app.inject({ method: "POST", url: "/api/scan-garment", ...req });

    // Deliberately 200, not 5xx — the caller (dashboard) treats this as a
    // recoverable "fall back to manual tagging" signal, not a hard failure.
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.aiServiceAvailable).toBe(false);
    expect(body.error).toBeTruthy();
  });

  it("returns aiServiceAvailable:false when the AI service responds with a non-OK status", async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 500 });

    const app = await buildApp();
    const req = multipartRequest(REAL_JPEG_BYTES, "garment.jpg", "image/jpeg");
    const res = await app.inject({ method: "POST", url: "/api/scan-garment", ...req });

    expect(res.statusCode).toBe(200);
    expect(res.json().aiServiceAvailable).toBe(false);
  });
});

describe("GET /api/scan-garment/health", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("passes the AI service's real status through", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", ai_status: "failed", active_engine: "heuristic", last_ai_error: "401" }),
    });

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/scan-garment/health" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.aiServiceAvailable).toBe(true);
    expect(body.ai_status).toBe("failed");
    expect(body.active_engine).toBe("heuristic");
    expect((global.fetch as any).mock.calls[0][0]).toMatch(/\/health$/);
  });

  it("reports aiServiceAvailable:false when the AI service is unreachable", async () => {
    (global.fetch as any).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/scan-garment/health" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.aiServiceAvailable).toBe(false);
    expect(body.error).toBeTruthy();
  });

  it("reports aiServiceAvailable:false on a non-OK status", async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 503 });

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/scan-garment/health" });

    expect(res.json().aiServiceAvailable).toBe(false);
  });
});
