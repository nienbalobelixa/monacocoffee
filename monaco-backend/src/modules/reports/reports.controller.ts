import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  daily(@Query('date') date: string) {
    return this.reportsService.daily(date);
  }

  @Get('monthly')
  monthly(@Query('year') year: number, @Query('month') month: number) {
    return this.reportsService.monthly(year, month);
  }

  @Get('yearly')
  yearly(@Query('year') year: number) {
    return this.reportsService.yearly(year);
  }
}
