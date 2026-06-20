import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        skip,
        take,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.employee.count(),
    ]);
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const e = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!e) throw new NotFoundException('Employee not found');
    return e;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }
}
