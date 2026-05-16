"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const supplier = await prisma.supplier.findFirst({
        where: { name: { contains: 'Pigments', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(supplier, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-supplier.js.map