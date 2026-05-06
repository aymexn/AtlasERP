import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, version, components, outputQuantity, outputUnit } = body;

    // We use a transaction to ensure BOM and Components are saved together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deactivate existing active BOMs for this product
      await tx.billOfMaterials.updateMany({
        where: { productId: id, isActive: true },
        data: { isActive: false }
      });

      // 2. Create new BillOfMaterials
      const bom = await tx.billOfMaterials.create({
        data: {
          productId: id,
          companyId: (await tx.product.findUnique({ where: { id }, select: { companyId: true } }))?.companyId || '',
          name: name || `BOM ${new Date().toLocaleDateString()}`,
          version: version || '1.0',
          isActive: true,
          status: 'ACTIVE',
          outputQuantity: outputQuantity || 1,
          outputUnit: outputUnit || 'PCS',
          components: {
            create: components.map((comp: any) => ({
              componentProductId: comp.componentId,
              quantity: comp.quantity,
              unit: comp.unit || 'KG',
              wastagePercent: comp.wastagePercent || 0,
            }))
          }
        },
        include: { components: true }
      });

      // 3. Update Product standard cost based on BOM
      let totalCost = 0;
      for (const comp of components) {
        const product = await tx.product.findUnique({
          where: { id: comp.componentId },
          select: { standardCost: true, purchasePriceHt: true }
        });
        const cost = Number(product?.standardCost || product?.purchasePriceHt || 0);
        totalCost += cost * Number(comp.quantity);
      }
      
      const unitCost = outputQuantity > 0 ? totalCost / outputQuantity : totalCost;

      await tx.product.update({
        where: { id },
        data: { standardCost: unitCost }
      });

      return bom;
    });

    return NextResponse.json({
      success: true,
      message: 'BOM sauvegardée avec succès',
      data: result
    });

  } catch (error: any) {
    console.error('BOM save error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la sauvegarde de la nomenclature' },
      { status: 400 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bom = await prisma.billOfMaterials.findFirst({
      where: { productId: id, isActive: true },
      include: {
        components: {
          include: {
            component: {
              select: { name: true, sku: true, standardCost: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: bom
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
