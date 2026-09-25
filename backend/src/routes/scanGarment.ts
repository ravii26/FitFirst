import { FastifyInstance } from "fastify";
import FormData from "form-data";
import { sniffImageMime } from "../imageSniff";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function scanGarmentRoutes(app: FastifyInstance) {
  // GET /api/scan-garment/health — is AI tagging actually working? The
  // dashboard uses this to show an "AI off" banner instead of letting scans
  // quietly fall back to guesses.
  app.get("/scan-garment/health", async (_request, reply) => {
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!aiResponse.ok) {
        throw new Error(`AI microservice returned HTTP ${aiResponse.status}`);
      }
      const health = (await aiResponse.json()) as Record<string, unknown>;
      return reply.send({ aiServiceAvailable: true, ...health });
    } catch (err: any) {
      app.log.warn(`AI health check failed (${err.message}).`);
      return reply.send({
        aiServiceAvailable: false,
        error: "AI scanner microservice unavailable. Please select attributes manually.",
      });
    }
  });

  // POST /api/scan-garment — proxy image scan request to Python AI service
  app.post("/scan-garment", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.badRequest("No image file provided for AI scan");
    }

    const buffer = await data.toBuffer();

    // Don't trust the client-supplied Content-Type — verify the actual bytes.
    const sniffedMime = sniffImageMime(buffer);
    if (!sniffedMime) {
      return reply.badRequest("Invalid image type. Supported: JPEG, PNG, WEBP, AVIF");
    }

    try {
      const formData = new FormData();
      formData.append("file", buffer, {
        filename: data.filename,
        contentType: sniffedMime,
      });

      const aiResponse = await fetch(`${AI_SERVICE_URL}/scan`, {
        method: "POST",
        // Send the encoded multipart bytes: Node's built-in fetch cannot read a
        // `form-data` object and would send the text "[object FormData]".
        body: formData.getBuffer(),
        headers: formData.getHeaders(),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI microservice returned HTTP ${aiResponse.status}`);
      }

      const scanResult = await aiResponse.json();
      return reply.send({
        aiServiceAvailable: true,
        predictions: scanResult,
      });
    } catch (err: any) {
      app.log.warn(`AI Scan service connection failed (${err.message}). Returning manual fallback signal.`);
      return reply.send({
        aiServiceAvailable: false,
        error: "AI scanner microservice unavailable. Please select attributes manually.",
      });
    }
  });
}
