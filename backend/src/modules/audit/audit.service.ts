import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    companyId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          companyId: data.companyId,
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValues: data.oldValues || {},
          newValues: data.newValues || {},
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw to avoid breaking the main transaction/flow
    }
  }

  async findAll(companyId: string, filters: { entity?: string; userId?: string; limit?: number } = {}) {
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.userId && { userId: filters.userId }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }
}
