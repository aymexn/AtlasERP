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
exports.SalesOrdersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const sales_orders_service_1 = require("./sales-orders.service");
let SalesOrdersController = class SalesOrdersController {
    constructor(salesOrdersService) {
        this.salesOrdersService = salesOrdersService;
    }
    async findAll(req) {
        return this.salesOrdersService.findAll(req.user.companyId);
    }
    async findOne(req, id) {
        return this.salesOrdersService.findOne(req.user.companyId, id);
    }
    async create(req, data) {
        return this.salesOrdersService.create(req.user.companyId, data);
    }
    async ship(req, id) {
        return this.salesOrdersService.ship(req.user.companyId, req.user.userId, id);
    }
    async getProfitability(req, id) {
        return this.salesOrdersService.getProfitability(req.user.companyId, id);
    }
};
exports.SalesOrdersController = SalesOrdersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/ship'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "ship", null);
__decorate([
    (0, common_1.Get)(':id/profitability'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "getProfitability", null);
exports.SalesOrdersController = SalesOrdersController = __decorate([
    (0, common_1.Controller)('sales-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sales_orders_service_1.SalesOrdersService])
], SalesOrdersController);
//# sourceMappingURL=sales-orders.controller.js.map