/*
  Warnings:

  - Added the required column `number` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "complement" TEXT,
ADD COLUMN     "number" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "updatedAt" DROP DEFAULT;
