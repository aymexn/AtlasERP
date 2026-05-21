"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const companies = await prisma.company.findMany();
        console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name })));
        for (const company of companies) {
            console.log(`--- Company: ${company.name} (${company.id}) ---`);
            const paymentsCount = await prisma.payment.count({ where: { companyId: company.id } });
            const paymentsSum = await prisma.payment.aggregate({
                where: { companyId: company.id },
                _sum: { amount: true }
            });
            console.log(`Payments: count=${paymentsCount}, sum=${paymentsSum._sum.amount}`);
            const expensesCount = await prisma.expense.count({ where: { companyId: company.id } });
            const expensesSum = await prisma.expense.aggregate({
                where: { companyId: company.id },
                _sum: { amount: true }
            });
            console.log(`Expenses: count=${expensesCount}, sum=${expensesSum._sum.amount}`);
            const invoicesCount = await prisma.invoice.count({ where: { companyId: company.id } });
            const invoicesSum = await prisma.invoice.aggregate({
                where: { companyId: company.id },
                _sum: { totalAmountTtc: true, amountPaid: true }
            });
            console.log(`Invoices: count=${invoicesCount}, totalAmountTtc=${invoicesSum._sum.totalAmountTtc}, amountPaid=${invoicesSum._sum.amountPaid}`);
            const salesCount = await prisma.salesOrder.count({ where: { companyId: company.id } });
            const salesSum = await prisma.salesOrder.aggregate({
                where: { companyId: company.id },
                _sum: { totalAmountTtc: true }
            });
            console.log(`SalesOrders: count=${salesCount}, totalAmountTtc=${salesSum._sum.totalAmountTtc}`);
            const productsCount = await prisma.product.count({ where: { companyId: company.id } });
            console.log(`Products count: ${productsCount}`);
        }
    }
    catch (error) {
        console.error(error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=inspect-db.js.map