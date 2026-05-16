import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Post('events')
  async createEvent(@Request() req, @Body() data: any) {
    return this.calendarService.createEvent(req.user.companyId, req.user.userId, data);
  }

  @Get('events')
  async getEvents(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.calendarService.getEvents(
      req.user.companyId,
      new Date(start),
      new Date(end),
    );
  }

  @Put('events/:id')
  async updateEvent(@Param('id') id: string, @Body() data: any) {
    return this.calendarService.updateEvent(id, data);
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string) {
    return this.calendarService.deleteEvent(id);
  }
}
