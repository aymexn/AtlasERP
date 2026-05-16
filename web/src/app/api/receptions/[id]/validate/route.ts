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
    const result = await StockMovementService.validateReception(id, companyId);
    
    return NextResponse.json({
      success: true,
      message: 'Réception validée - Stock mis à jour',
      data: result
    });
    
  } catch (error: any) {
    console.error('Reception validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la validation' },
      { status: 400 }
    );
  }
}
