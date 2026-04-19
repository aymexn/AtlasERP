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
const pdf_service_1 = require("../../common/services/pdf.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let SalesOrdersController = class SalesOrdersController {
    constructor(salesOrdersService, pdfService) {
        this.salesOrdersService = salesOrdersService;
        this.pdfService = pdfService;
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
    async validate(req, id) {
        return this.salesOrdersService.validateOrder(req.user.companyId, id);
    }
    async cancel(req, id) {
        return this.salesOrdersService.cancelOrder(req.user.companyId, id);
    }
    async getProfitability(req, id) {
        return this.salesOrdersService.getProfitability(req.user.companyId, id);
    }
    async generatePdf(id, req, res) {
        try {
            const companyId = req.user?.companyId;
            const order = companyId
                ? await this.salesOrdersService.findOne(companyId, id)
                : await this.salesOrdersService.findOnePublic(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Order-${order.reference}.pdf`);
            await this.pdfService.generateSalesOrderPdf(order, res);
        }
        catch (error) {
            console.error('Sales Order PDF Route Error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Error generating sales order PDF',
                    error: error.message
                });
            }
        }
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
    (0, common_1.Patch)(':id/validate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "validate", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id/profitability'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "getProfitability", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "generatePdf", null);
exports.SalesOrdersController = SalesOrdersController = __decorate([
    (0, common_1.Controller)('sales-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sales_orders_service_1.SalesOrdersService,
        pdf_service_1.PdfService])
], SalesOrdersController);
//# sourceMappingURL=sales-orders.controller.js.map