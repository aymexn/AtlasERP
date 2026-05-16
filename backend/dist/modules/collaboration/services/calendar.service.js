"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const rrule_1 = require("rrule");
const activity_service_1 = require("./activity.service");
const collaboration_gateway_1 = require("../gateways/collaboration.gateway");
let CalendarService = class CalendarService {
    constructor(prisma, activityService, gateway) {
        this.prisma = prisma;
        this.activityService = activityService;
        this.gateway = gateway;
    }
    async createEvent(companyId, userId, data) {
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
        this.gateway.broadcast('event_created', event);
        return event;
    }
    async getEvents(companyId, start, end) {
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
        const allEvents = [];
        for (const event of events) {
            if (event.isRecurring && event.recurrenceRule) {
                const expanded = this.expandRecurringEvent(event, start, end);
                allEvents.push(...expanded);
            }
            else {
                allEvents.push(event);
            }
        }
        return allEvents;
    }
    expandRecurringEvent(event, rangeStart, rangeEnd) {
        try {
            const rule = rrule_1.RRule.fromString(event.recurrenceRule);
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
        }
        catch (e) {
            return [event];
        }
    }
    async updateEvent(id, data) {
        const event = await this.prisma.calendarEvent.update({
            where: { id },
            data,
        });
        this.gateway.broadcast('event_updated', event);
        return event;
    }
    async deleteEvent(id) {
        const event = await this.prisma.calendarEvent.delete({
            where: { id },
        });
        this.gateway.broadcast('event_deleted', id);
        return event;
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService,
        collaboration_gateway_1.CollaborationGateway])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map