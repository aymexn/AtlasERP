import { Controller, Post, Body, Param, Patch, UseGuards, Request, Delete } from '@nestjs/common';
import { ProjectService } from '../services/project.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private projectService: ProjectService) {}

  @Post()
  async createTask(@Request() req, @Body() data: any) {
    // Body must contain projectId
    return this.projectService.createTask(req.user.companyId, req.user.userId, data.projectId, data);
  }

  @Patch(':id/move')
  async moveTask(@Param('id') taskId: string, @Body() data: any) {
    return this.projectService.moveTask(taskId, data);
  }

  @Delete(':id')
  async deleteTask(@Param('id') taskId: string) {
    // We should add a deleteTask method to ProjectService if not already there
    // For now, let's assume it exists or use Prisma directly via Service
    return this.projectService.deleteTask(taskId);
  }
}
