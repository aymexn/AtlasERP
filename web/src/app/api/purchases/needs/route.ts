import { NextResponse } from 'next/server';
import { PurchaseSuggestionService } from '@/lib/services/purchase-suggestion.service';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
  try {
    const companyId = await getTenantId();
    if (!companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const suggestions = await PurchaseSuggestionService.analyzePurchaseNeeds(companyId);
    
    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Error fetching purchase needs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
