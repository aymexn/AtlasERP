import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
  try {
    const companyId = await getTenantId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const kpis = await dashboardService.getSalesOrderKpis(companyId);

    return NextResponse.json({
      success: true,
      data: kpis
    });
    
  } catch (error) {
    console.error('[SALES_KPIS_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
