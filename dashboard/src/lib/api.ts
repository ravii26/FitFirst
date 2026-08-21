/// <reference types="vite/client" />

// The backend now requires this same PIN (as x-dashboard-pin) on every
// staff-only endpoint — see backend/src/authGuard.ts. Previously the PIN
// only gated the dashboard UI client-side, so anyone with network access
// to the backend could call these endpoints directly.
const DASHBOARD_PIN = import.meta.env.VITE_DASHBOARD_PIN ?? "1234";

export function apiFetch(input: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      "x-dashboard-pin": DASHBOARD_PIN,
    },
  });
}
