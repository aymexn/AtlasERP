"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesModule = void 0;
const common_1 = require("@nestjs/common");
const suppliers_service_1 = require("./suppliers.service");
const suppliers_controller_1 = require("./suppliers.controller");
const purchase_orders_service_1 = require("./purchase-orders.service");
const purchase_orders_controller_1 = require("./purchase-orders.controller");
const stock_receptions_service_1 = require("./stock-receptions.service");
const stock_receptions_controller_1 = require("./stock-receptions.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const inventory_module_1 = require("../inventory/inventory.module");
let PurchasesModule = class PurchasesModule {
};
exports.PurchasesModule = PurchasesModule;
exports.PurchasesModule = PurchasesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, inventory_module_1.InventoryModule],
        providers: [
            suppliers_service_1.SuppliersService,
            purchase_orders_service_1.PurchaseOrdersService,
            stock_receptions_service_1.StockReceptionsService,
        ],
        controllers: [
            suppliers_controller_1.SuppliersController,
            purchase_orders_controller_1.PurchaseOrdersController,
            stock_receptions_controller_1.StockReceptionsController,
        ],
        exports: [
            suppliers_service_1.SuppliersService,
            purchase_orders_service_1.PurchaseOrdersService,
            stock_receptions_service_1.StockReceptionsService,
        ],
    })
], PurchasesModule);
//# sourceMappingURL=purchases.module.js.map