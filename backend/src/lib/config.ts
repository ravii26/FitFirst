/**
 * One place that reads the environment (S7-04, ENGINEERING_STANDARDS §4).
 *
 * Rules this module exists to enforce:
 *   - `process.env` is read here and nowhere else in `backend/src`.
 *   - Every value is validated. A bad or missing one stops the boot with a
 *     message naming the variable.
 *   - A value is never printed, logged or put in an error message. Only the
 *     variable's name and what was wrong with it.
 *
 * Two ways in, on purpose:
 *   - `loadConfig()` at boot: validates everything together and fails fast.
 *   - the small accessors (`staffPin`, `aiServiceUrl`, `isProduction`): read
 *     one value at call time, for code that runs per request and must see the
 *     environment as it is now rather than as it was at import.
 */

import { z } from "zod";

/** An unset variable and an empty one mean the same thing: use the default. */
const blankAsUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/**
 * A browser-reachable URL. `.url()` alone is not enough: `new URL()` accepts
 * "localhost:8000" as a URL with the scheme "localhost", which would pass
 * validation and then fail at the first fetch. Require http or https.
 */
const optionalUrl = (fallback: string) =>
  z.preprocess(
    blankAsUndefined,
    z
      .string()
      .url("must be a full URL, e.g. http://localhost:5174")
      .refine((value) => /^https?:\/\//.test(value), {
        message: "must start with http:// or https://",
      })
      .default(fallback),
  );

/** The shape of a valid environment. Add a new variable here, not inline. */
const ConfigSchema = z.object({
  NODE_ENV: z.preprocess(
    blankAsUndefined,
    z.enum(["development", "test", "production"]).default("development"),
  ),
  PORT: z.preprocess(
    blankAsUndefined,
    z.coerce
      .number({ invalid_type_error: "must be a whole number between 1 and 65535" })
      .int("must be a whole number between 1 and 65535")
      .min(1, "must be a whole number between 1 and 65535")
      .max(65535, "must be a whole number between 1 and 65535")
      .default(3008),
  ),
  DATABASE_URL: z.preprocess(
    blankAsUndefined,
    z
      .string({ required_error: "is required — the Postgres connection string" })
      .refine((value) => /^postgres(ql)?:\/\//.test(value), {
        message: "must be a postgres:// or postgresql:// connection string",
      }),
  ),
  DASHBOARD_PIN: z.preprocess(
    blankAsUndefined,
    z
      .string({ required_error: "is required — the four-digit staff passcode" })
      .regex(/^\d{4}$/, "must be exactly four digits"),
  ),
  KIOSK_URL: optionalUrl("http://localhost:5174"),
  DASHBOARD_URL: optionalUrl("http://localhost:5173"),
  AI_SERVICE_URL: optionalUrl("http://localhost:8000"),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Boot stopped because the environment is wrong. Carries the variable names
 * only — never their values, so this is safe to print and to log.
 */
export class ConfigError extends Error {
  readonly variables: string[];

  constructor(issues: { variable: string; message: string }[]) {
    const lines = issues.map((issue) => `  - ${issue.variable}: ${issue.message}`);
    super(
      [
        "The backend environment is not valid. Fix these in backend/.env:",
        ...lines,
        "(Values are never printed. See backend/.env.example for the full list.)",
      ].join("\n"),
    );
    this.name = "ConfigError";
    this.variables = issues.map((issue) => issue.variable);
  }
}

/**
 * Validate the whole environment at once. Call this on boot, before anything
 * else, so a misconfigured server never reaches the point of serving traffic.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = ConfigSchema.safeParse({
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DATABASE_URL: env.DATABASE_URL,
    DASHBOARD_PIN: env.DASHBOARD_PIN,
    KIOSK_URL: env.KIOSK_URL,
    DASHBOARD_URL: env.DASHBOARD_URL,
    AI_SERVICE_URL: env.AI_SERVICE_URL,
  });

  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((issue) => ({
        variable: String(issue.path[0] ?? "(unknown)"),
        message: issue.message,
      })),
    );
  }

  return Object.freeze(result.data);
}

/** Read one variable at call time, falling back to its default when unset. */
function read<K extends keyof Config>(key: K): Config[K] | undefined {
  const result = ConfigSchema.shape[key].safeParse(process.env[key]);
  return result.success ? (result.data as Config[K]) : undefined;
}

/**
 * The staff passcode, or `undefined` when it is unset or malformed. The login
 * route answers `undefined` with "not configured" rather than failing the
 * request, so staff access fails closed instead of crashing.
 */
export const staffPin = (): string | undefined => read("DASHBOARD_PIN");

/** Where the Python garment tagger lives. Always a usable URL. */
export const aiServiceUrl = (): string => read("AI_SERVICE_URL") ?? "http://localhost:8000";

/** True only in a real deployment. Drives the `Secure` cookie flag. */
export const isProduction = (): boolean => read("NODE_ENV") === "production";
