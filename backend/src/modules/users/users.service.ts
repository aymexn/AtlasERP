import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async create(data: { email: string; passwordHash: string; companyId?: string }) {
        // If we don't have a companyId yet, it will be handled during tenant creation
        // However, the schema currently makes companyId mandatory.
        // We'll adjust the logic in register to first create user then company, or vice versa.
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                companyId: data.companyId, // This might need a dummy ID initially or schema adjustment
            },
        });
    }

    async updateCompany(userId: string, companyId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { companyId },
        });
    }
}
