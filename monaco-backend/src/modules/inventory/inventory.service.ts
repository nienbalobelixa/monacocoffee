import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryAction } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.inventory.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        logs: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async create(data: any) {
    return this.prisma.inventory.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.inventory.update({ where: { id }, data });
  }

  async logAction(
    inventoryId: string,
    action: InventoryAction,
    quantity: number,
    note: string,
    performedBy: string,
  ) {
    const inventory = await this.findOne(inventoryId);
    let newQty = Number(inventory.quantity);
    if (action === InventoryAction.IMPORT) {
      newQty += quantity;
    } else if (action === InventoryAction.EXPORT || action === InventoryAction.WASTE) {
      newQty -= quantity;
    } else {
      newQty = quantity;
    }

    await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: newQty },
      }),
      this.prisma.inventoryLog.create({
        data: { inventoryId, action, quantity, note, performedBy },
      }),
    ]);
    return this.findOne(inventoryId);
  }

  getLowStock() {
    return this.prisma.inventory.findMany({
      where: { quantity: { lte: this.prisma.inventory.fields.minQuantity } },
    });
  }
}
