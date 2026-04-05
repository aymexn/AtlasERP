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
exports.ManufacturingOrdersController = void 0;
const common_1 = require("@nestjs/common");
const manufacturing_orders_service_1 = require("./manufacturing-orders.service");
const manufacturing_order_dto_1 = require("./dto/manufacturing-order.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let ManufacturingOrdersController = class ManufacturingOrdersController {
    constructor(manufacturingOrdersService) {
        this.manufacturingOrdersService = manufacturingOrdersService;
    }
    create(req, createDto) {
        return this.manufacturingOrdersService.create(req.user.companyId, createDto);
    }
    findAll(req, status) {
        return this.manufacturingOrdersService.findAll(req.user.companyId, status);
    }
    findOne(req, id) {
        return this.manufacturingOrdersService.findOne(req.user.companyId, id);
    }
    update(req, id, updateDto) {
        return this.manufacturingOrdersService.update(req.user.companyId, id, updateDto);
    }
    plan(req, id) {
        return this.manufacturingOrdersService.plan(req.user.companyId, id);
    }
    start(req, id) {
        return this.manufacturingOrdersService.start(req.user.companyId, req.user.id, id);
    }
    complete(req, id, completeDto) {
        return this.manufacturingOrdersService.complete(req.user.companyId, req.user.id, id, completeDto);
    }
    cancel(req, id) {
        return this.manufacturingOrdersService.cancel(req.user.companyId, id);
    }
};
exports.ManufacturingOrdersController = ManufacturingOrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, manufacturing_order_dto_1.CreateManufacturingOrderDto]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, manufacturing_order_dto_1.UpdateManufacturingOrderDto]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/plan'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "plan", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, manufacturing_order_dto_1.CompleteManufacturingOrderDto]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManufacturingOrdersController.prototype, "cancel", null);
exports.ManufacturingOrdersController = ManufacturingOrdersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('manufacturing-orders'),
    __metadata("design:paramtypes", [manufacturing_orders_service_1.ManufacturingOrdersService])
], ManufacturingOrdersController);
//# sourceMappingURL=manufacturing-orders.controller.js.map