import { NextResponse } from 'next/server';
import { PurchaseSuggestionService } from '@/lib/services/purchase-suggestion.service';

const getServerSession = async (options: any) => ({
    user: { 
        id: 'user-id-placeholder',
        companyId: 'ae144f97-26c9-4c6a-b1dc-e48834f18553' 
    }
});
const authOptions = {};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const suggestions = await PurchaseSuggestionService.analyzePurchaseNeeds(companyId);
    
    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Error fetching purchase needs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
