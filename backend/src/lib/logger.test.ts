import { describe, it, expect } from "vitest";
import { Writable } from "node:stream";
import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { registerErrorHandling } from "./errors";
import {
  REQUEST_ID_HEADER,
  loggerOptions,
  registerRequestLogging,
  requestIdFrom,
  serverOptions,
} from "./logger";

/** One parsed log line. */
type LogLine = Record<string, unknown> & {
  msg?: string;
  reqId?: string;
  durationMs?: number;
};

/** Collect the log lines the app writes, so we can assert on them. */
function buildApp() {
  const lines: LogLine[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of String(chunk).split("\n").filter(Boolean)) lines.push(JSON.parse(line));
      callback();
    },
  });

  const app = Fastify({ ...serverOptions, logger: { ...loggerOptions, stream } });
  registerRequestLogging(app);
  return { app, lines, ready: app.register(sensible).then(() => registerErrorHandling(app)) };
}

describe("request logging", () => {
  it("writes exactly one line per request, with the route, status and duration", async () => {
    const { app, lines, ready } = buildApp();
    await ready;
    app.get<{ Params: { id: string } }>("/sessions/:id", async () => ({ ok: true }));

    await app.inject({ url: "/sessions/abc123" });

    const requests = lines.filter((line) => line.msg === "request");
    expect(requests).toHaveLength(1);
    expect(lines.filter((line) => line.msg === "incoming request")).toHaveLength(0);
    expect(requests[0]).toMatchObject({
      method: "GET",
      route: "/sessions/:id",
      path: "/sessions/abc123",
      statusCode: 200,
    });
    expect(typeof requests[0].durationMs).toBe("number");
    expect(requests[0].reqId).toBeTruthy();
    await app.close();
  });

  it("hands the request id back to the caller, and uses the same one in the log", async () => {
    const { app, lines, ready } = buildApp();
    await ready;
    app.get("/thing", async () => ({ ok: true }));

    const res = await app.inject({ url: "/thing" });
    const header = res.headers[REQUEST_ID_HEADER];
    expect(header).toBeTruthy();
    expect(lines.find((line) => line.msg === "request")?.reqId).toBe(header);
    await app.close();
  });

  it("returns the id even when the handler fails, so a 500 can still be traced", async () => {
    const { app, lines, ready } = buildApp();
    await ready;
    app.get("/boom", async () => {
      throw new Error("a fault nobody expected");
    });

    const res = await app.inject({ url: "/boom" });
    expect(res.statusCode).toBe(500);
    expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    // The cause is logged for us; the caller is told nothing about it.
    expect(JSON.stringify(lines)).toContain("a fault nobody expected");
    expect(res.json().error.message).not.toContain("a fault nobody expected");
    await app.close();
  });

  it("never writes the staff cookie, the kiosk key, the PIN header or a PIN in a body", async () => {
    const { app, lines, ready } = buildApp();
    await ready;
    app.post("/auth/login", async (request) => {
      // Two ways a secret could get out. Fastify's default serializer drops
      // headers, so the first line proves nothing leaks by accident; the
      // second logs the headers outright, which is what the redact list is
      // there to catch.
      request.log.info({ req: request }, "the whole request");
      request.log.info({ req: { headers: request.headers }, pin: "5678" }, "the headers outright");
      return { ok: true };
    });

    await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: {
        cookie: "fitfirst_staff=abcdef0123456789",
        "x-kiosk-key": "a-real-kiosk-key",
        "x-dashboard-pin": "5678",
      },
      payload: { pin: "5678" },
    });

    const written = JSON.stringify(lines);
    for (const secret of ["abcdef0123456789", "a-real-kiosk-key", "5678"]) {
      expect(written, `"${secret}" must not reach the log`).not.toContain(secret);
    }
    expect(written).toContain("[Redacted]");
    await app.close();
  });
});

describe("the request id", () => {
  it("keeps a caller's id so a trace can span the kiosk and the API", () => {
    expect(requestIdFrom("kiosk-42_abc.1")).toBe("kiosk-42_abc.1");
  });

  it("replaces anything that could corrupt a log line", () => {
    for (const bad of [
      undefined,
      "",
      "has spaces",
      "line\nbreak",
      '{"json":"injection"}',
      "x".repeat(65),
    ]) {
      const generated = requestIdFrom(bad);
      expect(generated).not.toBe(bad);
      expect(generated).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it("takes the first value when a header arrives twice", () => {
    expect(requestIdFrom(["first-id", "second-id"])).toBe("first-id");
  });
});
