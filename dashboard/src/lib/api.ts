export class ApiError extends Error {
  constructor(message: string, public details: { errors?: string[] } = {}) { super(message); }
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-fitfirst-request", "1");
  const response = await fetch(input, { ...init, credentials: "same-origin", headers });
  if (!response.ok) {
    const data = await response.clone().json().catch(() => ({}));
    if (response.status === 401 && !input.includes("/auth/")) window.dispatchEvent(new Event("fitfirst:unauthorized"));
    throw new ApiError(data.message || `Request failed (${response.status}). Please try again.`, data);
  }
  return response;
}
