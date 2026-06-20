import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async daily(date: string) {
    const d = date ? new Date(date) : new Date();
    const start = startOfDay(d);
    const end = endOfDay(d);
    return this.getRevenueSummary(start, end);
  }

  async monthly(year: number, month: number) {
    const d = new Date(year, month - 1, 1);
    return this.getRevenueSummary(startOfMonth(d), endOfMonth(d));
  }

  async yearly(year: number) {
    const d = new Date(year, 0, 1);
    return this.getRevenueSummary(startOfYear(d), endOfYear(d));
  }

  private async getRevenueSummary(start: Date, end: Date) {
    const [revenue, orders, topProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        _sum: { total: true, discount: true },
        _count: true,
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalRevenue: Number(revenue._sum.total || 0),
      totalDiscount: Number(revenue._sum.discount || 0),
      totalOrders: revenue._count,
      orders,
      topProducts,
      period: { start, end },
    };
  }
}
