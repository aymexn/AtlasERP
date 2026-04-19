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
exports.PurchaseOrdersController = void 0;
const common_1 = require("@nestjs/common");
const purchase_orders_service_1 = require("./purchase-orders.service");
const purchase_order_dto_1 = require("./dto/purchase-order.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
const pdf_service_1 = require("../../common/services/pdf.service");
let PurchaseOrdersController = class PurchaseOrdersController {
    constructor(purchaseOrdersService, pdfService) {
        this.purchaseOrdersService = purchaseOrdersService;
        this.pdfService = pdfService;
    }
    create(req, createDto) {
        return this.purchaseOrdersService.create(req.user.companyId, createDto);
    }
    list(req, status) {
        return this.purchaseOrdersService.list(req.user.companyId, status);
    }
    findOne(req, id) {
        return this.purchaseOrdersService.findOne(id, req.user.companyId);
    }
    confirm(req, id) {
        return this.purchaseOrdersService.confirm(id, req.user.companyId);
    }
    send(req, id) {
        return this.purchaseOrdersService.send(id, req.user.companyId);
    }
    cancel(req, id) {
        return this.purchaseOrdersService.cancel(id, req.user.companyId);
    }
    createReception(req, id, warehouseId, notes) {
        return this.purchaseOrdersService.createReception(id, req.user.companyId, warehouseId, notes);
    }
    async generatePdf(id, req, res) {
        try {
            const order = await this.purchaseOrdersService.findOne(id, req.user.companyId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=PurchaseOrder-${order.reference}.pdf`);
            await this.pdfService.generatePurchaseOrderPdf(order, res);
        }
        catch (error) {
            console.error('Purchase Order PDF Route Error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Error generating purchase order PDF',
                    error: error.message
                });
            }
        }
    }
};
exports.PurchaseOrdersController = PurchaseOrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, purchase_order_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "send", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/create-reception'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('warehouseId')),
    __param(3, (0, common_1.Body)('notes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "createReception", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PurchaseOrdersController.prototype, "generatePdf", null);
exports.PurchaseOrdersController = PurchaseOrdersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('purchase-orders'),
    __metadata("design:paramtypes", [purchase_orders_service_1.PurchaseOrdersService,
        pdf_service_1.PdfService])
], PurchaseOrdersController);
//# sourceMappingURL=purchase-orders.controller.js.map