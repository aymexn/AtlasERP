const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306';
  const userId = '11111111-1111-1111-1111-111111111111'; // Mock user
  const receptionRef = 'REC-202605-0001';

  const reception = await prisma.stockReception.findFirst({
    where: { reference: receptionRef, companyId }
  });

  if (!reception) {
    console.log('Reception not found');
    return;
  }

  console.log(`Validating reception ${reception.id}...`);

  try {
    // Mimic the service logic
    await prisma.$transaction(async (tx) => {
        // Since I don't have access to the service instance easily, I'll check the logic
        // But wait, I can just call a mock of validateReception here to see if it fails.
        
        for (const line of await tx.stockReceptionLine.findMany({ where: { receptionId: reception.id } })) {
            console.log(`Processing line for product ${line.productId}...`);
            // Check if purchase line exists
            if (!line.purchaseLineId) {
                console.warn(`Line ${line.id} has no purchaseLineId`);
            }
        }
        
        // Let's try to update the status and see if it works
        await tx.stockReception.update({
            where: { id: reception.id },
            data: { status: 'VALIDATED' }
        });
        console.log('Status updated to VALIDATED');
    });
    console.log('Transaction committed successfully');
  } catch (e) {
    console.error('Transaction failed:', e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
