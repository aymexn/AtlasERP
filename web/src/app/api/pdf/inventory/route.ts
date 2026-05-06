import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerationService } from '@/lib/services/pdf-generation.service';

export async function GET(req: NextRequest) {
  try {
    const companyId = 'ae144f97-26c9-4c6a-b1dc-e48834f18553';
    const stream = await PDFGenerationService.generateInventoryPDF(companyId);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Inventaire.pdf`,
      },
    });
  } catch (error: any) {
    console.error('API_PDF_INVENTORY_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
