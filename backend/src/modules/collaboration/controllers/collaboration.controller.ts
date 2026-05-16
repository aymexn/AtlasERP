import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Query } from '@nestjs/common';
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('collaboration')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(
    private activityService: ActivityService,
    private notificationService: NotificationService,
  ) {}

  @Get('activity')
  async getActivityFeed(@Request() req, @Query('projectId') projectId?: string, @Query('limit') limit?: string) {
    return this.activityService.getActivityFeed(req.user.companyId, projectId, limit ? parseInt(limit) : 50);
  }

  @Post('activity')
  async createActivity(@Request() req, @Body() data: any) {
    return this.activityService.createActivity({
        ...data,
        companyId: req.user.companyId,
        userId: req.user.userId,
    });
  }

  @Get('notifications')
  async getNotifications(@Request() req) {
    return this.notificationService.getNotifications(req.user.userId);
  }

  @Get('notifications/unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.userId);
  }

  @Put('notifications/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
