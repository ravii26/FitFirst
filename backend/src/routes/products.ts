import { normalizeSize } from "../scoring/sizes";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { PrismaClient, Category, Gender, ColorFamily, Pattern, FitType } from "@prisma/client";

const ProductCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(Category),
  gender: z.nativeEnum(Gender),
  colorFamily: z.nativeEnum(ColorFamily),
  pattern: z.nativeEnum(Pattern),
  fitType: z.nativeEnum(FitType),
  sizeRange: z.array(z.string().trim().min(1).max(20).transform(normalizeSize)).min(1).max(40),
  price: z.number().int().positive().max(2147483647),
  stockQty: z.number().int().min(0).max(2147483647),
  daysInStock: z.number().int().min(0).max(2147483647).default(0),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  aiTagged: z.boolean().default(false),
  aiEngine: z.string().optional(),
  aiConfidence: z.record(z.number()).optional(),
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
        ...(search && { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { sku: { contains: search, mode: "insensitive" as const } }] }),
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
    } catch (error) {
      throw error;
    }
  });

  // PATCH /api/products/:id/image — update product image URL
  app.patch<{ Params: { id: string } }>("/products/:id/image", async (request, reply) => {
    const parsed = z.object({ imageUrl: z.string().max(2000) }).safeParse(request.body);
    if (!parsed.success) return reply.badRequest("A valid image URL is required");
    const { imageUrl } = parsed.data;
    try {
      return await prisma.product.update({
        where: { id: request.params.id },
        data: { imageUrl },
      });
    } catch (error) {
      throw error;
    }
  });

  // PATCH /api/products/:id/stock — quick stock update
  app.patch<{ Params: { id: string } }>("/products/:id/stock", async (request, reply) => {
    const parsed = z.object({ stockQty: z.number().int().min(0).max(2147483647) }).safeParse(request.body);
    if (!parsed.success) return reply.badRequest("Stock must be a nonnegative whole number");
    const { stockQty } = parsed.data;
    try {
      return await prisma.product.update({
        where: { id: request.params.id },
        data: { stockQty },
      });
    } catch (error) {
      throw error;
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
    } catch (error) {
      throw error;
    }
  });

  // POST /api/products/bulk — bulk import products via CSV text
  app.post("/products/bulk", async (request, reply) => {
    const { csvText } = request.body as { csvText: string };
    if (!csvText) {
      return reply.badRequest("csvText is required in body");
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return reply.badRequest("CSV must contain at least a header and one product row");
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const required = ["sku", "name", "category", "gender", "colorfamily", "pattern", "fittype", "sizerange", "price", "stockqty"];
    for (const req of required) {
      if (!headers.includes(req)) {
        return reply.badRequest(`Missing required CSV header column: '${req}'`);
      }
    }

    // Helper to parse CSV row (handles quotes)
    const parseRow = (rowText: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < rowText.length; i++) {
        const char = rowText[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const productsToCreate: any[] = [];
    const errors: string[] = [];

    // Valid enums
    const categories = new Set([
      "KURTA","SAREE","SALWAR_KAMEEZ","LEHENGA","SHERWANI","DHOTI","DUPATTA",
      "SHIRT","TROUSERS","JEANS","DRESS","SKIRT","JACKET",
      "KIDS_KURTA","KIDS_SHIRT","KIDS_TROUSERS","KIDS_DRESS","ACCESSORIES"
    ]);
    const genders = new Set(["MEN", "WOMEN", "KIDS", "UNISEX"]);
    const colors = new Set(["WHITE", "CREAM_IVORY", "LIGHT_PASTELS", "WARM_EARTH", "BRIGHT_WARM", "BRIGHT_COOL", "DARK_NEUTRAL", "JEWEL_TONES", "MULTICOLOR"]);
    const patterns = new Set(["SOLID", "STRIPES", "CHECKS", "FLORAL", "GEOMETRIC", "PAISLEY", "EMBROIDERED", "BLOCK_PRINT", "ABSTRACT", "ANIMAL_PRINT"]);
    const fits = new Set(["SLIM", "REGULAR", "RELAXED_LOOSE", "FLARED_ANARKALI", "STRAIGHT_CUT", "A_LINE", "WRAPAROUND", "TAILORED_STRUCTURED"]);

    for (let idx = 1; idx < lines.length; idx++) {
      const row = parseRow(lines[idx]);
      if (row.length < required.length) {
        errors.push(`Row ${idx + 1}: Expected at least ${required.length} columns, found ${row.length}`);
        continue;
      }

      const getVal = (colName: string): string => {
        const i = headers.indexOf(colName);
        return i !== -1 && row[i] ? row[i].replace(/^"|"$/g, "") : "";
      };

      const sku = getVal("sku");
      const name = getVal("name");
      const category = getVal("category").toUpperCase();
      const gender = getVal("gender").toUpperCase();
      const colorFamily = getVal("colorfamily").toUpperCase();
      const pattern = getVal("pattern").toUpperCase();
      const fitType = getVal("fittype").toUpperCase();
      const sizeRangeRaw = getVal("sizerange");
      const priceRaw = getVal("price");
      const stockQtyRaw = getVal("stockqty");
      const daysInStockRaw = getVal("daysinstock") || "0";
      const imageUrl = getVal("imageurl");

      if (!sku) errors.push(`Row ${idx + 1}: SKU is required`);
      if (!name) errors.push(`Row ${idx + 1}: Name is required`);

      if (!categories.has(category)) {
        errors.push(`Row ${idx + 1}: Invalid category '${category}'.`);
      }
      if (!genders.has(gender)) {
        errors.push(`Row ${idx + 1}: Invalid gender '${gender}'.`);
      }
      if (!colors.has(colorFamily)) {
        errors.push(`Row ${idx + 1}: Invalid colorFamily '${colorFamily}'.`);
      }
      if (!patterns.has(pattern)) {
        errors.push(`Row ${idx + 1}: Invalid pattern '${pattern}'.`);
      }
      if (!fits.has(fitType)) {
        errors.push(`Row ${idx + 1}: Invalid fitType '${fitType}'.`);
      }

      const price = Number(priceRaw);
      if (!Number.isInteger(price) || price <= 0 || price > 2147483647) {
        errors.push(`Row ${idx + 1}: Invalid price '${priceRaw}'. Must be a positive integer`);
      }

      const stockQty = Number(stockQtyRaw);
      if (!Number.isInteger(stockQty) || !stockQtyRaw.trim() || stockQty < 0 || stockQty > 2147483647) {
        errors.push(`Row ${idx + 1}: Invalid stockQty '${stockQtyRaw}'. Must be a non-negative integer`);
      }

      const daysInStock = Number(daysInStockRaw);
      if (!Number.isInteger(daysInStock) || daysInStock < 0 || daysInStock > 2147483647) {
        errors.push(`Row ${idx + 1}: Invalid daysInStock '${daysInStockRaw}'. Must be a non-negative integer`);
      }

      const sizeRange = sizeRangeRaw.split(";").map(s => s.trim()).filter(s => s.length > 0);
      if (sizeRange.length === 0) {
        errors.push(`Row ${idx + 1}: sizeRange must contain at least one size separated by semicolons (e.g. S;M;L)`);
      }

      if (errors.length === 0) {
        productsToCreate.push({
          sku,
          name,
          category,
          gender,
          colorFamily,
          pattern,
          fitType,
          sizeRange,
          price,
          stockQty,
          daysInStock,
          imageUrl: imageUrl || null,
          isActive: true,
        });
      }
    }

    if (errors.length > 0) {
      return reply.code(400).send({
        success: false,
        message: "CSV validation failed",
        errors: errors.slice(0, 100),
      });
    }

    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const p of productsToCreate) {
        const existing = await tx.product.findUnique({ where: { sku: p.sku } });
        if (existing) {
          await tx.product.update({
            where: { sku: p.sku },
            data: p,
          });
          updatedCount++;
        } else {
          await tx.product.create({
            data: p,
          });
          createdCount++;
        }
      }
    });

    return {
      success: true,
      message: `Bulk import completed successfully.`,
      createdCount,
      updatedCount,
    };
  });
}
