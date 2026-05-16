const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduceSave() {
    console.log('--- Attempting to reproduce Reception Save (PATCH) ---');
    const id = 'fd768105-4022-47ab-9afa-82c6241413ce';
    const companyId = 'a7771803-e00d-4313-90b8-0dc645b63306';

    try {
        const reception = await prisma.stockReception.findFirst({
            where: { id, companyId },
            include: { lines: true }
        });

        if (!reception) {
            console.error('Reception not found!');
            return;
        }

        console.log(`Found reception ${reception.reference}`);
        
        // Simulate PATCH data
        const dto = {
            lines: reception.lines.map(l => ({ id: l.id, receivedQty: l.receivedQty }))
        };

        // Simulated update logic
        await prisma.$transaction(async (tx) => {
            if (dto.lines) {
                for (const lineDto of dto.lines) {
                    await tx.stockReceptionLine.update({
                        where: { id: lineDto.id },
                        data: { receivedQty: lineDto.receivedQty }
                    });
                }
            }
            await tx.stockReception.findUnique({ where: { id } });
        });
        
        console.log('Save SUCCESSFUL!');
    } catch (err) {
        console.error('SAVE FAILED:', err);
    }
}

reproduceSave().finally(() => prisma.$disconnect());
