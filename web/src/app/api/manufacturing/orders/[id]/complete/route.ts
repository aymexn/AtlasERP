import { NextRequest, NextResponse } from 'next/server';
import { StockMovementService } from '@/lib/services/stock-movement.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await StockMovementService.completeManufacturingOrder(id);
    
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
