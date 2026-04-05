-- Enable RLS on Tenant-Aware Tables
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- Note: We are deliberately NOT enabling RLS on "companies" and "license_keys" 
-- because these are global tables managed by SUPERADMIN or during Registration/Login.

-- Create Policies for products
CREATE POLICY products_isolation_policy ON "products"
FOR ALL
USING ("company_id"::text = current_setting('app.current_tenant', true));

-- Create Policies for sales
CREATE POLICY sales_isolation_policy ON "sales"
FOR ALL
USING ("company_id"::text = current_setting('app.current_tenant', true));

-- Create Policies for sale_items (needs a joined check since sale_items doesn't have company_id directly, or we can use the sale_id)
-- Note: schema.prisma does not have company_id on sale_items. 
-- We enforce RLS by joining the sale table.
CREATE POLICY sale_items_isolation_policy ON "sale_items"
FOR ALL
USING (EXISTS (
  SELECT 1 FROM "sales" 
  WHERE "sales"."id" = "sale_items"."sale_id" 
  AND "sales"."company_id"::text = current_setting('app.current_tenant', true)
));

-- Create Policies for stock_movements
CREATE POLICY stock_movements_isolation_policy ON "stock_movements"
FOR ALL
USING ("company_id"::text = current_setting('app.current_tenant', true));

-- Create Policies for expenses
CREATE POLICY expenses_isolation_policy ON "expenses"
FOR ALL
USING ("company_id"::text = current_setting('app.current_tenant', true));

-- Create Policies for users
CREATE POLICY users_isolation_policy ON "users"
FOR ALL
USING ("company_id"::text = current_setting('app.current_tenant', true));

-- Create Policies for audit_logs
CREATE POLICY audit_logs_isolation_policy ON "audit_logs"
FOR ALL
USING ("company_id"::text = current_setting('app.current_tenant', true));