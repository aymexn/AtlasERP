import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { CheckPermission } from '../../rbac/decorators/rbac.decorator';
import { RecruitmentService } from './recruitment.service';
import { ApplicationStage } from '@prisma/client';

@Controller('hr/recruitment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('jobs')
  @CheckPermission('hr', 'recruitment', 'read')
  async getJobPostings(@Request() req) {
    return this.recruitmentService.getJobPostings(req.user.companyId);
  }

  @Post('jobs')
  @CheckPermission('hr', 'recruitment', 'manage')
  async createJobPosting(@Request() req, @Body() data: any) {
    return this.recruitmentService.createJobPosting(req.user.companyId, data, req.user.id);
  }

  @Get('candidates')
  @CheckPermission('hr', 'recruitment', 'read')
  async getCandidates(@Request() req) {
    return this.recruitmentService.getCandidates(req.user.companyId);
  }

  @Post('candidates')
  @CheckPermission('hr', 'recruitment', 'manage')
  async createCandidate(@Request() req, @Body() data: any) {
    return this.recruitmentService.createCandidate(req.user.companyId, data);
  }

  @Get('applications')
  @CheckPermission('hr', 'recruitment', 'read')
  async getApplications(@Request() req, @Query('jobId') jobId?: string) {
    return this.recruitmentService.getApplications(req.user.companyId, jobId);
  }

  @Patch('applications/:id/stage')
  @CheckPermission('hr', 'recruitment', 'manage')
  async updateApplicationStage(@Param('id') id: string, @Body('stage') stage: ApplicationStage) {
    return this.recruitmentService.updateApplicationStage(id, stage);
  }

  @Post('applications/:id/hire')
  @CheckPermission('hr', 'recruitment', 'manage')
  async hireCandidate(@Request() req, @Param('id') id: string) {
    return this.recruitmentService.hireCandidate(req.user.companyId, id);
  }

  @Post('applications/:id/interviews')
  @CheckPermission('hr', 'recruitment', 'manage')
  async scheduleInterview(@Param('id') id: string, @Body() data: any) {
    return this.recruitmentService.scheduleInterview(id, data);
  }
}
