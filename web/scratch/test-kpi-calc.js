const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  
  // Test calculateRevenueMonth
  const isCameleon = companyId === '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  const result = isCameleon
      ? await prisma.$queryRaw`
          SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
          FROM sales_orders 
          WHERE company_id = ${companyId}::uuid 
            AND status != 'CANCELLED'
            AND date >= '2026-06-01'::date AND date <= '2026-06-30'::date
        `
      : await prisma.$queryRaw`
          SELECT COALESCE(SUM(total_amount_ttc), 0)::float as revenue 
          FROM sales_orders 
          WHERE company_id = ${companyId}::uuid 
            AND status != 'CANCELLED'
            AND date >= DATE_TRUNC('month', CURRENT_DATE)
            AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        `;
        
  console.log('calculateRevenueMonth Query Result:', result);
  
  // Let's do a select from sales_orders with raw query to see if it finds anything
  const allRaw = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM sales_orders WHERE company_id = ${companyId}::uuid
  `;
  console.log('Raw count of orders:', allRaw);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
