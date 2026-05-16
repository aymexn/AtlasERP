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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationController = void 0;
const common_1 = require("@nestjs/common");
const activity_service_1 = require("../services/activity.service");
const notification_service_1 = require("../services/notification.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let CollaborationController = class CollaborationController {
    constructor(activityService, notificationService) {
        this.activityService = activityService;
        this.notificationService = notificationService;
    }
    async getActivityFeed(req, projectId, limit) {
        return this.activityService.getActivityFeed(req.user.companyId, projectId, limit ? parseInt(limit) : 50);
    }
    async createActivity(req, data) {
        return this.activityService.createActivity({
            ...data,
            companyId: req.user.companyId,
            userId: req.user.userId,
        });
    }
    async getNotifications(req) {
        return this.notificationService.getNotifications(req.user.userId);
    }
    async getUnreadCount(req) {
        return this.notificationService.getUnreadCount(req.user.userId);
    }
    async markAsRead(id) {
        return this.notificationService.markAsRead(id);
    }
};
exports.CollaborationController = CollaborationController;
__decorate([
    (0, common_1.Get)('activity'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "getActivityFeed", null);
__decorate([
    (0, common_1.Post)('activity'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "createActivity", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('notifications/unread-count'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Put)('notifications/:id/read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "markAsRead", null);
exports.CollaborationController = CollaborationController = __decorate([
    (0, common_1.Controller)('collaboration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [activity_service_1.ActivityService,
        notification_service_1.NotificationService])
], CollaborationController);
//# sourceMappingURL=collaboration.controller.js.map