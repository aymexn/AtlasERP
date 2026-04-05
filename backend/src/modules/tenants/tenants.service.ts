import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateTenantDto, userId: string) {
        return this.prisma.$transaction(async (tx) => {
            // Create the company
            const company = await tx.company.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                },
            });

            // Update the user to belong to this company and set as ADMIN
            await tx.user.update({
                where: { id: userId },
                data: {
                    companyId: company.id,
                    role: 'ADMIN',
                },
            });

            return company;
        });
    }

    async findByUserId(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
        });
        return user?.company;
    }
}
