import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Only log mutations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const companyId = user?.companyId;
        const userId = user?.id;

        if (!companyId) return;

        // Determine entity and action from URL
        // Example: /products -> Product
        const pathParts = url.split('/').filter(p => p && p !== 'api');
        const entity = pathParts[0]?.charAt(0).toUpperCase() + pathParts[0]?.slice(1) || 'Unknown';
        const action = `${method}_${entity}`.toUpperCase();

        // Extract entityId if present in URL or response
        const entityId = pathParts[1] || response?.id || 'N/A';

        this.auditService.log({
          companyId,
          userId,
          action,
          entity,
          entityId,
          newValues: method !== 'DELETE' ? body : null,
          oldValues: null, // Would require a DB lookup before mutation
          metadata: {
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            path: url,
          },
        });
      }),
    );
  }
}
