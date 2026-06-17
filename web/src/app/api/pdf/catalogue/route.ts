import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerationService } from '@/lib/services/pdf-generation.service';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const companyId = await getTenantId();
    if (!companyId) return new NextResponse('Unauthorized', { status: 401 });
    const stream = await PDFGenerationService.generateCataloguePDF(companyId);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Catalogue.pdf',
      },
    });
  } catch (error: any) {
    console.error('API_PDF_CATALOGUE_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
