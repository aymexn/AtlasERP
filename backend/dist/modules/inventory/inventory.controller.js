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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const stock_movement_service_1 = require("./services/stock-movement.service");
const inventory_service_1 = require("./services/inventory.service");
const create_movement_dto_1 = require("./dto/create-movement.dto");
const swagger_1 = require("@nestjs/swagger");
let InventoryController = class InventoryController {
    constructor(stockMovementService, inventoryService) {
        this.stockMovementService = stockMovementService;
        this.inventoryService = inventoryService;
    }
    async createMovement(req, dto) {
        return this.stockMovementService.createMovement(req.user.companyId, req.user.userId, dto);
    }
    async listMovements(req) {
        return this.stockMovementService.listMovements(req.user.companyId);
    }
    async getStock(req, warehouseId) {
        return this.inventoryService.getProductsStock(req.user.companyId, warehouseId);
    }
    async getProductsStockDashboard(req) {
        return this.inventoryService.getInventorySummary(req.user.companyId);
    }
    async getAlerts(req) {
        return this.inventoryService.getLowStockAlerts(req.user.companyId);
    }
    async getProductHistory(productId, req) {
        return this.stockMovementService.getProductMovementHistory(productId, req.user.companyId);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('movements'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new stock movement' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_movement_dto_1.CreateStockMovementDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createMovement", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, swagger_1.ApiOperation)({ summary: 'List all stock movements' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listMovements", null);
__decorate([
    (0, common_1.Get)('stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current stock per product' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStock", null);
__decorate([
    (0, common_1.Get)('products-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get stock dashboard summary' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProductsStockDashboard", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get low stock alerts' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('product/:id/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get movement history for a specific product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProductHistory", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [stock_movement_service_1.StockMovementService,
        inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map