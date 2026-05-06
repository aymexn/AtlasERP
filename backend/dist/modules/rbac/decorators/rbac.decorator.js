"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckPermission = exports.CHECK_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CHECK_PERMISSION_KEY = 'check_permission';
const CheckPermission = (module, resource, action) => (0, common_1.SetMetadata)(exports.CHECK_PERMISSION_KEY, { module, resource, action });
exports.CheckPermission = CheckPermission;
//# sourceMappingURL=rbac.decorator.js.map