"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const sales_orders_service_1 = require("./sales-orders.service");
const sales_orders_controller_1 = require("./sales-orders.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const invoices_module_1 = require("../invoices/invoices.module");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, invoices_module_1.InvoicesModule],
        controllers: [sales_orders_controller_1.SalesOrdersController],
        providers: [sales_orders_service_1.SalesOrdersService],
        exports: [sales_orders_service_1.SalesOrdersService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map