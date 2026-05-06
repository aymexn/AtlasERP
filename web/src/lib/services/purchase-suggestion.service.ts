import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface PurchaseSuggestion {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  committedStock: number;
  neededForMO: number;
  availableStock: number;
  suggestedQuantity: number;
  preferredSupplierId: string | null;
  supplierName: string | null;
  unit: string;
  unitPriceHt: number;
  isCritical: boolean;
}

export class PurchaseSuggestionService {

  static async analyzePurchaseNeeds(companyId: string): Promise<PurchaseSuggestion[]> {
    // 1. Get all active products that are raw materials or packaging (and potentially finished products if bought)
    const products = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        // We only buy Raw Materials, Packaging, or simple items
        articleType: { in: ['RAW_MATERIAL', 'PACKAGING', 'SIMPLE', 'CONSUMABLE'] },
        trackStock: true
      },
      include: {
        preferredSupplier: true
      }
    });

    const suggestions: PurchaseSuggestion[] = [];

    for (const product of products) {
      const stockQuantity = Number(product.stockQuantity || 0);
      const minStock = Number(product.minStock || 0);

      // 2. Calculate Committed Stock (needed for Open Sales Orders - though rare for raw materials, good to have)
      const openSalesLines = await prisma.salesOrderLine.findMany({
        where: {
          productId: product.id,
          salesOrder: {
            companyId,
            status: { in: ['VALIDATED', 'PREPARING'] } // Orders not yet shipped
          }
        }
      });
      const committedStockForSales = openSalesLines.reduce((acc, line) => acc + Number(line.quantity), 0);

      // 3. Calculate Needed for Manufacturing Orders (Raw Materials allocated to PLANNED/IN_PROGRESS MOs)
      const openMOLines = await prisma.manufacturingOrderLine.findMany({
        where: {
          componentProductId: product.id,
          manufacturingOrder: {
            companyId,
            status: { in: ['PLANNED', 'IN_PROGRESS'] }
          }
        }
      });
      const neededForMO = openMOLines.reduce((acc, line) => {
        // Only count what hasn't been consumed yet
        const remainingToConsume = Number(line.requiredQuantity) - Number(line.consumedQuantity);
        return acc + (remainingToConsume > 0 ? remainingToConsume : 0);
      }, 0);

      const committedStock = committedStockForSales + neededForMO;
      const availableStock = stockQuantity - committedStock;

      // 4. Check if we need to order
      // We order if available stock is below the minimum threshold.
      // Even if stockQuantity > 0, high committedStock might trigger an order.
      if (availableStock < minStock) {
        // Algorithm: required quantity = (minStock * 2) - availableStock
        let suggestedQuantity = (minStock * 2) - availableStock;
        
        // Safety check: if minStock is 0 but stock is negative, order enough to get to at least 0 plus a buffer
        if (suggestedQuantity <= 0 && availableStock < 0) {
            suggestedQuantity = Math.abs(availableStock) * 1.5; // Order 50% more than negative gap
        }
        
        if (suggestedQuantity > 0) {
            suggestions.push({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                currentStock: stockQuantity,
                minStock: minStock,
                committedStock: committedStockForSales,
                neededForMO: neededForMO,
                availableStock: availableStock,
                suggestedQuantity: Math.ceil(suggestedQuantity),
                preferredSupplierId: product.preferredSupplierId,
                supplierName: product.preferredSupplier?.name || null,
                unit: product.unit,
                unitPriceHt: Number(product.purchasePriceHt || 0),
                isCritical: stockQuantity <= 0
            });
        }
      }
    }

    // Sort by criticality then by supplier
    return suggestions.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return (a.supplierName || '').localeCompare(b.supplierName || '');
    });
  }

  static async generatePurchaseOrders(companyId: string, suggestions: any[]) {
    // 1. Group suggestions by Supplier ID
    const groupedBySupplier = suggestions.reduce((acc: any, curr: any) => {
        const supplierId = curr.preferredSupplierId || 'NO_SUPPLIER';
        if (!acc[supplierId]) {
            acc[supplierId] = [];
        }
        acc[supplierId].push(curr);
        return acc;
    }, {});

    let generatedCount = 0;
    const generatedPOs = [];

    // 2. Create Draft Purchase Orders
    for (const supplierId of Object.keys(groupedBySupplier)) {
        if (supplierId === 'NO_SUPPLIER') {
            // Skip items without supplier, or maybe create a generic one? 
            // Usually, an ERP shouldn't create a PO without a supplier.
            console.warn("Skipped generating PO for items without a preferred supplier.");
            continue;
        }

        const items = groupedBySupplier[supplierId];
        
        // Calculate totals
        let totalHt = 0;
        const linesData = items.map((item: any) => {
            const qty = Number(item.suggestedQuantity);
            const price = Number(item.unitPriceHt || 0);
            const lineTotal = qty * price;
            totalHt += lineTotal;
            
            return {
                productId: item.productId,
                quantity: qty,
                unit: item.unit,
                unitPriceHt: price,
                taxRate: 0.19, // Default standard Algerian VAT
                totalHt: lineTotal,
                note: 'Generated by Auto-Replenishment Engine'
            };
        });

        const totalTva = totalHt * 0.19;
        const totalTtc = totalHt + totalTva;

        // Count existing POs today to generate reference
        const countToday = await prisma.purchaseOrder.count({
            where: {
                companyId,
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });
        
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const reference = `BCF-${dateStr}-${String(countToday + generatedCount + 1).padStart(3, '0')}`;

        // Use a transaction to ensure lines and PO are created together
        const po = await prisma.$transaction(async (tx) => {
            return await tx.purchaseOrder.create({
                data: {
                    companyId,
                    reference,
                    supplierId,
                    status: 'DRAFT',
                    orderDate: new Date(),
                    expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default expected in 7 days
                    totalHt,
                    totalTva,
                    totalTtc,
                    notes: 'Auto-generated Purchase Order based on critical stock levels.',
                    lines: {
                        create: linesData
                    }
                }
            });
        });

        generatedPOs.push(po);
        generatedCount++;
    }

    return {
        count: generatedCount,
        pos: generatedPOs,
        message: `${generatedCount} Bon(s) de commande Brouillon(s) généré(s) avec succès.`
    };
  }
}
