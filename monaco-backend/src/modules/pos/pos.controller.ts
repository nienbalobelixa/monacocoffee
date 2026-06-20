import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, PaymentMethod } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Post('sale')
  createSale(
    @Body() body: { order: CreateOrderDto; paymentMethod: PaymentMethod },
    @CurrentUser('id') staffId: string,
  ) {
    return this.posService.createSale(body.order, body.paymentMethod, staffId);
  }

  @Post('order')
  createOrder(
    @Body() order: CreateOrderDto,
    @CurrentUser('id') staffId: string,
  ) {
    return this.posService.createOrder(order, staffId);
  }

  @Post('payment/:orderId')
  processPayment(
    @Param('orderId') orderId: string,
    @Body('method') method: PaymentMethod,
  ) {
    return this.posService.processPayment(orderId, method);
  }

  @Get('active-orders')
  getActiveOrders() {
    return this.posService.getActiveOrders();
  }

  @Get('tables')
  getActiveTables() {
    return this.posService.getActiveTables();
  }

  @Get('tables/:tableId/orders')
  getTableOrders(@Param('tableId') tableId: string) {
    return this.posService.getTableOrders(tableId);
  }

  @Get('daily-summary')
  getDailySummary() {
    return this.posService.getDailySummary();
  }
}
