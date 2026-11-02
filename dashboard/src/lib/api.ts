/**
 * The one place the dashboard talks to the API.
 *
 * Every failure from the server arrives as
 *   { error: { code, message, details? } }
 * (backend/src/lib/errors.ts). `code` is stable and safe to branch on;
 * `message` is display text and may be reworded, so never match on it.
 */

/** Keep in step with ErrorCode in backend/src/lib/errors.ts. */
export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "ALREADY_EXISTS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SESSION_UNAVAILABLE"
  | "STOCK_INVALID"
  | "INVALID_IMAGE"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "NOT_CONFIGURED"
  | "INTERNAL"
  /** The request never reached the server, so there is no server code. */
  | "NETWORK";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: ApiErrorCode,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  is(code: ApiErrorCode) {
    return this.code === code;
  }
}

const FALLBACK = "Unable to complete the request. Please try again.";

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-fitfirst-request", "1");

  let response: Response;
  try {
    response = await fetch(input, { ...init, credentials: "same-origin", headers });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection.", "NETWORK", 0);
  }

  if (!response.ok) {
    const body = await response
      .clone()
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    const error = (body as { error?: { code?: string; message?: string; details?: unknown } }).error;

    if (response.status === 401 && !input.includes("/auth/"))
      window.dispatchEvent(new Event("fitfirst:unauthorized"));

    throw new ApiError(
      error?.message || `${FALLBACK} (${response.status})`,
      (error?.code as ApiErrorCode) ?? "INTERNAL",
      response.status,
      error?.details,
    );
  }

  return response;
}
