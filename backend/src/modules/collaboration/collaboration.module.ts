import { Module } from '@nestjs/common';
import { CollaborationGateway } from './gateways/collaboration.gateway';
import { ProjectService } from './services/project.service';
import { CalendarService } from './services/calendar.service';
import { ActivityService } from './services/activity.service';
import { NotificationService } from './services/notification.service';
import { ProjectController } from './controllers/project.controller';
import { TaskController } from './controllers/tasks.controller';
import { CalendarController } from './controllers/calendar.controller';
import { CollaborationController } from './controllers/collaboration.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule],
  providers: [
    CollaborationGateway,
    ProjectService,
    CalendarService,
    ActivityService,
    NotificationService,
  ],
  controllers: [
    ProjectController,
    TaskController,
    CalendarController,
    CollaborationController,
  ],
  exports: [
    ProjectService,
    CalendarService,
    ActivityService,
    NotificationService,
    CollaborationGateway,
  ],
})
export class CollaborationModule {}
