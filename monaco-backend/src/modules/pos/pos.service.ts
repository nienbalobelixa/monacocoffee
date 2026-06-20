import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  async createSale(
    dto: CreateOrderDto,
    paymentMethod: PaymentMethod,
    staffId: string,
  ) {
    const order = await this.ordersService.create(dto, undefined, staffId);
    const payment = await this.paymentsService.createPayment(order.id, paymentMethod);
    const confirmedPayment = await this.paymentsService.confirmPayment(payment.id);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETED' },
    });
    return {
      order: { ...order, status: 'COMPLETED' },
      payment: confirmedPayment,
    };
  }

  async createOrder(dto: CreateOrderDto, staffId: string) {
    return this.ordersService.create(dto, undefined, staffId);
  }

  async processPayment(orderId: string, method: PaymentMethod) {
    const payment = await this.paymentsService.createPayment(orderId, method);
    const confirmedPayment = await this.paymentsService.confirmPayment(payment.id);
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });
    return confirmedPayment;
  }

  async getActiveTables() {
    return this.prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
          include: { items: { include: { product: true } } },
        },
      },
    });
  }

  async getActiveOrders() {
    return this.prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: { include: { product: true } },
        table: true,
        payment: true,
      },
    });
  }

  async getTableOrders(tableId: string) {
    return this.prisma.order.findMany({
      where: {
        tableId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailySummary() {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const [totalOrders, revenue, cancelledOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED',
        },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
        _sum: { total: true, discount: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: start, lte: end }, status: 'CANCELLED' },
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
