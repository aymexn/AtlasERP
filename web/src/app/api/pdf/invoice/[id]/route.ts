import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerationService } from '@/lib/services/pdf-generation.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stream = await PDFGenerationService.generateInvoicePDF(id);
    
    // Convert Node.js stream to Web stream
    const response = new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${id}.pdf"`,
      },
    });

    return response;
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
