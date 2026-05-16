import { NextResponse } from 'next/server';
import { PurchaseSuggestionService } from '@/lib/services/purchase-suggestion.service';
import { getTenantId } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const suggestions = await request.json();
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json({ error: 'Invalid suggestions provided' }, { status: 400 });
    }

    const result = await PurchaseSuggestionService.generatePurchaseOrders(companyId, suggestions);
    return NextResponse.json({
      message: result.message,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error generating purchase orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
