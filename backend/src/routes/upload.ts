import { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises";

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload — upload media file (image)
  app.post("/upload", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.badRequest("No image file uploaded");
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      return reply.badRequest("Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF, AVIF");
    }

    const ext = path.extname(data.filename) || ".jpg";
    const filename = `garment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadPath = path.join(process.cwd(), "uploads", filename);

    await pipeline(data.file, fs.createWriteStream(uploadPath));

    const publicUrl = `/uploads/${filename}`;
    return reply.code(201).send({
      url: publicUrl,
      filename,
      mimetype: data.mimetype,
    });
  });
}
