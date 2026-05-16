import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockReceptionDto } from './dto/stock-reception.dto';
import { StockMovementService } from '../inventory/services/stock-movement.service';
import { PurchaseOrderStatus, ReceptionStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StockReceptionsService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService,
    private eventEmitter: EventEmitter2
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
    if (!id || id.length !== 36) {
       throw new BadRequestException(`ID de réception invalide.`);
    }
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
    if (!id || id.length !== 36) {
       throw new BadRequestException(`ID de réception invalide.`);
    }
    // Check if exists
    const reception = await this.prisma.stockReception.findFirst({
      where: { id, companyId }
    });

    if (!reception) throw new NotFoundException('Réception introuvable.');
    if (reception.status === ReceptionStatus.VALIDATED) throw new BadRequestException('Déjà validée.');

    const result = await this.prisma.$transaction(async (tx) => {
      // Delegate everything to StockMovementService.validateReception which handles
      // Movements, PO line increments, and PO status updates correctly.
      await this.stockMovementService.validateReception(companyId, userId, id, tx as any);

      return tx.stockReception.findUnique({
        where: { id },
        include: {
          purchaseOrder: { include: { supplier: true } },
          lines: { include: { product: true } }
        }
      });
    });

    this.eventEmitter.emit('dashboard.refresh', { companyId });
    return result;
  }

  async update(id: string, companyId: string, dto: any) {
    if (!id || id.length !== 36) {
       throw new BadRequestException(`ID de réception invalide.`);
    }
    const reception = await this.prisma.stockReception.findFirst({
      where: { id, companyId },
      include: { lines: { include: { purchaseLine: true } } }
    });

    if (!reception) throw new NotFoundException('Réception introuvable.');
    if (reception.status !== 'DRAFT') {
      throw new BadRequestException('Seules les réceptions en brouillon peuvent être modifiées.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update basic fields
      if (dto.notes !== undefined || dto.warehouseId !== undefined) {
        await tx.stockReception.update({
          where: { id },
          data: {
            notes: dto.notes,
            warehouseId: dto.warehouseId
          }
        });
      }

      // Update lines with safety check
      if (dto.lines && Array.isArray(dto.lines)) {
        for (const lineDto of dto.lines) {
          const line = reception.lines.find(l => l.id === lineDto.id);
          if (line) {
            const newQty = Number(lineDto.receivedQty);
            
            // STRICT OVER-RECEPTION CHECK
            if (line.purchaseLine) {
                const orderedQty = Number(line.purchaseLine.quantity);
                const previouslyReceived = Number(line.purchaseLine.receivedQty);
                // Note: since this reception is DRAFT, it hasn't incremented receivedQty yet.
                // But there might be OTHER validated receptions for the same PO line.
                if (previouslyReceived + newQty > orderedQty) {
                    throw new BadRequestException(
                        `Sur-réception détectée pour ${line.productId}. ` +
                        `Commandé: ${orderedQty}, Déjà reçu: ${previouslyReceived}, Tentative: ${newQty}`
                    );
                }
            }

            await tx.stockReceptionLine.update({
              where: { id: line.id },
              data: { receivedQty: newQty }
            });
          }
        }
      }

      return tx.stockReception.findUnique({
        where: { id },
        include: { lines: { include: { product: true } } }
      });
    });
  }
}
