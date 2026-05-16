-- Normalize Article Types for Supply Chain Simulation
-- MP001-MP004 should be RAW_MATERIAL
-- EMB01-EMB02 should be PACKAGING

BEGIN;

-- Update MP004 from FINISHED_PRODUCT to RAW_MATERIAL
UPDATE products 
SET article_type = 'RAW_MATERIAL' 
WHERE sku = 'MP004' AND article_type = 'FINISHED_PRODUCT';

-- Update EMB01, EMB02 from RAW_MATERIAL to PACKAGING
UPDATE products 
SET article_type = 'PACKAGING' 
WHERE sku IN ('EMB01', 'EMB02') AND article_type = 'RAW_MATERIAL';

COMMIT;

-- Verification query
SELECT sku, name, article_type FROM products WHERE sku IN ('MP004', 'EMB01', 'EMB02');
