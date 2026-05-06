import { apiFetch } from '@/lib/api';

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  oldValues: any;
  newValues: any;
  metadata: any;
  createdAt: string;
  user?: {
    email: string;
  };
}

export const auditService = {
  list: (filters: { entity?: string; userId?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    return apiFetch(`/audit${queryString ? `?${queryString}` : ''}`);
  },
};
