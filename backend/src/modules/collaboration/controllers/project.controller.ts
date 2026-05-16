import { Controller, Get, Post, Body, Param, Put, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { ProjectService } from '../services/project.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  async createProject(@Request() req, @Body() data: any) {
    return this.projectService.createProject(req.user.companyId, req.user.userId, data);
  }

  @Get()
  async getProjects(@Request() req) {
    return this.projectService.getProjects(req.user.companyId);
  }

  @Get(':id')
  async getProject(@Param('id') id: string) {
    return this.projectService.getProjectById(id);
  }

  @Get(':id/kanban')
  async getKanban(@Param('id') id: string) {
    return this.projectService.getKanbanBoard(id);
  }

  @Post(':id/tasks')
  async createTask(@Param('id') projectId: string, @Request() req, @Body() data: any) {
    return this.projectService.createTask(req.user.companyId, req.user.userId, projectId, data);
  }

  @Put('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() data: any, @Request() req) {
    return this.projectService.updateTask(taskId, data, req.user.userId);
  }

  @Patch('tasks/:taskId/move')
  async moveTask(@Param('taskId') taskId: string, @Body() data: any) {
    return this.projectService.moveTask(taskId, data);
  }
}
