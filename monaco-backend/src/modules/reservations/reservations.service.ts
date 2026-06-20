import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any, userId?: string) {
    return this.prisma.reservation.create({ data: { ...dto, userId } });
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, status } = query;
    const { skip, take } = paginate(page, limit);
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'asc' },
        include: {
          table: true,
          user: { select: { fullName: true, email: true } },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!r) throw new NotFoundException('Reservation not found');
    return r;
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.reservation.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
