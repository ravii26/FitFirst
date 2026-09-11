-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "aiConfidence" JSONB,
ADD COLUMN     "aiEngine" TEXT,
ADD COLUMN     "aiTagged" BOOLEAN NOT NULL DEFAULT false;
