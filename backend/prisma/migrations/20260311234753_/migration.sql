/*
  Warnings:

  - You are about to drop the column `cost_ht` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `price_ht` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - Added the required column `sale_price_ht` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `standard_cost` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ArticleType" ADD VALUE 'SIMPLE';
ALTER TYPE "ArticleType" ADD VALUE 'COMPOSED';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "cost_ht",
DROP COLUMN "price_ht",
DROP COLUMN "stock",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "internal_reference" TEXT,
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_stock" INTEGER,
ADD COLUMN     "sale_price_ht" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "standard_cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0;
