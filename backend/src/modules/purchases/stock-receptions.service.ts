import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockReceptionDto } from './dto/stock-reception.dto';
import { StockMovementService } from '../inventory/services/stock-movement.service';

@Injectable()
export class StockReceptionsService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService
  ) {}

  async list(companyId: string) {
    return this.prisma.stockReception.findMany({
      where: { companyId },
      include: {
        purchaseOrder: { include: { supplier: true } },
        warehouse: true,
        lines: { include: { product: true } },
        _count: { select: { lines: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, companyId: string) {
    const reception = await this.prisma.stockReception.findFirst({
      where: { id, companyId },
      include: {
        purchaseOrder: { include: { supplier: true } },
        warehouse: true,
        lines: { include: { product: true } }
      }
    });

    if (!reception) {
      throw new NotFoundException(`Réception introuvable.`);
    }

    return reception;
  }

  async validate(id: string, companyId: string, userId: string) {
    // Check if exists
    const reception = await this.prisma.stockReception.findFirst({
      where: { id, companyId }
    });

    if (!reception) throw new NotFoundException('Réception introuvable.');
    if (reception.status === 'VALIDATED') throw new BadRequestException('Déjà validée.');

    return this.prisma.$transaction(async (tx) => {
      // 1. Delegate Stock Movements & Reception Status Update (Inside this transaction)
      await this.stockMovementService.validateReception(companyId, userId, id, tx as any);

      // 2. Fetch updated lines for PO synchronization
      const updatedReception = await tx.stockReception.findUnique({
        where: { id },
        include: { lines: true }
      });

      // 3. Update PO received quantities
      for (const line of updatedReception!.lines) {
        if (line.purchaseLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: line.purchaseLineId },
            data: { receivedQty: { increment: line.receivedQty } }
          });
        }
      }

      // 4. Recalculate PurchaseOrder status
      const orderLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: reception.purchaseOrderId }
      });

      const allReceived = orderLines.every(ol => Number(ol.receivedQty) >= Number(ol.quantity));
      const anyReceived = orderLines.some(ol => Number(ol.receivedQty) > 0);

      const newStatus = allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIALLY_RECEIVED' : 'CONFIRMED');

      await tx.purchaseOrder.update({
        where: { id: reception.purchaseOrderId },
        data: { status: newStatus }
      });

      return tx.stockReception.findUnique({
        where: { id },
        include: {
          purchaseOrder: { include: { supplier: true } },
          lines: { include: { product: true } }
        }
      });
    });
  }
}
