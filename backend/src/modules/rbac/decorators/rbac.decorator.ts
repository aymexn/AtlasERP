import { SetMetadata } from '@nestjs/common';

export const CHECK_PERMISSION_KEY = 'check_permission';
export const CheckPermission = (module: string, resource: string, action: string) => 
  SetMetadata(CHECK_PERMISSION_KEY, { module, resource, action });
