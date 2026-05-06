import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TreasuryController } from './treasury.controller';
import { AgedReceivablesService } from './aged-receivables.service';
import { PaymentReminderService } from './payment-reminder.service';
import { CollectionService } from './collection.service';
import { CashFlowService } from './cash-flow.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [TreasuryController],
  providers: [
    AgedReceivablesService,
    PaymentReminderService,
    CollectionService,
    CashFlowService,
  ],
  exports: [
    AgedReceivablesService,
    PaymentReminderService,
    CollectionService,
    CashFlowService,
  ],
})
export class TreasuryModule {}
