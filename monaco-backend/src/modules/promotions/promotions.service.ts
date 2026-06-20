import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findActive() {
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
  }

  create(dto: any) {
    return this.prisma.promotion.create({ data: dto });
  }

  async findOne(id: string) {
    const p = await this.prisma.promotion.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Promotion not found');
    return p;
  }

  async validateCode(code: string) {
    const p = await this.prisma.promotion.findUnique({ where: { code } });
    if (!p || !p.isActive || p.endDate < new Date() || p.startDate > new Date()) {
      return { valid: false };
    }
    if (p.usageLimit && p.usageCount >= p.usageLimit) {
      return { valid: false, message: 'Usage limit reached' };
    }
    return { valid: true, promotion: p };
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.promotion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.promotion.delete({ where: { id } });
  }
}
