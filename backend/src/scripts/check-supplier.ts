import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const supplier = await prisma.supplier.findFirst({
        where: { name: { contains: 'Pigments', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(supplier, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
