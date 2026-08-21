import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import multipart from "@fastify/multipart";
import FormData from "form-data";
import { uploadRoutes } from "./upload";

vi.mock("fs/promises", () => ({
  default: { writeFile: vi.fn().mockResolvedValue(undefined) },
}));

async function buildApp() {
  const app = Fastify();
  await app.register(sensible);
  await app.register(multipart);
  await app.register(uploadRoutes, { prefix: "/api" });
  return app;
}

const REAL_JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const SPOOFED_BYTES = Buffer.from("<script>alert(1)</script>", "ascii");

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a file with genuine JPEG magic bytes and writes it to disk", async () => {
    const app = await buildApp();
    const form = new FormData();
    form.append("file", REAL_JPEG_BYTES, { filename: "garment.jpg", contentType: "image/jpeg" });

    const res = await app.inject({
      method: "POST",
      url: "/api/upload",
      payload: form.getBuffer(),
      headers: form.getHeaders(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.url).toMatch(/^\/uploads\/garment_.*\.jpg$/);
    expect(body.mimetype).toBe("image/jpeg");
  });

  it("rejects a file whose bytes don't match its claimed Content-Type", async () => {
    const app = await buildApp();
    const form = new FormData();
    // Client lies and calls this image/jpeg even though the bytes are HTML.
    form.append("file", SPOOFED_BYTES, { filename: "fake.jpg", contentType: "image/jpeg" });

    const res = await app.inject({
      method: "POST",
      url: "/api/upload",
      payload: form.getBuffer(),
      headers: form.getHeaders(),
    });

    expect(res.statusCode).toBe(400);
  });

  it("derives the stored filename's extension from sniffed bytes, not the client-supplied filename", async () => {
    const app = await buildApp();
    const form = new FormData();
    // Client sends real JPEG bytes but names the file with a dangerous extension.
    form.append("file", REAL_JPEG_BYTES, { filename: "payload.html", contentType: "image/jpeg" });

    const res = await app.inject({
      method: "POST",
      url: "/api/upload",
      payload: form.getBuffer(),
      headers: form.getHeaders(),
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().url).toMatch(/\.jpg$/);
  });
});
