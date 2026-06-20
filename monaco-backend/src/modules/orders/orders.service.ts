import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, TableStatus } from '@prisma/client';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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
    const { skip, take } = paginate(page, limit);
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
    const { skip, take } = paginate(page, limit);
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
    await this.findOne(id);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async cancel(id: string, userId?: string) {
    const order = await this.findOne(id);
    if (userId && order.userId !== userId) throw new BadRequestException('Not your order');
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel this order');
    }
    return this.prisma.order.update({ where: { id }, data: { status: OrderStatus.CANCELLED } });
  }
}
