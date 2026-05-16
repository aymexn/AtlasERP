import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RRule } from 'rrule';
import { ActivityService } from './activity.service';
import { CollaborationGateway } from '../gateways/collaboration.gateway';

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private gateway: CollaborationGateway,
  ) {}

  async createEvent(companyId: string, userId: string, data: any) {
    const event = await this.prisma.calendarEvent.create({
      data: {
        ...data,
        companyId,
        createdBy: userId,
        organizerId: userId,
      },
    });

    await this.activityService.createActivity({
      companyId,
      userId,
      activityType: 'event_created',
      resourceType: 'calendar_event',
      resourceId: event.id,
      resourceTitle: event.title,
      description: `a créé l'événement "${event.title}"`,
    });

    // Broadcast to all company users
    this.gateway.broadcast('event_created', event);

    return event;
  }

  async getEvents(companyId: string, start: Date, end: Date) {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        companyId,
        OR: [
          {
            startDatetime: {
              gte: start,
              lte: end,
            },
          },
          {
            isRecurring: true,
          },
        ],
      },
    });

    // Expand recurring events
    const allEvents = [];
    for (const event of events) {
      if (event.isRecurring && event.recurrenceRule) {
        const expanded = this.expandRecurringEvent(event, start, end);
        allEvents.push(...expanded);
      } else {
        allEvents.push(event);
      }
    }

    return allEvents;
  }

  private expandRecurringEvent(event: any, rangeStart: Date, rangeEnd: Date) {
    try {
      const rule = RRule.fromString(event.recurrenceRule);
      const occurrences = rule.between(rangeStart, rangeEnd, true);

      return occurrences.map((date, index) => {
        const duration = event.endDatetime.getTime() - event.startDatetime.getTime();
        return {
          ...event,
          id: `${event.id}_${index}`,
          originalId: event.id,
          startDatetime: date,
          endDatetime: new Date(date.getTime() + duration),
        };
      });
    } catch (e) {
      return [event];
    }
  }

  async updateEvent(id: string, data: any) {
    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data,
    });

    this.gateway.broadcast('event_updated', event);
    return event;
  }

  async deleteEvent(id: string) {
    const event = await this.prisma.calendarEvent.delete({
      where: { id },
    });

    this.gateway.broadcast('event_deleted', id);
    return event;
  }
}
