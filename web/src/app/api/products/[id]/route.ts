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

function mapProductFields(product: any) {
    if (!product) return product;
    const clean = sanitizeDecimals(product);
    return {
        ...clean,
        priceHT: clean.salePriceHt !== undefined ? Number(clean.salePriceHt) : undefined,
        costPrice: clean.standardCost !== undefined ? Number(clean.standardCost) : undefined,
        alertThreshold: clean.minStock !== undefined ? Number(clean.minStock) : undefined,
    };
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
                companyId
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

        return NextResponse.json(mapProductFields(product));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const body = await request.json();
        const { formulaLines, ...productData } = body;

        // Verify product ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
            select: { companyId: true, name: true, stockQuantity: true, articleType: true, type: true }
        });

        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (existingProduct.companyId !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const priceHT = productData.priceHT !== undefined ? parseFloat(productData.priceHT) : parseFloat(productData.salePriceHt);
        const costPrice = productData.costPrice !== undefined ? parseFloat(productData.costPrice) : parseFloat(productData.standardCost);
        const alertThreshold = productData.alertThreshold !== undefined ? parseFloat(productData.alertThreshold) : parseFloat(productData.minStock);

        const resolvedArticleType = productData.articleType || existingProduct.articleType;
        const resolvedType = productData.type || (resolvedArticleType === 'FINISHED_PRODUCT' ? 'FINISHED_GOOD' : (resolvedArticleType === 'SEMI_FINISHED' ? 'SEMI_FINISHED' : 'RAW_MATERIAL'));

        if (resolvedType !== 'FINISHED_GOOD' && priceHT > 0) {
            return NextResponse.json({ 
                error: 'Seuls les produits finis peuvent avoir un prix de vente.' 
            }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // Stock adjustment log
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
                            unitCost: !isNaN(costPrice) ? costPrice : 0,
                            totalCost: difference * (!isNaN(costPrice) ? costPrice : 0),
                            unit: productData.unit || 'PCS'
                        }
                    });
                }
            }

            // Update basic details
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    name: productData.name,
                    sku: productData.sku,
                    secondaryName: productData.secondaryName,
                    familyId: productData.familyId || null,
                    unit: productData.unit,
                    articleType: productData.articleType,
                    type: resolvedType,
                    salePriceHt: resolvedType === 'FINISHED_GOOD' ? (!isNaN(priceHT) ? priceHT : undefined) : null,
                    purchasePriceHt: !isNaN(costPrice) ? costPrice : undefined,
                    standardCost: !isNaN(costPrice) ? costPrice : undefined,
                    minStock: !isNaN(alertThreshold) ? alertThreshold : undefined,
                    stockQuantity: productData.stockQuantity !== undefined ? Number(productData.stockQuantity) : undefined,
                    trackStock: productData.trackStock,
                    isActive: productData.isActive,
                    description: productData.description,
                }
            });

            // BOM Synchronization
            if (formulaLines !== undefined) {
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
                        const defaultCost = Number(component.standardCost || component.purchasePriceHt || 0);
                        const lineUnitCost = line.unitCost !== undefined && line.unitCost !== null ? Number(line.unitCost) : defaultCost;
                        totalCalculatedCost += quantity * lineUnitCost;

                        await tx.bOMComponent.create({
                            data: {
                                bomId: bom.id,
                                componentProductId: line.componentId,
                                quantity: quantity,
                                unit: line.unit || component.unit || 'KG',
                                unitCost: lineUnitCost,
                                wastagePercent: 0,
                                sortOrder: 0
                            }
                        });
                    }
                }

                const finalProduct = await tx.product.update({
                    where: { id: productId },
                    data: { standardCost: totalCalculatedCost }
                });

                return finalProduct;
            }

            return updatedProduct;
        });

        return NextResponse.json(mapProductFields(result));
    } catch (error: any) {
        console.error('BOM PUT Failure:', error);
        return NextResponse.json({ 
            error: error.message || 'La mise à jour de l\'article a échoué.' 
        }, { status: 500 });
    }
}

// Support PATCH as alias to PUT
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    return PUT(request, context);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const deletedProduct = await prisma.product.update({
            where: { 
                id,
                companyId
            },
            data: {
                isActive: false // Soft delete
            }
        });

        return NextResponse.json({ success: true, data: mapProductFields(deletedProduct) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
