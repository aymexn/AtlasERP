import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckPermission } from '../rbac/decorators/rbac.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @CheckPermission('users', 'user', 'read')
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('invite')
  @CheckPermission('users', 'user', 'create')
  async invite(
    @Body() body: { email: string, roleId: string },
    @Request() req
  ) {
    return this.usersService.invite(body.email, body.roleId, req.user.id, req.user.companyId);
  }
}
