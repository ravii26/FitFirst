/**
 * One way to validate a request (S7-04, ENGINEERING_STANDARDS §4).
 *
 * §4: "every route validates `params`, `query` and `body` with `zod` at the
 * edge. Services receive typed, already-valid input."
 *
 * Before this module every route repeated the same four lines:
 *
 *   const result = Schema.safeParse(request.body);
 *   if (!result.success) throw fromZodError(result.error);
 *
 * and the `params` and `query` of most routes were not checked at all, so a
 * malformed id reached Prisma and surfaced as a 500. These helpers throw an
 * `AppError` that the one error handler turns into
 * `{ error: { code: "VALIDATION_FAILED", message, details } }`, with `details`
 * naming each bad field — so a form can mark them without parsing a sentence.
 */

import { FastifyRequest } from "fastify";
import { z, ZodTypeAny } from "zod";
import { AppError, ErrorCode, fromZodError } from "./errors";

/**
 * A database id. Prisma generates `cuid()` for every model in this schema
 * (`schema.prisma`), never a UUID — a `z.string().uuid()` here would reject
 * every real id. Checking the shape keeps a junk id out of a raw
 * `pg_advisory_xact_lock(hashtext(...))` and out of Prisma.
 */
export const id = z.string().cuid("is not a valid id");

/** The common `/:id` route, read by `parseIdParams`. */
const idParams = z.object({ id });

function parse<S extends ZodTypeAny>(schema: S, value: unknown, message: string): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw fromZodError(result.error, message);
  return result.data;
}

/**
 * Validate the JSON body. Returns it typed; never returns invalid data.
 * `message` replaces the default sentence where a route has clearer wording.
 */
export function parseBody<S extends ZodTypeAny>(
  schema: S,
  request: FastifyRequest,
  message = "Some values need correcting",
): z.infer<S> {
  return parse(schema, request.body, message);
}

/**
 * Validate a `/:id` path and return the id.
 *
 * A malformed id answers **404**, exactly as an unknown one always has — Het's
 * call on 25 Nov 2026, keeping Stage 7's "structure only, never behaviour"
 * rule (DEC-19) intact. The point of validating is still met: a junk id never
 * reaches Prisma or the raw `pg_advisory_xact_lock(hashtext(...))`; it is
 * turned away at the edge instead. `message` is the route's own 404 wording.
 */
export function parseIdParams(request: FastifyRequest, message: string): { id: string } {
  const result = idParams.safeParse(request.params);
  if (!result.success) throw new AppError(ErrorCode.NOT_FOUND, message);
  return result.data;
}

/** Validate the query string. Unknown keys are dropped, not rejected. */
export function parseQuery<S extends ZodTypeAny>(schema: S, request: FastifyRequest): z.infer<S> {
  return parse(schema, request.query, "Those filters are not valid");
}

/** A yes/no that arrived as a query string, where everything is text. */
export const booleanParam = z
  .enum(["true", "false"], { invalid_type_error: "must be true or false" })
  .transform((value) => value === "true");
