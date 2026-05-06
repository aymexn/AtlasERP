"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const notifications_module_1 = require("../notifications/notifications.module");
const treasury_controller_1 = require("./treasury.controller");
const aged_receivables_service_1 = require("./aged-receivables.service");
const payment_reminder_service_1 = require("./payment-reminder.service");
const collection_service_1 = require("./collection.service");
const cash_flow_service_1 = require("./cash-flow.service");
let TreasuryModule = class TreasuryModule {
};
exports.TreasuryModule = TreasuryModule;
exports.TreasuryModule = TreasuryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notifications_module_1.NotificationsModule],
        controllers: [treasury_controller_1.TreasuryController],
        providers: [
            aged_receivables_service_1.AgedReceivablesService,
            payment_reminder_service_1.PaymentReminderService,
            collection_service_1.CollectionService,
            cash_flow_service_1.CashFlowService,
        ],
        exports: [
            aged_receivables_service_1.AgedReceivablesService,
            payment_reminder_service_1.PaymentReminderService,
            collection_service_1.CollectionService,
            cash_flow_service_1.CashFlowService,
        ],
    })
], TreasuryModule);
//# sourceMappingURL=treasury.module.js.map