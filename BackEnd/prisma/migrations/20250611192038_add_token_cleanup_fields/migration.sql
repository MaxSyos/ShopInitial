/*
  Warnings:

  - Added the required column `updatedAt` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_tokens" 
-- Primeiro adiciona as colunas com DEFAULT
ADD COLUMN "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Atualiza os registros existentes
UPDATE "refresh_tokens" 
SET "lastUsed" = "createdAt",
    "updatedAt" = CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_lastUsed_idx" ON "refresh_tokens"("lastUsed");
