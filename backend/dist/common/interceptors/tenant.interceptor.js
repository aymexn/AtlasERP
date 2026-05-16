"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
let TenantInterceptor = class TenantInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const companyId = request.user?.companyId;
        if (companyId) {
            return new rxjs_1.Observable((observer) => {
                prisma_service_1.tenantContext.run({ tenantId: companyId }, () => {
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
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = __decorate([
    (0, common_1.Injectable)()
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map