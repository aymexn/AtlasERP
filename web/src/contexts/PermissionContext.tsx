'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  description: string | null;
}

interface GroupedPermissions {
  [module: string]: {
    [resource: string]: string[];
  };
}

interface PermissionContextType {
  permissions: Permission[];
  grouped: GroupedPermissions;
  hasPermission: (module: string, resource: string, action: string) => boolean;
  hasAnyPermission: (required: { module: string, resource: string, action: string }[]) => boolean;
  roles: { id: string, name: string, displayName: string }[];
  hasRole: (roleName: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grouped, setGrouped] = useState<GroupedPermissions>({});
  const [roles, setRoles] = useState<{ id: string, name: string, displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      const data = await apiFetch('/rbac/permissions/me');
      setPermissions(data.permissions || []);
      setGrouped(data.grouped || {});
      setRoles(data.roles || []);
    } catch (error) {
      console.error('[PermissionProvider] Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const hasPermission = (module: string, resource: string, action: string): boolean => {
    return grouped[module]?.[resource]?.includes(action) || false;
  };

  const hasAnyPermission = (required: { module: string, resource: string, action: string }[]): boolean => {
    return required.some(r => hasPermission(r.module, r.resource, r.action));
  };

  const hasRole = (roleName: string): boolean => {
    return roles.some(r => r.name === roleName);
  };

  return (
    <PermissionContext.Provider value={{
      permissions,
      grouped,
      hasPermission,
      hasAnyPermission,
      roles,
      hasRole,
      loading,
      refresh: loadPermissions,
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
