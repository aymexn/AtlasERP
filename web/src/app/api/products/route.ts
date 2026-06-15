import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';
import { requirePermission } from '@/lib/require-permission';

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

export async function POST(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const denied = await requirePermission('products', 'product', 'create', request);
        if (denied) return denied;

        const body = await request.json();
        console.log("Payload reçu (POST /api/products):", body);

        const { formulaLines, ...productData } = body;

        // Check duplicate SKU
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

        const priceHT = productData.priceHT !== undefined ? parseFloat(productData.priceHT) : (parseFloat(productData.salePriceHt) || 0);
        const costPrice = productData.costPrice !== undefined ? parseFloat(productData.costPrice) : (parseFloat(productData.standardCost) || parseFloat(productData.purchasePriceHt) || 0);
        const alertThreshold = productData.alertThreshold !== undefined ? parseFloat(productData.alertThreshold) : (parseFloat(productData.minStock) || 0);
        const stockQuantity = productData.stockQuantity !== undefined ? parseFloat(productData.stockQuantity) : 0;

        const resolvedArticleType = productData.articleType || 'FINISHED_PRODUCT';
        const resolvedType = productData.type || (resolvedArticleType === 'FINISHED_PRODUCT' ? 'FINISHED_GOOD' : (resolvedArticleType === 'SEMI_FINISHED' ? 'SEMI_FINISHED' : 'RAW_MATERIAL'));

        if (resolvedType !== 'FINISHED_GOOD' && priceHT > 0) {
            return NextResponse.json({ 
                error: 'Seuls les produits finis peuvent avoir un prix de vente.' 
            }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const product = await tx.product.create({
                data: {
                    name: productData.name,
                    sku: productData.sku,
                    secondaryName: productData.secondaryName || null,
                    familyId: productData.familyId || null,
                    unit: productData.unit || 'PCS',
                    articleType: resolvedArticleType,
                    type: resolvedType,
                    salePriceHt: priceHT,
                    taxRate: parseFloat(productData.taxRate) || 0.19,
                    purchasePriceHt: costPrice,
                    standardCost: costPrice,
                    minStock: alertThreshold,
                    stockQuantity: stockQuantity,
                    trackStock: productData.trackStock ?? true,
                    isActive: true,
                    description: productData.description || '',
                    companyId,
                }
            });

            // Initial stock movement log if stock is specified and > 0
            if (stockQuantity > 0) {
                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: product.id,
                        quantity: stockQuantity,
                        movementType: 'IN',
                        type: 'IN',
                        reference: `INIT-${product.sku}`,
                        reason: 'Initialisation du stock de départ',
                        date: new Date(),
                        unitCost: costPrice,
                        totalCost: stockQuantity * costPrice,
                        unit: product.unit
                    }
                });
            }

            // Handle Formulation (BOM)
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
                    const defaultCost = Number(componentProduct.standardCost || componentProduct.purchasePriceHt || 0);
                    const lineUnitCost = item.unitCost !== undefined && item.unitCost !== null ? Number(item.unitCost) : defaultCost;
                    totalStandardCost += qty * lineUnitCost;

                    await tx.bOMComponent.create({
                        data: {
                            bomId: bom.id,
                            componentProductId: item.componentId,
                            quantity: qty,
                            unit: item.unit || componentProduct.unit || 'PCS',
                            unitCost: lineUnitCost,
                            wastagePercent: 0,
                            sortOrder: 0
                        }
                    });
                }

                // Update standard cost from formulation
                await tx.product.update({
                    where: { id: product.id },
                    data: { standardCost: totalStandardCost }
                });

                product.standardCost = totalStandardCost as any;
            }

            return product;
        });

        return NextResponse.json(mapProductFields(result));
    } catch (error: any) {
        console.error('Product Creation Error:', error);
        return NextResponse.json({ 
            error: error.message || 'API request failed' 
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const companyId = await getTenantId();
        if (!companyId) {
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        const denied = await requirePermission('products', 'product', 'read', request);
        if (denied) return denied;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';

        const where: any = {
            companyId,
            isActive: true,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (type) {
            const upperType = type.toUpperCase();
            if (['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD'].includes(upperType)) {
                where.type = upperType;
            }
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    family: true,
                },
                orderBy: {
                    name: 'asc',
                },
                skip,
                take: limit
            }),
            prisma.product.count({ where })
        ]);

        const mappedProducts = products.map(mapProductFields);

        return NextResponse.json({
            data: mappedProducts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to fetch products' 
        }, { status: 500 });
    }
}
