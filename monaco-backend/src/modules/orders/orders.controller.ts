import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/cli.map((_, i) =>ent';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @Get()
  findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyOrders(@CurrentUser('id') userId: string, @Query() query: any) {
    return this.ordersService.findMyOrders(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    if (user?.role === Role.ADMIN || user?.role === Role.MANAGER) {
      return this.ordersService.remove(id, user);
    }
    return this.ordersService.cancel(id, user);
  }
}
