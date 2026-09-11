-- CreateEnum
CREATE TYPE "Category" AS ENUM ('KURTA', 'SAREE', 'SALWAR_KAMEEZ', 'LEHENGA', 'SHERWANI', 'DHOTI', 'DUPATTA', 'SHIRT', 'TROUSERS', 'JEANS', 'DRESS', 'SKIRT', 'JACKET', 'KIDS_KURTA', 'KIDS_SHIRT', 'KIDS_TROUSERS', 'KIDS_DRESS', 'ACCESSORIES');

-- CreateEnum
CREATE TYPE "ColorFamily" AS ENUM ('WHITE', 'CREAM_IVORY', 'LIGHT_PASTELS', 'WARM_EARTH', 'BRIGHT_WARM', 'BRIGHT_COOL', 'DARK_NEUTRAL', 'JEWEL_TONES', 'MULTICOLOR');

-- CreateEnum
CREATE TYPE "Pattern" AS ENUM ('SOLID', 'STRIPES', 'CHECKS', 'FLORAL', 'GEOMETRIC', 'PAISLEY', 'EMBROIDERED', 'BLOCK_PRINT', 'ABSTRACT', 'ANIMAL_PRINT');

-- CreateEnum
CREATE TYPE "FitType" AS ENUM ('SLIM', 'REGULAR', 'RELAXED_LOOSE', 'FLARED_ANARKALI', 'STRAIGHT_CUT', 'A_LINE', 'WRAPAROUND', 'TAILORED_STRUCTURED');

-- CreateEnum
CREATE TYPE "SkinToneBucket" AS ENUM ('FAIR', 'WHEATISH', 'MEDIUM', 'DEEP');

-- CreateEnum
CREATE TYPE "BodyShapeBucket" AS ENUM ('RECTANGLE', 'TRIANGLE', 'INVERTED_T', 'HOURGLASS');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'KIDS', 'UNISEX');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "Category" NOT NULL,
    "gender" "Gender" NOT NULL,
    "colorFamily" "ColorFamily" NOT NULL,
    "pattern" "Pattern" NOT NULL,
    "fitType" "FitType" NOT NULL,
    "sizeRange" TEXT[],
    "price" INTEGER NOT NULL,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "daysInStock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL,
    "skinToneBucket" "SkinToneBucket" NOT NULL,
    "bodyShapeBucket" "BodyShapeBucket" NOT NULL,
    "gender" "Gender" NOT NULL,
    "sizeInput" TEXT NOT NULL,
    "preferenceTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "wasRecommended" BOOLEAN NOT NULL,
    "amount" INTEGER NOT NULL,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBaseline" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "totalRevenue" INTEGER NOT NULL,
    "avgBasketValue" DOUBLE PRECISION NOT NULL,
    "avgUnitsPerCustomer" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "isKioskActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KillThreshold" (
    "id" TEXT NOT NULL,
    "minBasketValueLiftPct" DOUBLE PRECISION NOT NULL,
    "minRecommendedPurchaseRate" DOUBLE PRECISION NOT NULL,
    "minUsageRatePct" DOUBLE PRECISION NOT NULL,
    "pilotWeeks" INTEGER NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KillThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Recommendation_sessionId_idx" ON "Recommendation"("sessionId");

-- CreateIndex
CREATE INDEX "Recommendation_productId_idx" ON "Recommendation"("productId");

-- CreateIndex
CREATE INDEX "PurchaseEvent_sessionId_idx" ON "PurchaseEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PurchaseEvent_productId_idx" ON "PurchaseEvent"("productId");

-- CreateIndex
CREATE INDEX "PurchaseEvent_createdAt_idx" ON "PurchaseEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBaseline_date_key" ON "DailyBaseline"("date");

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CustomerSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseEvent" ADD CONSTRAINT "PurchaseEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CustomerSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseEvent" ADD CONSTRAINT "PurchaseEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
