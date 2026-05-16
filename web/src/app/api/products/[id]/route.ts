import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

function sanitizeDecimals(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'number') return obj;
    if (typeof obj.toNumber === 'function') return obj.toNumber();
    if (Array.isArray(obj)) return obj.map(sanitizeDecimals);
    if (typeof obj === 'object') {
        if (obj instanceof Date) return obj;
        const clean: any = {};
        for (const key in obj) {
            clean[key] = sanitizeDecimals(obj[key]);
        }
        return clean;
    }
    return obj;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { 
                id,
                companyId: companyId
            },
            include: {
                family: true,
                bomsAsFinishedProduct: {
                    where: { isActive: true },
                    include: {
                        components: {
                            include: {
                                component: true
                            }
                        }
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(sanitizeDecimals(product));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: productId } = await params;
    const body = await request.json();
    const { formulaLines, ...productData } = body;

    // 1. SESSION VALIDATION
    const sessionCompanyId = await getTenantId();
    if (!sessionCompanyId) {
        return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    // 2. Identify context
    const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { companyId: true, name: true, stockQuantity: true }
    });

    if (!existingProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.companyId !== sessionCompanyId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const companyId = existingProduct.companyId;

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // 3. Stock Adjustment Logging
            if (productData.stockQuantity !== undefined) {
                const newStock = Number(productData.stockQuantity);
                const oldStock = Number(existingProduct.stockQuantity || 0);
                
                if (newStock !== oldStock) {
                    const difference = newStock - oldStock;
                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            productId,
                            quantity: difference,
                            movementType: 'ADJUSTMENT',
                            type: 'ADJUSTMENT',
                            reference: `ADJ-${Date.now()}`,
                            reason: 'Ajustement manuel de l\'inventaire',
                            date: new Date(),
                            unitCost: 0,
                            totalCost: 0,
                            unit: productData.unit || 'PCS'
                        }
                    });
                }
            }

            // 4. Synchronize basic product data
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    name: productData.name,
                    sku: productData.sku,
                    secondaryName: productData.secondaryName,
                    familyId: productData.familyId || null,
                    articleType: productData.articleType,
                    unit: productData.unit,
                    salePriceHt: Number(productData.salePriceHt),
                    taxRate: Number(productData.taxRate),
                    minStock: Number(productData.minStock),
                    stockQuantity: productData.stockQuantity !== undefined ? Number(productData.stockQuantity) : undefined,
                    trackStock: productData.trackStock,
                    isActive: productData.isActive,
                    description: productData.description,
                }
            });

            // 3. BOM Synchronization (Active Version 1.0)
            if (formulaLines !== undefined) {
                // Find existing active BOM or create one
                let bom = await tx.billOfMaterials.findFirst({
                    where: { productId, companyId, version: "1.0" }
                });

                if (!bom) {
                    bom = await tx.billOfMaterials.create({
                        data: {
                            productId,
                            companyId,
                            name: `Formule Standard - ${updatedProduct.name}`,
                            version: "1.0",
                            status: "ACTIVE",
                            isActive: true,
                            outputQuantity: 1.0,
                            outputUnit: updatedProduct.unit || 'PCS'
                        }
                    });
                } else {
                    await tx.billOfMaterials.update({
                        where: { id: bom.id },
                        data: { isActive: true, status: 'ACTIVE' }
                    });
                }

                // 4. Component Sync (Atomic Wipe & Rebuild)
                await tx.bOMComponent.deleteMany({
                    where: { bomId: bom.id }
                });

                let totalCalculatedCost = 0;

                if (formulaLines.length > 0) {
                    for (const line of formulaLines) {
                        const component = await tx.product.findUnique({
                            where: { id: line.componentId, companyId },
                            select: { standardCost: true, purchasePriceHt: true, unit: true }
                        });

                        if (!component) {
                            throw new Error(`Composant ${line.componentId} introuvable pour cette organisation.`);
                        }

                        const quantity = parseFloat(line.quantity);
                        if (isNaN(quantity)) {
                            throw new Error(`Quantité invalide pour l'ingrédient ${line.componentId}`);
                        }
                        const unitCost = Number(component.standardCost || component.purchasePriceHt || 0);
                        totalCalculatedCost += quantity * unitCost;

                        await tx.bOMComponent.create({
                            data: {
                                bomId: bom.id,
                                componentProductId: line.componentId,
                                quantity: quantity,
                                unit: line.unit || component.unit || 'KG',
                                wastagePercent: 0,
                                sortOrder: 0
                            }
                        });
                    }
                }

                // 5. Atomic Cost Update
                // We perform a second update to ensure the database record is fresh and returnable
                const finalProduct = await tx.product.update({
                    where: { id: productId },
                    data: { standardCost: totalCalculatedCost }
                });

                return finalProduct;
            }

            return updatedProduct;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('BOM Patch Failure:', error);
        return NextResponse.json({ 
            error: error.message || 'La sauvegarde de la nomenclature a échoué.',
            code: error.code 
        }, { status: 500 });
    }
}
