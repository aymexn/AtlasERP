"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationModule = void 0;
const common_1 = require("@nestjs/common");
const collaboration_gateway_1 = require("./gateways/collaboration.gateway");
const project_service_1 = require("./services/project.service");
const calendar_service_1 = require("./services/calendar.service");
const activity_service_1 = require("./services/activity.service");
const notification_service_1 = require("./services/notification.service");
const project_controller_1 = require("./controllers/project.controller");
const tasks_controller_1 = require("./controllers/tasks.controller");
const calendar_controller_1 = require("./controllers/calendar.controller");
const collaboration_controller_1 = require("./controllers/collaboration.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const notifications_module_1 = require("../notifications/notifications.module");
const auth_module_1 = require("../auth/auth.module");
let CollaborationModule = class CollaborationModule {
};
exports.CollaborationModule = CollaborationModule;
exports.CollaborationModule = CollaborationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notifications_module_1.NotificationsModule, auth_module_1.AuthModule],
        providers: [
            collaboration_gateway_1.CollaborationGateway,
            project_service_1.ProjectService,
            calendar_service_1.CalendarService,
            activity_service_1.ActivityService,
            notification_service_1.NotificationService,
        ],
        controllers: [
            project_controller_1.ProjectController,
            tasks_controller_1.TaskController,
            calendar_controller_1.CalendarController,
            collaboration_controller_1.CollaborationController,
        ],
        exports: [
            project_service_1.ProjectService,
            calendar_service_1.CalendarService,
            activity_service_1.ActivityService,
            notification_service_1.NotificationService,
            collaboration_gateway_1.CollaborationGateway,
        ],
    })
], CollaborationModule);
//# sourceMappingURL=collaboration.module.js.map