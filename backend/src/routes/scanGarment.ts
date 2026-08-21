import { FastifyInstance } from "fastify";
import FormData from "form-data";
import { sniffImageMime } from "../imageSniff";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function scanGarmentRoutes(app: FastifyInstance) {
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
        body: formData as any,
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
