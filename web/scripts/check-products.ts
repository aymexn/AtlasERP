import { prisma } from '../src/lib/prisma';

async function main() {
  const products = await prisma.product.findMany();
  console.log("=========================================");
  console.log("Database Product State Check");
  console.log("=========================================");
  console.log("Total products count:", products.length);
  
  const lowStock = products.filter(p => Number(p.stockQuantity) <= Number(p.reorderPoint));
  console.log("Low stock products count:", lowStock.length);
  
  if (lowStock.length > 0) {
    console.log("Low stock products:", lowStock.map(p => ({
      name: p.name,
      stock: p.stockQuantity,
      reorderPoint: p.reorderPoint
    })));
  } else if (products.length > 0) {
    console.log("No low stock products found. Modifying the first product to trigger low stock recommendation...");
    const firstProduct = products[0];
    await prisma.product.update({
      where: { id: firstProduct.id },
      data: {
        stockQuantity: 0,
        reorderPoint: 10
      }
    });
    console.log(`Product "${firstProduct.name}" modified successfully (stockQuantity=0, reorderPoint=10).`);
  } else {
    console.log("No products exist in database. Creating a test product...");
    // Let's find first company to attach to
    const company = await prisma.company.findFirst();
    if (company) {
      const newProduct = await prisma.product.create({
        data: {
          companyId: company.id,
          name: "Peinture Rouge Satinée",
          sku: "PEINT-ROUGE-01",
          stockQuantity: 0,
          reorderPoint: 10,
          salePriceHt: 4500,
          purchasePriceHt: 3000,
          isActive: true
        } as any
      });
      console.log(`Product "${newProduct.name}" created successfully.`);
    } else {
      console.log("Error: No company found in database to attach product to.");
    }
  }
  console.log("=========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
