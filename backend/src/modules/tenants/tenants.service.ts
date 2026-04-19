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

    async updateCompany(userId: string, dto: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });

        if (!user || !user.companyId) {
            throw new Error('User not associated with a company');
        }

        return this.prisma.company.update({
            where: { id: user.companyId },
            data: {
                name: dto.name,
                address: dto.address,
                phone: dto.phone,
                email: dto.email,
                website: dto.website,
                logoUrl: dto.logoUrl,
                nif: dto.nif,
                ai: dto.ai,
                rc: dto.rc,
                rib: dto.rib,
            },
        });
    }
}
