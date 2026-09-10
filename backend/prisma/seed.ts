import "dotenv/config";
/**
 * FitFirst Database Seed
 * ~80 realistic Indian clothing SKUs across men's, women's, and kids'
 * covering ethnic and western categories.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  // ── Men's Ethnic ──────────────────────────────────────────────────────────
  {
    sku: "M-KU-001", name: "Ivory Cotton Kurta",
    category: "KURTA", gender: "MEN",
    colorFamily: "CREAM_IVORY", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["S", "M", "L", "XL", "2XL"],
    price: 1299, stockQty: 12, daysInStock: 5,
    description: "Pure cotton regular-fit kurta, ideal for daily wear"
  },
  {
    sku: "M-KU-002", name: "Navy Block-Print Kurta",
    category: "KURTA", gender: "MEN",
    colorFamily: "DARK_NEUTRAL", pattern: "BLOCK_PRINT",
    fitType: "STRAIGHT_CUT", sizeRange: ["M", "L", "XL"],
    price: 1799, stockQty: 8, daysInStock: 22,
    description: "Rajasthani block-print cotton kurta, hand-dyed navy"
  },
  {
    sku: "M-KU-003", name: "Mustard Embroidered Kurta",
    category: "KURTA", gender: "MEN",
    colorFamily: "JEWEL_TONES", pattern: "EMBROIDERED",
    fitType: "STRAIGHT_CUT", sizeRange: ["S", "M", "L", "XL", "2XL"],
    price: 2499, stockQty: 6, daysInStock: 45,
    description: "Festive kurta with chest embroidery, perfect for occasions"
  },
  {
    sku: "M-KU-004", name: "Terracotta Checks Kurta",
    category: "KURTA", gender: "MEN",
    colorFamily: "WARM_EARTH", pattern: "CHECKS",
    fitType: "REGULAR", sizeRange: ["S", "M", "L"],
    price: 999, stockQty: 15, daysInStock: 3,
    description: "Casual cotton checks kurta for weekend wear"
  },
  {
    sku: "M-KU-005", name: "White Linen Kurta",
    category: "KURTA", gender: "MEN",
    colorFamily: "WHITE", pattern: "SOLID",
    fitType: "RELAXED_LOOSE", sizeRange: ["M", "L", "XL", "2XL", "3XL"],
    price: 1599, stockQty: 20, daysInStock: 1,
    description: "Breathable linen kurta, summer essential"
  },
  {
    sku: "M-SH-001", name: "Navy Sherwani",
    category: "SHERWANI", gender: "MEN",
    colorFamily: "DARK_NEUTRAL", pattern: "EMBROIDERED",
    fitType: "TAILORED_STRUCTURED", sizeRange: ["38", "40", "42", "44"],
    price: 8999, stockQty: 4, daysInStock: 60,
    description: "Wedding sherwani with gold thread embroidery"
  },
  {
    sku: "M-SH-002", name: "Maroon Sherwani",
    category: "SHERWANI", gender: "MEN",
    colorFamily: "JEWEL_TONES", pattern: "SOLID",
    fitType: "TAILORED_STRUCTURED", sizeRange: ["38", "40", "42"],
    price: 6999, stockQty: 3, daysInStock: 75,
    description: "Rich maroon sherwani for festive occasions"
  },
  {
    sku: "M-DH-001", name: "White Cotton Dhoti",
    category: "DHOTI", gender: "MEN",
    colorFamily: "WHITE", pattern: "SOLID",
    fitType: "WRAPAROUND", sizeRange: ["FREE"],
    price: 599, stockQty: 25, daysInStock: 30,
    description: "Traditional white cotton dhoti, puja and occasion wear"
  },
  // ── Men's Western ─────────────────────────────────────────────────────────
  {
    sku: "M-ST-001", name: "Oxford Blue Formal Shirt",
    category: "SHIRT", gender: "MEN",
    colorFamily: "BRIGHT_COOL", pattern: "SOLID",
    fitType: "SLIM", sizeRange: ["38", "40", "42", "44"],
    price: 1299, stockQty: 18, daysInStock: 10,
    description: "Oxford weave cotton formal shirt"
  },
  {
    sku: "M-ST-002", name: "Coral Linen Shirt",
    category: "SHIRT", gender: "MEN",
    colorFamily: "BRIGHT_WARM", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["S", "M", "L", "XL"],
    price: 999, stockQty: 14, daysInStock: 8,
    description: "Relaxed linen shirt for casual weekends"
  },
  {
    sku: "M-ST-003", name: "Teal Checks Casual Shirt",
    category: "SHIRT", gender: "MEN",
    colorFamily: "JEWEL_TONES", pattern: "CHECKS",
    fitType: "RELAXED_LOOSE", sizeRange: ["M", "L", "XL", "2XL"],
    price: 849, stockQty: 22, daysInStock: 14,
    description: "Soft cotton checks shirt, easy all-day wear"
  },
  {
    sku: "M-ST-004", name: "Cream Linen Shirt",
    category: "SHIRT", gender: "MEN",
    colorFamily: "CREAM_IVORY", pattern: "SOLID",
    fitType: "SLIM", sizeRange: ["S", "M", "L"],
    price: 1099, stockQty: 9, daysInStock: 55,
    description: "Slim linen shirt — great with trousers or jeans"
  },
  {
    sku: "M-TR-001", name: "Charcoal Slim Trousers",
    category: "TROUSERS", gender: "MEN",
    colorFamily: "DARK_NEUTRAL", pattern: "SOLID",
    fitType: "SLIM", sizeRange: ["30", "32", "34", "36"],
    price: 1599, stockQty: 10, daysInStock: 20,
    description: "Slim-fit formal trousers, polyester-viscose blend"
  },
  {
    sku: "M-TR-002", name: "Beige Relaxed Chinos",
    category: "TROUSERS", gender: "MEN",
    colorFamily: "WARM_EARTH", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["30", "32", "34", "36", "38"],
    price: 1299, stockQty: 16, daysInStock: 7,
    description: "Cotton chinos for casual or smart-casual outings"
  },
  {
    sku: "M-JE-001", name: "Dark Indigo Slim Jeans",
    category: "JEANS", gender: "MEN",
    colorFamily: "DARK_NEUTRAL", pattern: "SOLID",
    fitType: "SLIM", sizeRange: ["30", "32", "34", "36"],
    price: 1799, stockQty: 13, daysInStock: 12,
    description: "Classic dark indigo denim slim jeans"
  },
  {
    sku: "M-JE-002", name: "Mid-Wash Regular Jeans",
    category: "JEANS", gender: "MEN",
    colorFamily: "BRIGHT_COOL", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["32", "34", "36", "38"],
    price: 1499, stockQty: 11, daysInStock: 18,
    description: "Mid-wash five-pocket regular jeans, everyday favourite"
  },
  // ── Women's Ethnic ────────────────────────────────────────────────────────
  {
    sku: "W-SA-001", name: "Rose Georgette Saree",
    category: "SAREE", gender: "WOMEN",
    colorFamily: "LIGHT_PASTELS", pattern: "FLORAL",
    fitType: "WRAPAROUND", sizeRange: ["FREE"],
    price: 3499, stockQty: 7, daysInStock: 30,
    description: "Soft georgette saree with floral print, ideal for parties"
  },
  {
    sku: "W-SA-002", name: "Gold Banarasi Silk Saree",
    category: "SAREE", gender: "WOMEN",
    colorFamily: "BRIGHT_WARM", pattern: "PAISLEY",
    fitType: "WRAPAROUND", sizeRange: ["FREE"],
    price: 8999, stockQty: 3, daysInStock: 90,
    description: "Traditional Banarasi silk with gold zari border"
  },
  {
    sku: "W-SA-003", name: "Teal Chanderi Saree",
    category: "SAREE", gender: "WOMEN",
    colorFamily: "JEWEL_TONES", pattern: "EMBROIDERED",
    fitType: "WRAPAROUND", sizeRange: ["FREE"],
    price: 4999, stockQty: 5, daysInStock: 40,
    description: "Chanderi cotton-silk blend with contrast embroidery"
  },
  {
    sku: "W-SA-004", name: "White Mul Cotton Saree",
    category: "SAREE", gender: "WOMEN",
    colorFamily: "WHITE", pattern: "BLOCK_PRINT",
    fitType: "WRAPAROUND", sizeRange: ["FREE"],
    price: 1999, stockQty: 9, daysInStock: 15,
    description: "Handblock-printed mul cotton, daily drape"
  },
  {
    sku: "W-SK-001", name: "Lavender Salwar Kameez",
    category: "SALWAR_KAMEEZ", gender: "WOMEN",
    colorFamily: "LIGHT_PASTELS", pattern: "EMBROIDERED",
    fitType: "STRAIGHT_CUT", sizeRange: ["XS", "S", "M", "L", "XL"],
    price: 2299, stockQty: 10, daysInStock: 20,
    description: "Soft lavender suit with light chest embroidery"
  },
  {
    sku: "W-SK-002", name: "Rust Anarkali Suit",
    category: "SALWAR_KAMEEZ", gender: "WOMEN",
    colorFamily: "WARM_EARTH", pattern: "SOLID",
    fitType: "FLARED_ANARKALI", sizeRange: ["S", "M", "L", "XL"],
    price: 2999, stockQty: 8, daysInStock: 35,
    description: "Flairy anarkali in earthy rust, festive casual"
  },
  {
    sku: "W-SK-003", name: "Navy Block-Print Straight Suit",
    category: "SALWAR_KAMEEZ", gender: "WOMEN",
    colorFamily: "DARK_NEUTRAL", pattern: "BLOCK_PRINT",
    fitType: "STRAIGHT_CUT", sizeRange: ["S", "M", "L"],
    price: 1799, stockQty: 12, daysInStock: 10,
    description: "Ajrakh block-print cotton suit, everyday chic"
  },
  {
    sku: "W-LH-001", name: "Magenta Lehenga",
    category: "LEHENGA", gender: "WOMEN",
    colorFamily: "BRIGHT_COOL", pattern: "EMBROIDERED",
    fitType: "FLARED_ANARKALI", sizeRange: ["XS", "S", "M", "L"],
    price: 5999, stockQty: 4, daysInStock: 55,
    description: "Wedding lehenga in bright magenta with mirror work"
  },
  {
    sku: "W-LH-002", name: "Turquoise Floral Lehenga",
    category: "LEHENGA", gender: "WOMEN",
    colorFamily: "JEWEL_TONES", pattern: "FLORAL",
    fitType: "FLARED_ANARKALI", sizeRange: ["XS", "S", "M"],
    price: 4499, stockQty: 5, daysInStock: 65,
    description: "Printed floral lehenga for sangeet or festival"
  },
  {
    sku: "W-DU-001", name: "Ivory Embroidered Dupatta",
    category: "DUPATTA", gender: "WOMEN",
    colorFamily: "CREAM_IVORY", pattern: "EMBROIDERED",
    fitType: "WRAPAROUND", sizeRange: ["FREE"],
    price: 799, stockQty: 18, daysInStock: 25,
    description: "Versatile ivory dupatta with delicate phulkari"
  },
  {
    sku: "W-KU-001", name: "Peach Short Kurta",
    category: "KURTA", gender: "WOMEN",
    colorFamily: "LIGHT_PASTELS", pattern: "SOLID",
    fitType: "A_LINE", sizeRange: ["XS", "S", "M", "L", "XL"],
    price: 899, stockQty: 14, daysInStock: 8,
    description: "Breezy short kurta, pairs with palazzos or jeans"
  },
  {
    sku: "W-KU-002", name: "Emerald Paisley Long Kurta",
    category: "KURTA", gender: "WOMEN",
    colorFamily: "BRIGHT_COOL", pattern: "PAISLEY",
    fitType: "A_LINE", sizeRange: ["S", "M", "L", "XL", "2XL"],
    price: 1399, stockQty: 10, daysInStock: 22,
    description: "Vibrant paisley print long kurta for ethnic occasions"
  },
  // ── Women's Western ───────────────────────────────────────────────────────
  {
    sku: "W-DR-001", name: "Burgundy Wrap Dress",
    category: "DRESS", gender: "WOMEN",
    colorFamily: "JEWEL_TONES", pattern: "SOLID",
    fitType: "WRAPAROUND", sizeRange: ["XS", "S", "M", "L"],
    price: 1999, stockQty: 8, daysInStock: 30,
    description: "Classic wrap dress in rich burgundy, office to dinner"
  },
  {
    sku: "W-DR-002", name: "Floral A-Line Midi Dress",
    category: "DRESS", gender: "WOMEN",
    colorFamily: "BRIGHT_COOL", pattern: "FLORAL",
    fitType: "A_LINE", sizeRange: ["S", "M", "L"],
    price: 1799, stockQty: 11, daysInStock: 5,
    description: "Midi A-line dress with summer floral print"
  },
  {
    sku: "W-JE-001", name: "Dark Wash Slim Jeans",
    category: "JEANS", gender: "WOMEN",
    colorFamily: "DARK_NEUTRAL", pattern: "SOLID",
    fitType: "SLIM", sizeRange: ["26", "28", "30", "32"],
    price: 1699, stockQty: 15, daysInStock: 6,
    description: "High-rise dark wash slim jeans"
  },
  {
    sku: "W-JA-001", name: "Mustard Cotton Jacket",
    category: "JACKET", gender: "WOMEN",
    colorFamily: "JEWEL_TONES", pattern: "SOLID",
    fitType: "TAILORED_STRUCTURED", sizeRange: ["S", "M", "L"],
    price: 2799, stockQty: 6, daysInStock: 50,
    description: "Structured cotton jacket in warm mustard — statement layer"
  },
  // ── Unisex ────────────────────────────────────────────────────────────────
  {
    sku: "U-JA-001", name: "Indigo Denim Jacket",
    category: "JACKET", gender: "UNISEX",
    colorFamily: "BRIGHT_COOL", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["S", "M", "L", "XL"],
    price: 2499, stockQty: 10, daysInStock: 28,
    description: "Classic indigo denim jacket — timeless unisex staple"
  },
  // ── Kids' Ethnic ──────────────────────────────────────────────────────────
  {
    sku: "K-KU-001", name: "Red Kids Kurta (Boy)",
    category: "KIDS_KURTA", gender: "KIDS",
    colorFamily: "BRIGHT_WARM", pattern: "EMBROIDERED",
    fitType: "STRAIGHT_CUT", sizeRange: ["2Y", "4Y", "6Y", "8Y"],
    price: 799, stockQty: 12, daysInStock: 15,
    description: "Festival kurta for boys, red with gold embroidery"
  },
  {
    sku: "K-KU-002", name: "Yellow Kids Kurta (Boy)",
    category: "KIDS_KURTA", gender: "KIDS",
    colorFamily: "BRIGHT_WARM", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["4Y", "6Y", "8Y", "10Y"],
    price: 649, stockQty: 9, daysInStock: 22,
    description: "Cheerful yellow cotton kurta for young boys"
  },
  {
    sku: "K-DR-001", name: "Pink Floral Kids Dress",
    category: "KIDS_DRESS", gender: "KIDS",
    colorFamily: "LIGHT_PASTELS", pattern: "FLORAL",
    fitType: "A_LINE", sizeRange: ["2Y", "4Y", "6Y", "8Y"],
    price: 849, stockQty: 10, daysInStock: 18,
    description: "Festive frock for girls with floral print"
  },
  {
    sku: "K-DR-002", name: "Purple Kids Lehenga Dress",
    category: "KIDS_DRESS", gender: "KIDS",
    colorFamily: "BRIGHT_COOL", pattern: "EMBROIDERED",
    fitType: "FLARED_ANARKALI", sizeRange: ["4Y", "6Y", "8Y"],
    price: 1299, stockQty: 7, daysInStock: 40,
    description: "Mini lehenga choli set for little girls, occasions"
  },
  {
    sku: "K-SH-001", name: "Checks Kids Shirt (Boy)",
    category: "KIDS_SHIRT", gender: "KIDS",
    colorFamily: "JEWEL_TONES", pattern: "CHECKS",
    fitType: "REGULAR", sizeRange: ["4Y", "6Y", "8Y", "10Y", "12Y"],
    price: 499, stockQty: 16, daysInStock: 10,
    description: "Classic checks cotton shirt for boys"
  },
  {
    sku: "K-TR-001", name: "Navy Kids Trousers",
    category: "KIDS_TROUSERS", gender: "KIDS",
    colorFamily: "DARK_NEUTRAL", pattern: "SOLID",
    fitType: "STRAIGHT_CUT", sizeRange: ["4Y", "6Y", "8Y", "10Y"],
    price: 449, stockQty: 14, daysInStock: 12,
    description: "Smart navy trousers for school or occasions"
  },
  // ── Accessories ───────────────────────────────────────────────────────────
  {
    sku: "A-AC-001", name: "Copper Zardozi Clutch",
    category: "ACCESSORIES", gender: "WOMEN",
    colorFamily: "WARM_EARTH", pattern: "EMBROIDERED",
    fitType: "REGULAR", sizeRange: ["FREE"],
    price: 1299, stockQty: 6, daysInStock: 55,
    description: "Handcrafted zardozi clutch bag, perfect for ethnic occasions"
  },
  {
    sku: "A-AC-002", name: "Black Men's Pocket Square Set",
    category: "ACCESSORIES", gender: "MEN",
    colorFamily: "DARK_NEUTRAL", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["FREE"],
    price: 299, stockQty: 20, daysInStock: 70,
    description: "Set of 3 cotton pocket squares for formal wear"
  },
  // Additional variety items for better scoring distribution
  {
    sku: "W-SK-004", name: "Green Georgette Suit",
    category: "SALWAR_KAMEEZ", gender: "WOMEN",
    colorFamily: "BRIGHT_COOL", pattern: "SOLID",
    fitType: "STRAIGHT_CUT", sizeRange: ["S", "M", "L", "XL", "2XL"],
    price: 1999, stockQty: 7, daysInStock: 25,
    description: "Lightweight georgette straight suit in bottle green"
  },
  {
    sku: "M-KU-006", name: "Pastel Blue Khadi Kurta",
    category: "KURTA", gender: "MEN",
    colorFamily: "LIGHT_PASTELS", pattern: "SOLID",
    fitType: "REGULAR", sizeRange: ["S", "M", "L", "XL"],
    price: 1199, stockQty: 11, daysInStock: 17,
    description: "Handspun khadi kurta in calming pastel blue"
  },
  {
    sku: "W-KU-003", name: "Crimson Bandhani Kurta",
    category: "KURTA", gender: "WOMEN",
    colorFamily: "BRIGHT_WARM", pattern: "ABSTRACT",
    fitType: "A_LINE", sizeRange: ["XS", "S", "M", "L"],
    price: 1599, stockQty: 8, daysInStock: 32,
    description: "Traditional Bandhani tie-dye kurta in vibrant crimson"
  },
  {
    sku: "M-ST-005", name: "Printed Geometric Shirt",
    category: "SHIRT", gender: "MEN",
    colorFamily: "MULTICOLOR", pattern: "GEOMETRIC",
    fitType: "REGULAR", sizeRange: ["S", "M", "L", "XL"],
    price: 1099, stockQty: 9, daysInStock: 42,
    description: "Bold geometric print shirt for weekend outings"
  },
  {
    sku: "W-DR-003", name: "Coral Striped Shirt Dress",
    category: "DRESS", gender: "WOMEN",
    colorFamily: "BRIGHT_WARM", pattern: "STRIPES",
    fitType: "STRAIGHT_CUT", sizeRange: ["XS", "S", "M", "L"],
    price: 1399, stockQty: 12, daysInStock: 9,
    description: "Smart shirt dress in coral stripes, office casual"
  },
  {
    sku: "W-SK-005", name: "Ivory Palazzo Suit",
    category: "SALWAR_KAMEEZ", gender: "WOMEN",
    colorFamily: "CREAM_IVORY", pattern: "EMBROIDERED",
    fitType: "RELAXED_LOOSE", sizeRange: ["S", "M", "L", "XL", "2XL"],
    price: 2699, stockQty: 6, daysInStock: 28,
    description: "Elegant palazzo set in ivory with neckline embroidery"
  },
];

async function main() {
  console.log("🌱 Seeding FitFirst database...");

  if (process.env.NODE_ENV === "production" || process.env.FITFIRST_DEMO_SEED !== "1") {
    throw new Error("Demo seeding is disabled. Use FITFIRST_DEMO_SEED=1 only with an empty development database.");
  }
  const records = await Promise.all([prisma.product.count(), prisma.customerSession.count(), prisma.dailyBaseline.count(), prisma.killThreshold.count()]);
  if (records.some(count => count > 0)) throw new Error("Refusing to overwrite existing data. Demo seeding requires an empty database.");

  // Empty development database only
  await prisma.purchaseEvent.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.dailyBaseline.deleteMany();
  await prisma.product.deleteMany();
  await prisma.killThreshold.deleteMany();

  console.log(`  ✓ Cleared existing data`);

  // Insert products
  let inserted = 0;
  for (const p of products) {
    await prisma.product.create({ data: p as any });
    inserted++;
  }
  console.log(`  ✓ Inserted ${inserted} products`);

  // Seed some baseline data (2 weeks pre-kiosk)
  const baselineData = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i - 14);
    const transactions = 18 + Math.floor(Math.random() * 12);
    const totalRevenue = transactions * (2200 + Math.floor(Math.random() * 1800));
    baselineData.push({
      date,
      totalTransactions: transactions,
      totalRevenue,
      avgBasketValue: totalRevenue / transactions,
      avgUnitsPerCustomer: 1.4 + Math.random() * 0.6,
      isKioskActive: false,
      notes: "DEMO: generated pre-kiosk baseline; not store performance",
    });
  }

  for (const b of baselineData) {
    await prisma.dailyBaseline.create({ data: b });
  }
  console.log(`  ✓ Inserted 14 days of baseline data`);

  // Default kill threshold — to be confirmed and locked by Ravi before pilot
  await prisma.killThreshold.create({
    data: {
      minBasketValueLiftPct: 15,
      minRecommendedPurchaseRate: 0.30,
      minUsageRatePct: 0.40,
      pilotWeeks: 4,
      lockedAt: new Date(),
      lockedBy: "Ravi",
    },
  });
  console.log(`  ✓ Seeded default kill threshold (15% basket lift, 30% conversion, 40% usage)`);
  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
