import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateReference(companyId: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `BC-${yearMonth}-`;

    const lastOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        companyId,
        reference: { startsWith: prefix }
      },
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.reference.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async list(companyId: string, status?: PurchaseOrderStatus) {
    console.log(`[PurchaseOrdersService.list] Fetching for companyId: ${companyId}`);
    return this.prisma.purchaseOrder.findMany({
      where: { 
        companyId,
        ...(status ? { status } : {})
      },
      include: {
        supplier: true,
        lines: {
          include: { product: true }
        },
        _count: {
          select: { 
            lines: true,
            stockReceptions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, companyId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        company: true,
        lines: {
          include: { product: true }
        },
        stockReceptions: {
          include: { 
            warehouse: true,
            _count: { select: { lines: true } }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Bon de commande introuvable.`);
    }

    return order;
  }

  async create(companyId: string, dto: CreatePurchaseOrderDto) {
    console.log(`[PurchaseOrdersService.create] Called for companyId: ${companyId}`);
    try {
      if (!companyId) throw new BadRequestException('Company ID is required');

      // Validate supplier
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, companyId }
      });
      if (!supplier) throw new BadRequestException('Fournisseur invalide.');

      // Validate products and calculate totals
      let totalHt = 0;
      let totalTva = 0;

      const lineData = [];
      for (const line of dto.lines) {
        const product = await this.prisma.product.findFirst({
          where: { id: line.productId, companyId }
        });
        if (!product) throw new BadRequestException(`Produit ID ${line.productId} invalide.`);

        const qty = Number(line.quantity) || 0;
        const price = Number(line.unitPriceHt) || 0;
        const tax = Number(line.taxRate || 0.19);

        const lineTotalHt = Number((qty * price).toFixed(2));
        const lineTotalTva = Number((lineTotalHt * tax).toFixed(2));

        totalHt += lineTotalHt;
        totalTva += lineTotalTva;

        lineData.push({
          productId: line.productId,
          quantity: qty,
          unit: line.unit,
          unitPriceHt: price,
          taxRate: tax,
          totalHt: lineTotalHt,
          note: line.note
        });
      }

      const totalTtc = Number((totalHt + totalTva).toFixed(2));
      
      let reference: string;
      try {
        reference = await this.generateReference(companyId);
      } catch (refError) {
        console.error('Reference Generation Error:', refError);
        reference = `BC-TEMP-${Date.now()}`;
      }

      return await this.prisma.$transaction(async (tx) => {
        return await tx.purchaseOrder.create({
          data: {
            companyId,
            reference,
            supplierId: dto.supplierId,
            orderDate: new Date(dto.orderDate),
            expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
            notes: dto.notes,
            status: 'DRAFT',
            totalHt: Number(totalHt.toFixed(2)),
            totalTva: Number(totalTva.toFixed(2)),
            totalTtc: Number(totalTtc.toFixed(2)),
            lines: {
              create: lineData
            }
          },
          include: { 
            supplier: true,
            lines: {
              include: { product: true }
            }
          }
        });
      });
    } catch (error) {
      console.error('PurchaseOrdersService.create Error:', error);
      throw error;
    }
  }

  async confirm(id: string, companyId: string) {
    const order = await this.findOne(id, companyId);

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Seuls les brouillons peuvent être confirmés.');
    }
    if (order.lines.length === 0) {
      throw new BadRequestException('Le bon de commande doit avoir au moins une ligne.');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    });
  }

  async send(id: string, companyId: string) {
    const order = await this.findOne(id, companyId);
    
    if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Statut invalide pour l\'envoi.');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'SENT' }
    });
  }

  async cancel(id: string, companyId: string) {
    const order = await this.findOne(id, companyId);

    if (!['DRAFT', 'SENT'].includes(order.status)) {
      throw new BadRequestException('Impossible d\'annuler une commande à ce stade.');
    }

    // Block if any reception exists
    if (order.stockReceptions.length > 0) {
      throw new BadRequestException('Impossible d\'annuler une commande ayant des réceptions.');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }

  async createReception(id: string, companyId: string, warehouseId: string, notes?: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: { lines: { include: { product: true } } }
    });

    if (!order) throw new NotFoundException('Bon de commande introuvable.');

    if (!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)) {
      throw new BadRequestException('Impossible de créer une réception pour une commande à ce stade.');
    }

    // Generate reference for reception: REC-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `REC-${yearMonth}-`;

    const lastRec = await this.prisma.stockReception.findFirst({
      where: { companyId, reference: { startsWith: prefix } },
      orderBy: { reference: 'desc' },
      select: { reference: true }
    });

    let sequence = 1;
    if (lastRec) {
      const lastSequence = parseInt(lastRec.reference.split('-')[2]);
      sequence = lastSequence + 1;
    }
    const reference = `${prefix}${String(sequence).padStart(4, '0')}`;

    // Prepare lines: for each order line, if remaining > 0
    const receptionLines = order.lines
      .map(line => ({
        productId: line.productId,
        purchaseLineId: line.id,
        expectedQty: Number(line.quantity) - Number(line.receivedQty),
        receivedQty: Number(line.quantity) - Number(line.receivedQty), // Default to full remaining
        unit: line.unit,
        unitCost: line.unitPriceHt,
      }))
      .filter(line => line.expectedQty > 0);

    if (receptionLines.length === 0) {
      throw new BadRequestException('Tous les articles ont déjà été reçus pour ce bon de commande.');
    }

    return this.prisma.stockReception.create({
      data: {
        companyId,
        reference,
        purchaseOrderId: id,
        warehouseId,
        notes,
        status: 'DRAFT',
        lines: {
          create: receptionLines
        }
      },
      include: { lines: true }
    });
  }
}
