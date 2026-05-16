-- Fix SKUs
UPDATE "products" SET "sku" = 'MP002' WHERE "sku" = 'RE50';
UPDATE "products" SET "sku" = 'MP003' WHERE "sku" = 'SD40';
UPDATE "products" SET "sku" = 'EMB01' WHERE "sku" = 'pot';

-- Fix Units
UPDATE "products" SET "unit" = 'kg' WHERE "sku" IN ('MP001', 'MP002');
UPDATE "products" SET "unit" = 'L' WHERE "sku" = 'MP003';
UPDATE "products" SET "unit" = 'pcs' WHERE "sku" = 'EMB01';

-- Fix Quantities for REC-202605-0001
UPDATE "stock_reception_lines" 
SET "received_qty" = 120 
WHERE "reception_id" = (SELECT "id" FROM "stock_receptions" WHERE "reference" = 'REC-202605-0001')
AND "product_id" = (SELECT "id" FROM "products" WHERE "sku" = 'EMB01');
