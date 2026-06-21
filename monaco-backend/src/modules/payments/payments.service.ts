import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, OrderStatus, TableStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private readonly openTableStatuses = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.DELIVERING,
  ];

  async createPayment(orderId: string, method: PaymentMethod) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const existingPayment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (existingPayment) {
      return this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          method,
          amount: order.total,
        },
      });
    }

    return this.prisma.payment.create({
      data: {
        orderId,
        method,
        amount: order.total,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async confirmPayment(paymentId: string, transactionRef?: string) {
    // mark payment as paid and set the related order as COMPLETED
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          transactionRef,
        },
      });

      // update order status to COMPLETED when payment is successful
      const order = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      if (order.tableId) {
        const openOrders = await tx.order.count({
          where: {
            tableId: order.tableId,
            status: { in: this.openTableStatuses },
          },
        });

        if (openOrders === 0) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: TableStatus.AVAILABLE },
          });
        }
      }

      return payment;
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId } });
  }
}
