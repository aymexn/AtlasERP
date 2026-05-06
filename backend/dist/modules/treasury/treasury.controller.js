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
exports.TreasuryController = void 0;
const common_1 = require("@nestjs/common");
const aged_receivables_service_1 = require("./aged-receivables.service");
const payment_reminder_service_1 = require("./payment-reminder.service");
const collection_service_1 = require("./collection.service");
const cash_flow_service_1 = require("./cash-flow.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let TreasuryController = class TreasuryController {
    constructor(agedService, reminderService, collectionService, cashFlowService) {
        this.agedService = agedService;
        this.reminderService = reminderService;
        this.collectionService = collectionService;
        this.cashFlowService = cashFlowService;
    }
    getAgedReceivables(req) {
        return this.agedService.getAgedReceivables(req.user.companyId);
    }
    getCustomerAging(req, id) {
        return this.agedService.getCustomerAging(req.user.companyId, id);
    }
    sendReminder(invoiceId) {
        return this.reminderService.sendReminder(invoiceId);
    }
    sendDailyReminders(req) {
        return this.reminderService.sendDailyReminders(req.user.companyId);
    }
    getCollectionPriority(req) {
        return this.collectionService.getCollectionPriority(req.user.companyId);
    }
    logActivity(req, data) {
        return this.collectionService.logActivity(req.user.companyId, data);
    }
    getActivities(req, customerId) {
        return this.collectionService.getActivities(req.user.companyId, customerId);
    }
    getForecast(req) {
        return this.cashFlowService.get30DayForecast(req.user.companyId);
    }
};
exports.TreasuryController = TreasuryController;
__decorate([
    (0, common_1.Get)('aged-receivables'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getAgedReceivables", null);
__decorate([
    (0, common_1.Get)('customers/:id/aging'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getCustomerAging", null);
__decorate([
    (0, common_1.Post)('reminders/send/:invoiceId'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "sendReminder", null);
__decorate([
    (0, common_1.Post)('reminders/send-daily'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "sendDailyReminders", null);
__decorate([
    (0, common_1.Get)('collections/priority'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getCollectionPriority", null);
__decorate([
    (0, common_1.Post)('collections/activities'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "logActivity", null);
__decorate([
    (0, common_1.Get)('collections/activities/:customerId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getActivities", null);
__decorate([
    (0, common_1.Get)('forecast'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "getForecast", null);
exports.TreasuryController = TreasuryController = __decorate([
    (0, common_1.Controller)('treasury'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [aged_receivables_service_1.AgedReceivablesService,
        payment_reminder_service_1.PaymentReminderService,
        collection_service_1.CollectionService,
        cash_flow_service_1.CashFlowService])
], TreasuryController);
//# sourceMappingURL=treasury.controller.js.map