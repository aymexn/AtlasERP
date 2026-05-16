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
exports.RecruitmentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../rbac/guards/permissions.guard");
const rbac_decorator_1 = require("../../rbac/decorators/rbac.decorator");
const recruitment_service_1 = require("./recruitment.service");
const client_1 = require("@prisma/client");
let RecruitmentController = class RecruitmentController {
    constructor(recruitmentService) {
        this.recruitmentService = recruitmentService;
    }
    async getJobPostings(req) {
        return this.recruitmentService.getJobPostings(req.user.companyId);
    }
    async createJobPosting(req, data) {
        return this.recruitmentService.createJobPosting(req.user.companyId, data, req.user.id);
    }
    async getCandidates(req) {
        return this.recruitmentService.getCandidates(req.user.companyId);
    }
    async createCandidate(req, data) {
        return this.recruitmentService.createCandidate(req.user.companyId, data);
    }
    async getApplications(req, jobId) {
        return this.recruitmentService.getApplications(req.user.companyId, jobId);
    }
    async updateApplicationStage(id, stage) {
        return this.recruitmentService.updateApplicationStage(id, stage);
    }
    async hireCandidate(req, id) {
        return this.recruitmentService.hireCandidate(req.user.companyId, id);
    }
    async applyToJob(data) {
        return this.recruitmentService.applyToJob(data.jobPostingId, data.candidateId, data.notes);
    }
    async scheduleInterview(id, data) {
        return this.recruitmentService.scheduleInterview(id, data);
    }
};
exports.RecruitmentController = RecruitmentController;
__decorate([
    (0, common_1.Get)('jobs'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'read'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "getJobPostings", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'manage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createJobPosting", null);
__decorate([
    (0, common_1.Get)('candidates'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'read'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "getCandidates", null);
__decorate([
    (0, common_1.Post)('candidates'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'manage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createCandidate", null);
__decorate([
    (0, common_1.Get)('applications'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'read'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Patch)('applications/:id/stage'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('stage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "updateApplicationStage", null);
__decorate([
    (0, common_1.Post)('applications/:id/hire'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'manage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "hireCandidate", null);
__decorate([
    (0, common_1.Post)('applications'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "applyToJob", null);
__decorate([
    (0, common_1.Post)('applications/:id/interviews'),
    (0, rbac_decorator_1.CheckPermission)('hr', 'recruitment', 'manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "scheduleInterview", null);
exports.RecruitmentController = RecruitmentController = __decorate([
    (0, common_1.Controller)('hr/recruitment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [recruitment_service_1.RecruitmentService])
], RecruitmentController);
//# sourceMappingURL=recruitment.controller.js.map