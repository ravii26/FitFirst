import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const ProductCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  gender: z.string(),
  colorFamily: z.string(),
  pattern: z.string(),
  fitType: z.string(),
  sizeRange: z.array(z.string()).min(1),
  price: z.number().int().positive(),
  stockQty: z.number().int().min(0),
  daysInStock: z.number().int().min(0).default(0),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const ProductUpdateSchema = ProductCreateSchema.partial();

export async function productsRoutes(app: FastifyInstance) {
  const prisma: PrismaClient = (app as any).prisma;

  // GET /api/products — list all products
  app.get("/products", async (request: any) => {
    const { category, gender, isActive, search } = request.query as any;
    return prisma.product.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(gender && { gender: gender as any }),
        ...(isActive !== undefined && { isActive: isActive === "true" }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
      orderBy: { daysInStock: "desc" },
    });
  });

  // GET /api/products/:id
  app.get<{ Params: { id: string } }>("/products/:id", async (request, reply) => {
    const product = await prisma.product.findUnique({
      where: { id: request.params.id },
      include: {
        _count: { select: { recommendations: true, purchaseEvents: true } },
      },
    });
    if (!product) return reply.notFound("Product not found");
    return product;
  });

  // POST /api/products — create new product
  app.post("/products", async (request, reply) => {
    const result = ProductCreateSchema.safeParse(request.body);
    if (!result.success) return reply.badRequest(result.error.message);
    const product = await prisma.product.create({ data: result.data as any });
    return reply.code(201).send(product);
  });

  // PUT /api/products/:id — update product details
  app.put<{ Params: { id: string } }>("/products/:id", async (request, reply) => {
    const result = ProductUpdateSchema.safeParse(request.body);
    if (!result.success) return reply.badRequest(result.error.message);
    try {
      const product = await prisma.product.update({
        where: { id: request.params.id },
        data: result.data as any,
      });
      return product;
    } catch {
      return reply.notFound("Product not found");
    }
  });

  // PATCH /api/products/:id/image — update product image URL
  app.patch<{ Params: { id: string } }>("/products/:id/image", async (request, reply) => {
    const { imageUrl } = request.body as { imageUrl: string };
    if (!imageUrl) return reply.badRequest("imageUrl is required");
    try {
      return await prisma.product.update({
        where: { id: request.params.id },
        data: { imageUrl },
      });
    } catch {
      return reply.notFound("Product not found");
    }
  });

  // PATCH /api/products/:id/stock — quick stock update
  app.patch<{ Params: { id: string } }>("/products/:id/stock", async (request, reply) => {
    const { stockQty } = request.body as { stockQty: number };
    if (typeof stockQty !== "number") return reply.badRequest("stockQty is required");
    try {
      return await prisma.product.update({
        where: { id: request.params.id },
        data: { stockQty },
      });
    } catch {
      return reply.notFound("Product not found");
    }
  });

  // DELETE /api/products/:id — soft delete (sets isActive = false)
  app.delete<{ Params: { id: string } }>("/products/:id", async (request, reply) => {
    try {
      await prisma.product.update({
        where: { id: request.params.id },
        data: { isActive: false },
      });
      return reply.code(204).send();
    } catch {
      return reply.notFound("Product not found");
    }
  });
}
