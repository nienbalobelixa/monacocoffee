import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTableDto) {
    return this.prisma.table.create({ data: dto });
  }

  findAll() {
    return this.prisma.table.findMany({ orderBy: { number: 'asc' } });
  }

  async findOne(id: string) {
    const t = await this.prisma.table.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Table not found');
    return t;
  }

  async update(id: string, dto: Partial<CreateTableDto>) {
    await this.findOne(id);
    return this.prisma.table.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: TableStatus) {
    await this.findOne(id);
    return this.prisma.table.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.table.delete({ where: { id } });
  }
}
