/**
 * One error shape for the whole API (S7-04, ENGINEERING_STANDARDS §4).
 *
 * Every failure leaves the server as:
 *
 *   { "error": { "code": "STOCK_INVALID", "message": "…", "details": [ … ] } }
 *
 * `code` is a stable string the frontends switch on. `message` is shown to a
 * person, so it may be reworded or translated at any time — never match on it.
 */

import { FastifyInstance } from "fastify";
import { ZodError } from "zod";

/** Stable codes. Add a new one here rather than reusing a loose fit. */
export const ErrorCode = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  /** The kiosk session is gone or its request key does not match. */
  SESSION_UNAVAILABLE: "SESSION_UNAVAILABLE",
  /** A stock value was negative, fractional or above what is on hand. */
  STOCK_INVALID: "STOCK_INVALID",
  INVALID_IMAGE: "INVALID_IMAGE",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  RATE_LIMITED: "RATE_LIMITED",
  /** The garment tagger is unreachable or returned an error. */
  AI_UNAVAILABLE: "AI_UNAVAILABLE",
  /** The server is running but something it needs is not configured. */
  NOT_CONFIGURED: "NOT_CONFIGURED",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** The body every failed request returns. Mirrored in the frontends' api client. */
export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; details?: unknown };
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  ALREADY_EXISTS: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  SESSION_UNAVAILABLE: 401,
  STOCK_INVALID: 400,
  INVALID_IMAGE: 400,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 502,
  NOT_CONFIGURED: 503,
  INTERNAL: 500,
};

/**
 * Throw this from anywhere. The handler registered by `registerErrorHandling`
 * turns it into the shape above with the right status.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    this.details = details;
  }
}

/** Shorthands, so routes read as prose. */
export const badRequest = (message: string, details?: unknown) =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, details);
export const notFound = (message: string) => new AppError(ErrorCode.NOT_FOUND, message);
export const conflict = (message: string) => new AppError(ErrorCode.CONFLICT, message);
export const unauthorized = (message: string) => new AppError(ErrorCode.UNAUTHORIZED, message);
export const forbidden = (message: string) => new AppError(ErrorCode.FORBIDDEN, message);
export const sessionUnavailable = (message: string) =>
  new AppError(ErrorCode.SESSION_UNAVAILABLE, message);
export const invalidStock = (message: string) => new AppError(ErrorCode.STOCK_INVALID, message);
export const invalidImage = (message: string) => new AppError(ErrorCode.INVALID_IMAGE, message);
export const aiUnavailable = (message: string) => new AppError(ErrorCode.AI_UNAVAILABLE, message);
export const notConfigured = (message: string) => new AppError(ErrorCode.NOT_CONFIGURED, message);

/** One field that failed validation. `path` is dotted, e.g. `answers.sizeInput`. */
export interface FieldIssue {
  path: string;
  message: string;
}

/**
 * Turn a zod failure into an AppError whose `details` names each bad field, so
 * a form can mark them without parsing a sentence.
 */
export function fromZodError(error: ZodError, message = "Some values need correcting"): AppError {
  const details: FieldIssue[] = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return badRequest(message, details);
}

/** Prisma's error codes we have a sensible answer for. */
const PRISMA_ERRORS: Record<string, AppError> = {
  P2002: new AppError(
    ErrorCode.ALREADY_EXISTS,
    "This record already exists. Please check the SKU or request.",
  ),
  P2025: notFound("Record not found"),
  P2003: badRequest("Related record not found"),
};

/** Generic replies for statuses raised by a plugin rather than our own code. */
const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_FAILED,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  413: ErrorCode.PAYLOAD_TOO_LARGE,
  429: ErrorCode.RATE_LIMITED,
  503: ErrorCode.NOT_CONFIGURED,
};

/**
 * Register the single error handler, plus a matching 404 for unknown routes.
 *
 * Call this on every Fastify instance, tests included, so a test never passes
 * against a shape production does not send.
 */
export function registerErrorHandling(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) =>
    reply
      .code(404)
      .send(body(ErrorCode.NOT_FOUND, `No such endpoint: ${request.method} ${request.url}`)),
  );

  app.setErrorHandler((error, request, reply) => {
    const resolved = resolve(error);

    // 5xx means we did not anticipate it: log the real cause, tell the caller nothing.
    if (resolved.statusCode >= 500) request.log.error(error);

    return reply
      .code(resolved.statusCode)
      .send(body(resolved.code, resolved.message, resolved.details));
  });
}

function body(code: ErrorCode, message: string, details?: unknown): ApiErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

/** The fields we read off a thrown value, none of them guaranteed to be there. */
interface ErrorLike {
  code?: unknown;
  statusCode?: unknown;
  message?: unknown;
  validation?: unknown;
}

function resolve(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return fromZodError(error);

  const thrown: ErrorLike = typeof error === "object" && error !== null ? error : {};
  const message = typeof thrown.message === "string" ? thrown.message : "Request failed";

  // Fastify's own schema validation, when a route declares one.
  if (thrown.validation) return badRequest("Some values need correcting", thrown.validation);

  const prisma = typeof thrown.code === "string" ? PRISMA_ERRORS[thrown.code] : undefined;
  if (prisma) return prisma;

  if (thrown.code === "FST_REQ_FILE_TOO_LARGE")
    return new AppError(ErrorCode.PAYLOAD_TOO_LARGE, "That file is too large. The limit is 10 MB.");

  // @fastify/sensible helpers and anything else carrying an HTTP status.
  // A status we map is deliberate, so its message is safe to pass on — including
  // 503, which `reply.serviceUnavailable` raises when something is unconfigured.
  const status = typeof thrown.statusCode === "number" ? thrown.statusCode : 500;
  const mapped = CODE_BY_STATUS[status];
  if (mapped) return new AppError(mapped, message);
  if (status < 500) return new AppError(ErrorCode.VALIDATION_FAILED, message);

  return new AppError(
    ErrorCode.INTERNAL,
    "Unable to complete the request. Please try again.",
  );
}
