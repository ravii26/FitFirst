import { FastifyReply, FastifyRequest } from "fastify";

// Guards staff-only endpoints (inventory, uploads, AI scan, analytics, purchase
// logging) with the same PIN the dashboard already prompts for. Previously
// DASHBOARD_PIN was only checked client-side, so anyone with network access to
// the backend could call these endpoints directly, bypassing the PIN entirely.
export async function requireDashboardPin(request: FastifyRequest, reply: FastifyReply) {
  const expected = process.env.DASHBOARD_PIN;
  const provided = request.headers["x-dashboard-pin"];

  if (!expected || provided !== expected) {
    return reply.unauthorized("Missing or invalid dashboard PIN");
  }
}
