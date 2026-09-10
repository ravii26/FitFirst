-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "aiConfidence" JSONB,
ADD COLUMN     "aiEngine" TEXT,
ADD COLUMN     "aiTagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CustomerSession" ADD COLUMN     "recommendationSnapshot" JSONB,
ADD COLUMN     "requestKey" TEXT;

-- AlterTable
ALTER TABLE "PurchaseEvent" ADD COLUMN     "requestKey" TEXT;

-- CreateTable
CREATE TABLE "StaffSession" (
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE INDEX "StaffSession_expiresAt_idx" ON "StaffSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSession_requestKey_key" ON "CustomerSession"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseEvent_requestKey_key" ON "PurchaseEvent"("requestKey");

