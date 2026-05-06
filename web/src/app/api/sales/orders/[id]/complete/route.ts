import { NextRequest, NextResponse } from 'next/server';
import { StockMovementService } from '@/lib/services/stock-movement.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await StockMovementService.completeSalesOrder(id);
    
    return NextResponse.json({
      success: true,
      message: 'Vente terminée - Stock déduit',
      data: result
    });
    
  } catch (error: any) {
    console.error('Sales order completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la complétion de la vente' },
      { status: 400 }
    );
  }
}
