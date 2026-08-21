import { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs/promises";
import { sniffImageMime } from "../imageSniff";

// Extension is derived from the sniffed MIME type, never from the
// client-supplied filename — a spoofed filename (e.g. "x.html" sent with
// Content-Type: image/jpeg) must not be able to make its way onto disk
// with an extension that gets served/executed as something other than an image.
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload — upload media file (image)
  app.post("/upload", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.badRequest("No image file uploaded");
    }

    const buffer = await data.toBuffer();

    // Don't trust the client-supplied Content-Type — verify the actual bytes.
    const sniffedMime = sniffImageMime(buffer);
    const ext = sniffedMime && EXT_BY_MIME[sniffedMime];
    if (!ext) {
      return reply.badRequest("Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF, AVIF");
    }

    const filename = `garment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadPath = path.join(process.cwd(), "uploads", filename);

    await fs.writeFile(uploadPath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return reply.code(201).send({
      url: publicUrl,
      filename,
      mimetype: sniffedMime,
    });
  });
}
