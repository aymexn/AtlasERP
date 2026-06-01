import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId } from '@/lib/api-helpers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const companyId = await getTenantId();
        if (!companyId) return new NextResponse('Unauthorized', { status: 401 });

        const customer = await prisma.customer.findUnique({
            where: { id, companyId },
            select: {
                creditLimit: true,
                avgPaymentDelay: true,
                paymentBehavior: true,
                invoices: {
                    where: { status: { not: 'CANCELLED' as any } },
                    orderBy: { date: 'desc' },
                    select: {
                        id: true,
                        reference: true,
                        date: true,
                        dueDate: true,
                        amountRemaining: true,
                        totalAmountTtc: true,
                        status: true
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const invoices = customer.invoices || [];
        const unpaidInvoices = invoices.filter(inv => inv.amountRemaining && Number(inv.amountRemaining) > 0);
        
        const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amountRemaining), 0);
        const creditLimit = Number(customer.creditLimit) || 0;
        const availableCredit = Math.max(0, creditLimit - totalOutstanding);
        const creditUtilization = creditLimit > 0 ? (totalOutstanding / creditLimit) * 100 : 0;

        // Aging calculation
        const now = new Date();
        let aging0to30 = 0;
        let aging31to60 = 0;
        let aging61to90 = 0;
        let agingOver90 = 0;

        unpaidInvoices.forEach(inv => {
            const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
            
            const amount = Number(inv.amountRemaining);
            if (daysOverdue <= 0) {
                aging0to30 += amount;
            } else if (daysOverdue <= 30) {
                aging0to30 += amount;
            } else if (daysOverdue <= 60) {
                aging31to60 += amount;
            } else if (daysOverdue <= 90) {
                aging61to90 += amount;
            } else {
                agingOver90 += amount;
            }
        });

        const financialSummary = {
            totalOutstanding,
            creditLimit,
            availableCredit,
            creditUtilization,
            dso: customer.avgPaymentDelay || 0,
            paymentBehavior: customer.paymentBehavior || 'AVERAGE',
            aging: {
                '0_30': aging0to30,
                '31_60': aging31to60,
                '61_90': aging61to90,
                'over_90': agingOver90
            },
            unpaidInvoices: unpaidInvoices.slice(0, 5) // Top 5 unpaid
        };

        return NextResponse.json(financialSummary);
    } catch (error) {
        console.error('Financial Summary Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
