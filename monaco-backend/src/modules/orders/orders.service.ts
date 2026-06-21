import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Role, TableStatus } from '@prisma/client';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private readonly openTableStatuses = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERING,
  ];

  private canManageOrders(user?: { role?: Role }) {
    return user?.role === Role.ADMIN || user?.role === Role.MANAGER || user?.role === Role.STAFF;
  }

  private canEditClosedOrders(user?: { role?: Role }) {
    return user?.role === Role.ADMIN || user?.role === Role.MANAGER;
  }

  private async refreshTableStatus(tableId?: string | null) {
    if (!tableId) return;

    const openOrders = await this.prisma.order.count({
      where: {
        tableId,
        status: { in: this.openTableStatuses },
      },
    });

    await this.prisma.table.update({
      where: { id: tableId },
      data: { status: openOrders > 0 ? TableStatus.OCCUPIED : TableStatus.AVAILABLE },
    });
  }

  private generateOrderNumber(): string {
    return `MC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  async create(dto: CreateOrderDto, userId?: string, staffId?: string) {
    const productIds = dto.items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('One or more products not available');
    }

    let promotion: any = null;
    if (dto.promotionCode) {
      promotion = await this.prisma.promotion.findUnique({
        where: { code: dto.promotionCode },
      });
      if (!promotion || !promotion.isActive || promotion.endDate < new Date()) {
        throw new BadRequestException('Invalid or expired promotion code');
      }
    }

    let subtotal = 0;
    const orderItems = dto.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const unitPrice = Number(product.salePrice || product.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        note: item.note,
      };
    });

    let discount = 0;
    if (promotion) {
      if (promotion.type === 'PERCENTAGE') {
        discount = subtotal * (Number(promotion.value) / 100);
        if (promotion.maxDiscount) discount = Math.min(discount, Number(promotion.maxDiscount));
      } else if (promotion.type === 'FIXED_AMOUNT') {
        discount = Math.min(Number(promotion.value), subtotal);
      }
    }

    const total = subtotal - discount;

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        type: dto.type,
        userId,
        staffId,
        tableId: dto.tableId,
        promotionId: promotion?.id,
        subtotal,
        discount,
        total,
        note: dto.note,
        deliveryAddress: dto.deliveryAddress,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: true } },
        table: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (dto.tableId) {
      await this.prisma.table.update({
        where: { id: dto.tableId },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    if (promotion) {
      await this.prisma.promotion.update({
        where: { id: promotion.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return order;
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, status, type, search } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const { skip, take } = paginate(pageNum, limitNum);
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) where.orderNumber = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { id: true, name: true, image: true } } } },
          payment: true,
          table: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findMyOrders(userId: string, query: any) {
    const { page = 1, limit = 10, status } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const { skip, take } = paginate(pageNum, limitNum);
    const where: any = { userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } }, payment: true },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payment: true,
        table: true,
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        promotion: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);
    const updated = await this.prisma.order.update({ where: { id }, data: { status } });
    await this.refreshTableStatus(order.tableId);
    return updated;
  }

  async update(id: string, dto: any, user?: { id: string; role: Role }) {
    const order = await this.findOne(id);
    const canManage = this.canManageOrders(user);
    if (!canManage && user?.id && order.userId !== user.id) throw new BadRequestException('Not your order');
    if (
      (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) &&
      !this.canEditClosedOrders(user)
    ) {
      throw new BadRequestException('Cannot modify this order');
    }

    // If items are provided, validate and recreate items, recalc totals
    const hasPromotionCode = Object.prototype.hasOwnProperty.call(dto, 'promotionCode');
    let promotion: any = null;
    if (dto.promotionCode) {
      promotion = await this.prisma.promotion.findUnique({ where: { code: dto.promotionCode } });
      if (!promotion || !promotion.isActive || promotion.endDate < new Date()) {
        throw new BadRequestException('Invalid or expired promotion code');
      }
    }

    let subtotal = Number(order.subtotal) || 0;
    let discount = Number(order.discount) || 0;
    let total = Number(order.total) || 0;

    if (dto.items) {
      const productIds = dto.items.map(i => i.productId);
      const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, isAvailable: true } });
      if (products.length !== dto.items.length) {
        throw new BadRequestException('One or more products not available');
      }
      subtotal = 0;
      const orderItems = dto.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const unitPrice = Number(product.salePrice || product.price);
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;
        return { productId: item.productId, quantity: item.quantity, unitPrice, subtotal: itemSubtotal, note: item.note };
      });

      // replace items in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await Promise.all(orderItems.map(i => tx.orderItem.create({ data: { ...i, orderId: id } })));
      });
    }

    if (promotion) {
      if (promotion.type === 'PERCENTAGE') {
        discount = subtotal * (Number(promotion.value) / 100);
        if (promotion.maxDiscount) discount = Math.min(discount, Number(promotion.maxDiscount));
      } else if (promotion.type === 'FIXED_AMOUNT') {
        discount = Math.min(Number(promotion.value), subtotal);
      }
    } else if (hasPromotionCode) {
      discount = 0;
    }

    total = subtotal - discount;

    const data: any = {
      note: dto.note ?? order.note,
      deliveryAddress: dto.deliveryAddress ?? order.deliveryAddress,
      tableId: dto.tableId ?? order.tableId,
      subtotal,
      discount,
      total,
      promotionId: promotion?.id ?? (hasPromotionCode ? null : order.promotionId),
    };

    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: { items: { include: { product: true } }, payment: true, table: true },
    });

    await Promise.all([
      this.refreshTableStatus(order.tableId),
      data.tableId !== order.tableId ? this.refreshTableStatus(data.tableId) : Promise.resolve(),
    ]);

    return updated;
  }

  async cancel(id: string, user?: { id: string; role: Role }) {
    const order = await this.findOne(id);
    const canManage = this.canManageOrders(user);
    if (!canManage && user?.id && order.userId !== user.id) throw new BadRequestException('Not your order');
    if (
      (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) &&
      !this.canEditClosedOrders(user)
    ) {
      throw new BadRequestException('Cannot cancel this order');
    }
    const cancelled = await this.prisma.order.update({ where: { id }, data: { status: OrderStatus.CANCELLED } });
    await this.refreshTableStatus(order.tableId);
    return cancelled;
  }

  async remove(id: string, user?: { role: Role }) {
    if (!this.canEditClosedOrders(user)) {
      throw new BadRequestException('Only admin or manager can delete orders');
    }

    const order = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
    await this.refreshTableStatus(order.tableId);
    return { id, deleted: true };
  }
}
