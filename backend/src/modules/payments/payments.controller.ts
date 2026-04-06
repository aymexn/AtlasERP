import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.paymentsService.findAll(req.user.companyId);
  }

  @Post()
  async recordPayment(@Body() body: any, @Req() req: any) {
    return this.paymentsService.recordPayment(req.user.companyId, body);
  }
}
