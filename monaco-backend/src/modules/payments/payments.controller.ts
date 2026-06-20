import { Controller, Post, Patch, Param, Body, Get, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('order/:orderId')
  createPayment(
    @Param('orderId') orderId: string,
    @Body('method') method: PaymentMethod,
  ) {
    return this.paymentsService.createPayment(orderId, method);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/confirm')
  confirmPayment(
    @Param('id') id: string,
    @Body('transactionRef') ref?: string,
  ) {
    return this.paymentsService.confirmPayment(id, ref);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }
}
