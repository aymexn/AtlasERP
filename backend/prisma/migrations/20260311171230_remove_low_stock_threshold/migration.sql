/*
  Warnings:

  - You are about to drop the column `low_stock_threshold` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "low_stock_threshold";
