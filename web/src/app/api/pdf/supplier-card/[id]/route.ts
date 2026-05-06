import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerationService } from '@/lib/services/pdf-generation.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stream = await PDFGenerationService.generateSupplierCardPDF(id);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Fiche_Fournisseur_${id}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('API_PDF_SUPPLIER_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
