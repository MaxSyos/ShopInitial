/*
  Warnings:

  - The `paymentMethod` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'PIX', 'BOLETO');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_WAITING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardExpiryMonth" INTEGER,
ADD COLUMN     "cardExpiryYear" INTEGER,
ADD COLUMN     "cardLastFour" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "pixCode" TEXT,
ADD COLUMN     "pixExpiresAt" TIMESTAMP(3),
ADD COLUMN     "pixQrCode" TEXT,
ADD COLUMN     "processorFee" DECIMAL(10,2),
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'MERCADOPAGO',
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CREDIT_CARD';
