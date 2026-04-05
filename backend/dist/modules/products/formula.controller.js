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
exports.FormulaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const formula_service_1 = require("./formula.service");
const formula_dto_1 = require("./dto/formula.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let FormulaController = class FormulaController {
    constructor(formulaService) {
        this.formulaService = formulaService;
    }
    getProductFormulas(productId, req) {
        return this.formulaService.getProductFormulas(productId, req.user.companyId);
    }
    getFormula(id, req) {
        return this.formulaService.getFormula(id, req.user.companyId);
    }
    createFormula(productId, dto, req) {
        return this.formulaService.createFormula(productId, req.user.companyId, dto);
    }
    updateFormula(id, dto, req) {
        return this.formulaService.updateFormula(id, req.user.companyId, dto);
    }
    activateFormula(id, req) {
        return this.formulaService.updateFormulaStatus(id, req.user.companyId, 'ACTIVE');
    }
    archiveFormula(id, req) {
        return this.formulaService.updateFormulaStatus(id, req.user.companyId, 'ARCHIVED');
    }
    addLine(id, dto, req) {
        return this.formulaService.addLine(id, req.user.companyId, dto);
    }
    updateLine(lineId, dto, req) {
        return this.formulaService.updateLine(lineId, req.user.companyId, dto);
    }
    removeLine(lineId, req) {
        return this.formulaService.removeLine(lineId, req.user.companyId);
    }
};
exports.FormulaController = FormulaController;
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all formulas for a product' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "getProductFormulas", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get formula by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "getFormula", null);
__decorate([
    (0, common_1.Post)('product/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create formula for a product' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, formula_dto_1.CreateFormulaDto, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "createFormula", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update formula' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, formula_dto_1.UpdateFormulaDto, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "updateFormula", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate formula' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "activateFormula", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Archive formula' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "archiveFormula", null);
__decorate([
    (0, common_1.Post)(':id/lines'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a line to product formula' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, formula_dto_1.CreateFormulaLineDto, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "addLine", null);
__decorate([
    (0, common_1.Patch)('lines/:lineId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a formula line' }),
    __param(0, (0, common_1.Param)('lineId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, formula_dto_1.UpdateFormulaLineDto, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "updateLine", null);
__decorate([
    (0, common_1.Delete)('lines/:lineId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a formula line' }),
    __param(0, (0, common_1.Param)('lineId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormulaController.prototype, "removeLine", null);
exports.FormulaController = FormulaController = __decorate([
    (0, swagger_1.ApiTags)('Formulas'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('formulas'),
    __metadata("design:paramtypes", [formula_service_1.FormulaService])
], FormulaController);
//# sourceMappingURL=formula.controller.js.map