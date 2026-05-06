import { NextResponse } from 'next/server';
import { PurchaseSuggestionService } from '@/lib/services/purchase-suggestion.service';

// Mock session function to match the existing pattern
async function getSessionMock() {
  // Try to get real session later. For now, use the seed simulation tenant
  return {
    user: {
      companyId: 'ae144f97-26c9-4c6a-b1dc-e48834f18553'
    }
  };
}

export async function POST(request: Request) {
  try {
    const session = await getSessionMock();
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const companyId = session.user.companyId;

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
