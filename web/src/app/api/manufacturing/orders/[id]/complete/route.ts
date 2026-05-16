import { NextRequest, NextResponse } from 'next/server';
import { StockMovementService } from '@/lib/services/stock-movement.service';
import { getTenantId } from '@/lib/api-helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await StockMovementService.completeManufacturingOrder(id, companyId);
    
    return NextResponse.json({
      success: true,
      message: 'OF terminé - Matières consommées et produits finis entrés',
      data: result
    });
    
  } catch (error: any) {
    console.error('MO completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la complétion de l\'OF' },
      { status: 400 }
    );
  }
}
