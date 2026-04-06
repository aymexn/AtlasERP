import { Controller, Get, Post, Body, Param, Req, UseGuards, Put, Delete } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.expensesService.findAll(req.user.companyId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
      return this.expensesService.getStats(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.expensesService.create(req.user.companyId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
      return this.expensesService.update(req.user.companyId, id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
      return this.expensesService.remove(req.user.companyId, id);
  }
}
