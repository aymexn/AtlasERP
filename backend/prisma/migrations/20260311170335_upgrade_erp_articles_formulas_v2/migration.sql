-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT', 'SEMI_FINISHED', 'PACKAGING', 'SERVICE');

-- AlterTable
ALTER TABLE "product_families" ADD COLUMN     "code" TEXT,
ADD COLUMN     "color_badge" TEXT,
ADD COLUMN     "parent_id" UUID,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "article_type" "ArticleType" NOT NULL DEFAULT 'FINISHED_PRODUCT',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "min_stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "purchase_price_ht" DECIMAL(10,2),
ADD COLUMN     "secondary_name" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs';

-- CreateTable
CREATE TABLE "product_formulas" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "notes" TEXT,
    "yield_qty" DECIMAL(12,3) NOT NULL DEFAULT 1.0,
    "yield_unit" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_formula_lines" (
    "id" UUID NOT NULL,
    "formula_id" UUID NOT NULL,
    "component_product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "wastage_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_formula_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_formulas_company_id_idx" ON "product_formulas"("company_id");

-- CreateIndex
CREATE INDEX "product_formulas_product_id_idx" ON "product_formulas"("product_id");

-- CreateIndex
CREATE INDEX "product_formula_lines_formula_id_idx" ON "product_formula_lines"("formula_id");

-- AddForeignKey
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_formulas" ADD CONSTRAINT "product_formulas_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_formulas" ADD CONSTRAINT "product_formulas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_formula_lines" ADD CONSTRAINT "product_formula_lines_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "product_formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_formula_lines" ADD CONSTRAINT "product_formula_lines_component_product_id_fkey" FOREIGN KEY ("component_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
