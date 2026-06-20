import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [todayOrders, todayRevenue, totalCustomers, newCustomersToday, topProducts, recentOrders] =
      await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: 'COMPLETED',
          },
          _sum: { total: true },
        }),
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.user.count({
          where: {
            role: 'CUSTOMER',
            createdAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
        this.prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true } },
            items: true,
          },
        }),
      ]);

    const topProductIds = topProducts.map(p => p.productId);
    const topProductsData = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });
    const topProductsWithQuantity = topProducts.map(tp => ({
      ...topProductsData.find(p => p.id === tp.productId),
      totalSold: tp._sum.quantity,
    }));

    return {
      todayOrders,
      todayRevenue: Number(todayRevenue._sum.total || 0),
      totalCustomers,
      newCustomersToday,
      topProducts: topProductsWithQuantity,
      recentOrders,
    };
  }

  async getRevenueChart(days: number = 7) {
    const result: Array<{ date: string; revenue: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);
      const revenue = await this.prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        _sum: { total: true },
      });
      result.push({
        date: date.toISOString().split('T')[0],
        revenue: Number(revenue._sum.total || 0),
      });
    }
    return result;
  }
}
