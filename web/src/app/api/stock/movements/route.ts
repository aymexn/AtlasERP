import { NextRequest, NextResponse } from 'next/server';
import { StockMovementService } from '@/lib/services/stock-movement.service';
import { getTenantId } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const movement = await StockMovementService.createMovement({
      ...body,
      companyId: companyId
    });
    
    return NextResponse.json({
      success: true,
      movement
    });
    
  } catch (error: any) {
    console.error('Stock movement error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du mouvement' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    
    const movements = await StockMovementService.getProductMovements(productId, companyId);
    
    return NextResponse.json({
      success: true,
      movements
    });
    
  } catch (error: any) {
    console.error('Fetch movements error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 400 }
    );
  }
}
