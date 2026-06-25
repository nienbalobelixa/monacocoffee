import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Role, TableStatus, Prisma } from '@prisma/client';
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

  private async refreshTableStatus(tableId?: string | null, tx?: Prisma.TransactionClient) {
    if (!tableId) return;
    const db = tx ?? this.prisma;

    const openOrders = await db.order.count({
      where: {
        tableId,
        status: { in: this.openTableStatuses },
      },
    });

    await db.table.update({
      where: { id: tableId },
      data: { status: openOrders > 0 ? TableStatus.OCCUPIED : TableStatus.AVAILABLE },
    });
  }

  private generateOrderNumber(): string {
    return `MC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  // Tính lại discount theo promotion áp dụng trên 1 subtotal cho trước.
  // Tách thành helper để dùng lại ở cả create / update / addItems, tránh lặp + lệch logic.
  private calcDiscount(promotion: any, subtotal: number): number {
    if (!promotion) return 0;
    if (promotion.type === 'PERCENTAGE') {
      let discount = subtotal * (Number(promotion.value) / 100);
      if (promotion.maxDiscount) discount = Math.min(discount, Number(promotion.maxDiscount));
      return discount;
    }
    if (promotion.type === 'FIXED_AMOUNT') {
      return Math.min(Number(promotion.value), subtotal);
    }
    return 0;
  }

  private async validatePromotion(code?: string) {
    if (!code) return null;
    const promotion = await this.prisma.promotion.findUnique({ where: { code } });
    if (!promotion || !promotion.isActive || promotion.endDate < new Date()) {
      throw new BadRequestException('Invalid or expired promotion code');
    }
    return promotion;
  }

  async create(dto: CreateOrderDto, userId?: string, staffId?: string, tx?: Prisma.TransactionClient) {
    const run = async (db: Prisma.TransactionClient | PrismaService) => {
      const productIds = dto.items.map(i => i.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds }, isAvailable: true },
      });

      if (products.length !== dto.items.length) {
        throw new BadRequestException('One or more products not available');
      }

      const promotion = await this.validatePromotion(dto.promotionCode);

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

      const discount = this.calcDiscount(promotion, subtotal);
      const total = subtotal - discount;

      const order = await db.order.create({
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
        await db.table.update({
          where: { id: dto.tableId },
          data: { status: TableStatus.OCCUPIED },
        });
      }

      if (promotion) {
        await db.promotion.update({
          where: { id: promotion.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      return order;
    };

    // Nếu được gọi từ trong 1 transaction khác (vd: PosService.createSale), dùng tx đó.
    // Nếu không, tự bọc transaction để đảm bảo create order + update table + update
    // promotion luôn atomic (trước đây 3 bước này không có transaction).
    if (tx) return run(tx);
    return this.prisma.$transaction(run);
  }

  // ============================================================
  // MỚI: addItems — dùng cho hành động "order thêm món" của POS
  // (khác với update(): KHÔNG xoá items cũ, chỉ cộng thêm/merge).
  // Đây là fix cho bug: thêm món cho bàn đang phục vụ làm mất món cũ.
  // ============================================================
  async addItems(
    orderId: string,
    items: { productId: string; quantity: number; note?: string }[],
    user?: { id: string; role: Role },
  ) {
    const order = await this.findOne(orderId);

    const canManage = this.canManageOrders(user);
    if (!canManage && user?.id && order.userId !== user.id) {
      throw new BadRequestException('Not your order');
    }
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot add items to a closed order');
    }

    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });
    if (products.length !== items.length) {
      throw new BadRequestException('One or more products not available');
    }

    return this.prisma.$transaction(async (tx) => {
      let addedSubtotal = 0;

      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!;
        const unitPrice = Number(product.salePrice || product.price);

        // Merge: nếu món này (cùng productId + cùng note) đã có trong đơn,
        // cộng thêm số lượng thay vì tạo dòng mới trùng lặp.
        const existingItem = order.items.find(
          (i: any) => i.productId === item.productId && (i.note ?? null) === (item.note ?? null),
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          const newItemSubtotal = unitPrice * newQuantity;
          addedSubtotal += unitPrice * item.quantity;
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity, subtotal: newItemSubtotal },
          });
        } else {
          const itemSubtotal = unitPrice * item.quantity;
          addedSubtotal += itemSubtotal;
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice,
              subtotal: itemSubtotal,
              note: item.note,
            },
          });
        }
      }

      const newSubtotal = Number(order.subtotal) + addedSubtotal;
      // Tính lại discount dựa trên promotion hiện có của đơn (nếu có), theo subtotal mới.
      const promotion = order.promotionId
        ? await tx.promotion.findUnique({ where: { id: order.promotionId } })
        : null;
      const discount = this.calcDiscount(promotion, newSubtotal);
      const total = newSubtotal - discount;

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { subtotal: newSubtotal, discount, total },
        include: { items: { include: { product: true } }, payment: true, table: true },
      });

      return updated;
    });
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

  // update(): dùng cho SỬA TOÀN BỘ đơn (đổi note, đổi bàn, sửa lại promotion,
  // hoặc admin/manager sửa lại toàn bộ danh sách món). dto.items ở đây có nghĩa là
  // "đây là danh sách món CUỐI CÙNG, ghi đè toàn bộ" — KHÔNG dùng method này để
  // "thêm món" cho POS, dùng addItems() ở trên cho mục đích đó.
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

    const hasPromotionCode = Object.prototype.hasOwnProperty.call(dto, 'promotionCode');
    const promotion = await this.validatePromotion(dto.promotionCode);

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

      // replace items in a transaction — đây là REPLACE có chủ đích cho use case "sửa toàn bộ đơn"
      await this.prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await Promise.all(orderItems.map(i => tx.orderItem.create({ data: { ...i, orderId: id } })));
      });
    }

    if (promotion) {
      discount = this.calcDiscount(promotion, subtotal);
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