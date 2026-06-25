import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderStatus, PaymentMethod, Role } from '@prisma/client';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  // Nguồn duy nhất cho "trạng thái đơn còn mở" — dùng lại ở MỌI nơi
  // để tránh lệch danh sách giữa các hàm (lỗi cũ: getActiveTables/getTableOrders
  // thiếu DELIVERING so với openTableStatuses/getActiveOrders).
  private readonly openTableStatuses = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERING,
  ];

  async createSale(dto: CreateOrderDto, paymentMethod: PaymentMethod, staffId: string) {
    const order = await this.ordersService.create(dto, undefined, staffId);
    const payment = await this.paymentsService.createPayment(order.id, paymentMethod);
    const confirmedPayment = await this.paymentsService.confirmPayment(payment.id);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETED },
    });
    return { order: { ...order, status: OrderStatus.COMPLETED }, payment: confirmedPayment };
  }

  async createOrder(dto: CreateOrderDto, staffId: string) {
    if (dto.tableId) {
      const activeOrder = await this.prisma.order.findFirst({
        where: {
          tableId: dto.tableId,
          status: { in: this.openTableStatuses },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (activeOrder) {
        // FIX: dùng addItems() để CỘNG THÊM món vào đơn đang mở của bàn,
        // thay vì update() (vốn XOÁ hết items cũ rồi tạo lại chỉ từ dto.items mới).
        // Đây chính là nguyên nhân gây mất món cũ khi gọi order thêm cho 1 bàn.
        return this.ordersService.addItems(activeOrder.id, dto.items, {
          id: staffId,
          role: Role.STAFF,
        });
      }
    }

    return this.ordersService.create(dto, undefined, staffId);
  }

  async processPayment(orderId: string, method: PaymentMethod) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} không tồn tại`);
    if (order.status === OrderStatus.COMPLETED) throw new BadRequestException('Đơn hàng đã được thanh toán');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Không thể thanh toán đơn đã huỷ');

    // Tránh tạo duplicate payment
    const existing = await this.prisma.payment.findUnique({ where: { orderId } });
    let confirmed;
    if (existing) {
      if (existing.status === 'PAID') throw new BadRequestException('Đơn hàng đã được thanh toán');
      confirmed = await this.paymentsService.confirmPayment(existing.id);
    } else {
      const payment = await this.paymentsService.createPayment(orderId, method);
      confirmed = await this.paymentsService.confirmPayment(payment.id);
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
    });

    return confirmed;
  }

  async getActiveTables() {
    return this.prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: { status: { in: this.openTableStatuses } }, // đồng bộ với openTableStatuses
          include: { items: { include: { product: true } } },
        },
      },
    });
  }

  async getActiveOrders() {
    return this.prisma.order.findMany({
      where: { status: { in: this.openTableStatuses } },
      orderBy: { createdAt: 'asc' },
      include: { items: { include: { product: true } }, table: true, payment: true },
    });
  }

  async getOrdersToday(statusFilter?: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = { createdAt: { gte: start, lte: end } };
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true, image: true } } } },
        table: { select: { id: true, number: true } },
        payment: { select: { id: true, method: true, status: true, amount: true, paidAt: true } },
      },
    });
  }

  async getTableOrders(tableId: string) {
    return this.prisma.order.findMany({
      where: {
        tableId,
        status: { in: this.openTableStatuses }, // đồng bộ với openTableStatuses
      },
      include: {
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailySummary() {
    // Tránh dùng setHours() mutate trực tiếp object Date dùng chung (dễ gây bug
    // khó debug khi code phía trên thay đổi). Tạo 2 Date độc lập rõ ràng.
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalOrders, revenue, cancelledOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: OrderStatus.COMPLETED,
        },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: OrderStatus.COMPLETED },
        _sum: { total: true, discount: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: start, lte: end }, status: OrderStatus.CANCELLED },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: Number(revenue._sum.total || 0),
      totalDiscount: Number(revenue._sum.discount || 0),
      cancelledOrders,
      date: start.toISOString().split('T')[0],
    };
  }
}