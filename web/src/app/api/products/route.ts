import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function POST(request: Request) {
    try {
        // 1. SESSION VALIDATION
        const companyId = await getTenantId();
        
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }
        const body = await request.json();
        console.log("Payload reçu (POST /api/products):", body);

        const { formulaLines, ...productData } = body;

        // 2. DUPLICATE SKU CHECK
        if (productData.sku) {
            const existingProduct = await prisma.product.findFirst({
                where: { 
                    sku: productData.sku,
                    companyId: companyId
                }
            });
            if (existingProduct) {
                return NextResponse.json({ 
                    error: 'Cette référence (SKU) est déjà utilisée pour cette entreprise.' 
                }, { status: 400 });
            }
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // 3. Create Product with defaults & Normalization
            const product = await tx.product.create({
                data: {
                    name: productData.name,
                    sku: productData.sku,
                    secondaryName: productData.secondaryName,
                    familyId: productData.familyId || null,
                    articleType: productData.articleType || 'FINISHED_PRODUCT',
                    unit: productData.unit || 'PCS',
                    salePriceHt: parseFloat(productData.salePriceHt) || 0,
                    taxRate: parseFloat(productData.taxRate) || 0,
                    purchasePriceHt: parseFloat(productData.purchasePriceHt) || 0,
                    minStock: parseFloat(productData.minStock) || 0,
                    description: productData.description || '',
                    companyId,
                    standardCost: parseFloat(productData.purchasePriceHt) || 0, 
                    stockQuantity: 0, // ALWAYS initialize to 0
                    trackStock: productData.trackStock ?? true,
                    isActive: true, // Force to true
                }
            });

            // 4. Handle Formulation (BOM)
            if (formulaLines && formulaLines.length > 0) {
                const bom = await tx.billOfMaterials.create({
                    data: {
                        productId: product.id,
                        companyId,
                        name: `Formule Standard - ${product.name}`,
                        version: "1.0",
                        status: "ACTIVE",
                        isActive: true,
                        outputQuantity: 1.0,
                        outputUnit: product.unit || 'PCS'
                    }
                });

                let totalStandardCost = 0;

                for (const item of formulaLines) {
                    const componentProduct = await tx.product.findUnique({
                        where: { id: item.componentId, companyId },
                        select: { standardCost: true, purchasePriceHt: true, unit: true }
                    });

                    if (!componentProduct) {
                        throw new Error(`Composant ${item.componentId} introuvable`);
                    }

                    const qty = parseFloat(item.quantity);
                    if (isNaN(qty)) {
                        throw new Error(`Quantité invalide pour l'ingrédient ${item.componentId}`);
                    }
                    const unitCost = Number(componentProduct.standardCost || componentProduct.purchasePriceHt || 0);
                    totalStandardCost += qty * unitCost;

                    await tx.bOMComponent.create({
                        data: {
                            bomId: bom.id,
                            componentProductId: item.componentId,
                            quantity: qty,
                            unit: item.unit || componentProduct.unit || 'PCS',
                            wastagePercent: 0,
                            sortOrder: 0
                        }
                    });
                }

                // 5. Update Product Standard Cost from BOM
                await tx.product.update({
                    where: { id: product.id },
                    data: { standardCost: totalStandardCost }
                });

                product.standardCost = totalStandardCost as any;
            }

            return product;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Product Creation Error:', error);
        return NextResponse.json({ 
            error: error.message || 'API request failed' 
        }, { status: 500 });
    }
}
