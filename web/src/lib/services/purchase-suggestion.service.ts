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
  pendingPurchaseOrders: number;
  suggestedQuantity: number;
  preferredSupplierId: string | null;
  supplierName: string | null;
  unit: string;
  unitPriceHt: number;
  isCritical: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export class PurchaseSuggestionService {

  static async analyzePurchaseNeeds(companyId: string): Promise<PurchaseSuggestion[]> {
    // 1. Get all active products that are trackable
    const products = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        trackStock: true
      },
      include: {
        preferredSupplier: true,
        stocks: true
      }
    });

    const suggestions: PurchaseSuggestion[] = [];

    for (const product of products) {
      const stockQuantity = Number(product.stockQuantity || 0);
      const minStock = Number(product.minStock || 0);
      const reasons: string[] = [];

      // 2. Calculate Needed for Manufacturing Orders (Raw Materials allocated to PLANNED/IN_PROGRESS MOs)
      const openMOLines = await prisma.manufacturingOrderLine.findMany({
        where: {
          componentProductId: product.id,
          manufacturingOrder: {
            companyId,
            status: { in: ['PLANNED', 'IN_PROGRESS'] }
          }
        },
        include: {
          manufacturingOrder: true
        }
      });
      
      const neededForMO = openMOLines.reduce((acc, line) => {
        const remainingToConsume = Number(line.requiredQuantity) - Number(line.consumedQuantity);
        if (remainingToConsume > 0) {
          reasons.push(`OF ${line.manufacturingOrder.reference}: ${remainingToConsume} ${line.unit}`);
        }
        return acc + (remainingToConsume > 0 ? remainingToConsume : 0);
      }, 0);

      // 3. Calculate Pending Purchase Orders (Already ordered but not received)
      const pendingPOLines = await prisma.purchaseOrderLine.findMany({
        where: {
          productId: product.id,
          purchaseOrder: {
            companyId,
            status: { in: ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] }
          }
        }
      });
      
      const pendingPurchaseOrders = pendingPOLines.reduce((acc, line) => {
        const remainingToReceive = Number(line.quantity) - Number(line.receivedQty);
        return acc + (remainingToReceive > 0 ? remainingToReceive : 0);
      }, 0);

      // 4. Calculate Net Need
      // Demand = neededForMO + (minStock if stockQuantity < minStock)
      // Supply = stockQuantity + pendingPurchaseOrders
      
      const deficitToMinStock = Math.max(0, minStock - stockQuantity);
      if (deficitToMinStock > 0) {
        reasons.push(`Seuil min: ${minStock}, Actuel: ${stockQuantity}`);
      }

      const totalDemand = neededForMO + deficitToMinStock;
      const totalSupply = stockQuantity + pendingPurchaseOrders;
      const netNeed = totalDemand - (stockQuantity + pendingPurchaseOrders); // Actually we should subtract totalSupply from totalDemand

      // Logic: If (stock + pending) < (MO_required + min_stock), then we need to buy.
      const rawGap = (neededForMO + minStock) - (stockQuantity + pendingPurchaseOrders);

      if (rawGap > 0) {
        const suggestedQuantity = Math.ceil(rawGap);
        
        // Determine Priority
        let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
        if (neededForMO > 0 && stockQuantity <= 0) {
          priority = 'critical';
        } else if (stockQuantity < minStock * 0.3) {
          priority = 'high';
        } else if (stockQuantity < minStock) {
          priority = 'medium';
        } else {
          priority = 'low';
        }

        suggestions.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: stockQuantity,
          minStock: minStock,
          committedStock: 0, // Legacy field
          neededForMO: neededForMO,
          availableStock: stockQuantity - neededForMO,
          pendingPurchaseOrders: pendingPurchaseOrders,
          suggestedQuantity: suggestedQuantity,
          preferredSupplierId: product.preferredSupplierId,
          supplierName: product.preferredSupplier?.name || null,
          unit: product.unit,
          unitPriceHt: Number(product.purchasePriceHt || 0),
          isCritical: priority === 'critical',
          priority,
          reason: reasons.join(' | ')
        });
      }
    }

    // Sort by priority then by supplier
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return suggestions.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
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
