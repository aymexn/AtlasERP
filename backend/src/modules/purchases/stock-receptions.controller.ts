import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StockReceptionsService } from './stock-receptions.service';
import { CreateStockReceptionDto } from './dto/stock-reception.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock-receptions')
export class StockReceptionsController {
  constructor(private readonly stockReceptionsService: StockReceptionsService) {}

  @Get()
  list(@Request() req) {
    return this.stockReceptionsService.list(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.stockReceptionsService.findOne(id, req.user.companyId);
  }

  @Post(':id/validate')
  validate(@Request() req, @Param('id') id: string) {
    return this.stockReceptionsService.validate(id, req.user.companyId, req.user.userId);
  }
}
