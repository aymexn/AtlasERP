import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AgedReceivablesService } from './aged-receivables.service';
import { PaymentReminderService } from './payment-reminder.service';
import { CollectionService } from './collection.service';
import { CashFlowService } from './cash-flow.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('treasury')
@UseGuards(JwtAuthGuard)
export class TreasuryController {
  constructor(
    private readonly agedService: AgedReceivablesService,
    private readonly reminderService: PaymentReminderService,
    private readonly collectionService: CollectionService,
    private readonly cashFlowService: CashFlowService,
  ) {}

  @Get('aged-receivables')
  getAgedReceivables(@Request() req) {
    return this.agedService.getAgedReceivables(req.user.companyId);
  }

  @Get('customers/:id/aging')
  getCustomerAging(@Request() req, @Param('id') id: string) {
    return this.agedService.getCustomerAging(req.user.companyId, id);
  }

  @Post('reminders/send/:invoiceId')
  sendReminder(@Param('invoiceId') invoiceId: string) {
    return this.reminderService.sendReminder(invoiceId);
  }

  @Post('reminders/send-daily')
  sendDailyReminders(@Request() req) {
    return this.reminderService.sendDailyReminders(req.user.companyId);
  }

  @Get('collections/priority')
  getCollectionPriority(@Request() req) {
    return this.collectionService.getCollectionPriority(req.user.companyId);
  }

  @Post('collections/activities')
  logActivity(@Request() req, @Body() data: any) {
    return this.collectionService.logActivity(req.user.companyId, data);
  }

  @Get('collections/activities/:customerId')
  getActivities(@Request() req, @Param('customerId') customerId: string) {
    return this.collectionService.getActivities(req.user.companyId, customerId);
  }

  @Get('forecast')
  getForecast(@Request() req) {
    return this.cashFlowService.get30DayForecast(req.user.companyId);
  }
}
