"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seed_rbac_1 = require("../src/seed-rbac");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
(0, seed_rbac_1.seedRbac)(prisma)
    .catch((e) => {
    console.error('Error running RBAC seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-rbac.js.map