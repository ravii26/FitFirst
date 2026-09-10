import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const COOKIE = "fitfirst_staff";
const SESSION_SECONDS = 8 * 60 * 60;
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
function tokenFrom(request: FastifyRequest) {
  return request.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
}
function cookie(token: string, age: number) {
  return `${COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export async function requireStaffSession(request: FastifyRequest, reply: FastifyReply) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers["x-fitfirst-request"] !== "1") return reply.forbidden("Missing request protection header");
  const token = tokenFrom(request);
  const prisma: PrismaClient = (request.server as any).prisma;
  const session = token && /^[a-f0-9]{64}$/.test(token)
    ? await prisma.staffSession.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (!session || session.expiresAt.getTime() <= Date.now()) return reply.header("Set-Cookie", cookie("", 0)).unauthorized("Please sign in to the staff dashboard");
}

export async function authRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;
  const attempts = new Map<string, { count: number; expires: number }>();
  app.post("/auth/login", async (request, reply) => {
    if (request.headers["x-fitfirst-request"] !== "1") return reply.forbidden("Missing request protection header");
    const now = Date.now();
    for (const [ip, value] of attempts) if (value.expires <= now) attempts.delete(ip);
    const limit = attempts.get(request.ip) ?? { count: 0, expires: now + 15 * 60_000 };
    if (limit.count >= 5 || (!attempts.has(request.ip) && attempts.size >= 10000)) return reply.header("Retry-After", Math.max(1, Math.ceil((limit.expires - now) / 1000))).code(429).send({ message: "Too many attempts. Try again in 15 minutes." });
    limit.count++;
    attempts.set(request.ip, limit);
    const input = z.object({ pin: z.string().regex(/^\d{4}$/) }).safeParse(request.body);
    const expected = process.env.DASHBOARD_PIN;
    if (!expected) return reply.serviceUnavailable("Staff access has not been configured");
    if (!input.success || !timingSafeEqual(Buffer.from(hashToken(input.data.pin)), Buffer.from(hashToken(expected)))) return reply.unauthorized("Incorrect passcode");
    attempts.delete(request.ip);
    await prisma.staffSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    const token = randomBytes(32).toString("hex");
    await prisma.staffSession.create({ data: { tokenHash: hashToken(token), expiresAt: new Date(now + SESSION_SECONDS * 1000) } });
    return reply.header("Set-Cookie", cookie(token, SESSION_SECONDS)).send({ authenticated: true });
  });
  app.get("/auth/session", { preHandler: requireStaffSession }, async () => ({ authenticated: true }));
  app.post("/auth/logout", async (request, reply) => {
    if (request.headers["x-fitfirst-request"] !== "1") return reply.forbidden("Missing request protection header");
    const token = tokenFrom(request);
    if (token) await prisma.staffSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    return reply.header("Set-Cookie", cookie("", 0)).send({ authenticated: false });
  });
}
