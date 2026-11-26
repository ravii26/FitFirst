/**
 * Structured request logging (S7-04, ENGINEERING_STANDARDS §4).
 *
 * §4: "structured (Fastify's logger), one line per request, a request ID, and
 * never a PIN, token, API key, photo or personal field. Customer data is
 * logged by ID only."
 *
 * What this module sets up:
 *   - **One line per request.** Fastify logs two by default ("incoming
 *     request" and "request completed"); both are turned off and replaced by a
 *     single line at response time carrying the method, path, status and
 *     duration.
 *   - **A request ID on every line, and in the response.** The caller gets it
 *     back as `x-request-id`, so a shopper's "it failed at 3pm" can be found
 *     in the log without guessing.
 *   - **Secrets redacted** rather than trusted not to appear: the staff
 *     cookie, the kiosk key, the old PIN header and a PIN in a body.
 */

import { randomUUID } from "node:crypto";
import { FastifyInstance, FastifyRequest } from "fastify";
import type { FastifyServerOptions } from "fastify";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Values that must never reach the log. Pino replaces each with "[Redacted]".
 * Add to this list rather than relying on a handler not to log something.
 */
export const REDACTED_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  'req.headers["x-kiosk-key"]',
  'req.headers["x-dashboard-pin"]',
  'req.headers["set-cookie"]',
  "res.headers[\"set-cookie\"]",
  "req.body.pin",
  "pin",
];

/**
 * A caller-supplied request ID is accepted so a trace can span the kiosk and
 * the API, but it is never trusted as-is: anything that is not a short, plain
 * token is replaced. An unchecked header would otherwise let a caller write
 * newlines or junk into every one of our log lines.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

export function requestIdFrom(header: unknown): string {
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === "string" && SAFE_REQUEST_ID.test(value) ? value : randomUUID();
}

/** Logger options for `Fastify({ logger })`. */
export const loggerOptions = {
  redact: { paths: REDACTED_PATHS, censor: "[Redacted]" },
};

/** Fastify options that belong with this logger. */
export const serverOptions: FastifyServerOptions = {
  // Our own single line replaces Fastify's pair.
  disableRequestLogging: true,
  genReqId: (request) => requestIdFrom(request.headers[REQUEST_ID_HEADER]),
};

/**
 * One structured line per request, and the request ID handed back to the
 * caller. Register this on every instance, tests included, so a test never
 * passes against logging production does not do.
 */
export function registerRequestLogging(app: FastifyInstance) {
  const started = new WeakMap<FastifyRequest, number>();

  app.addHook("onRequest", async (request, reply) => {
    started.set(request, performance.now());
    // Set early, so the id is on the response even if the handler throws.
    reply.header(REQUEST_ID_HEADER, request.id);
  });

  app.addHook("onResponse", async (request, reply) => {
    const begun = started.get(request);
    request.log.info(
      {
        method: request.method,
        // `routeOptions.url` is the pattern ("/sessions/:id"), which groups
        // lines by endpoint; the full path follows for finding one request.
        route: request.routeOptions?.url ?? request.url,
        path: request.url,
        statusCode: reply.statusCode,
        durationMs:
          begun === undefined ? undefined : Number((performance.now() - begun).toFixed(1)),
      },
      "request",
    );
  });
}
