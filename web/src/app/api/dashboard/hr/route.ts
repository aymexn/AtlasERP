import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';
import { getTenantId } from '@/lib/api-helpers';

export async function GET() {
  try {
    const companyId = await getTenantId();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await dashboardService.getHRStats(companyId);

    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('[DASHBOARD_HR_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
