import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from '../../modules/prisma/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId;

    if (companyId) {
      return new Observable((observer) => {
        tenantContext.run({ tenantId: companyId }, () => {
          next.handle().subscribe({
            next: (val) => observer.next(val),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        });
      });
    }

    return next.handle();
  }
}
