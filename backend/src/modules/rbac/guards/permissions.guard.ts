import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { CHECK_PERMISSION_KEY } from '../decorators/rbac.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<{ module: string, resource: string, action: string }>(
      CHECK_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = await this.rbacService.checkPermission(
      user.id,
      requiredPermission.module,
      requiredPermission.resource,
      requiredPermission.action,
    );

    // Audit Log
    await this.rbacService.logAccess({
      userId: user.id,
      actionType: hasPermission ? 'access_granted' : 'access_denied',
      module: requiredPermission.module,
      resource: requiredPermission.resource,
      action: requiredPermission.action,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${requiredPermission.action} on ${requiredPermission.resource} in ${requiredPermission.module}`
      );
    }

    return true;
  }
}
