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

let cachedPermissionsData: any = null;
let inFlightPermissionsPromise: Promise<any> | null = null;
const LOCAL_STORAGE_KEY = 'atlas_permissions_cache';

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grouped, setGrouped] = useState<GroupedPermissions>({});
  const [roles, setRoles] = useState<{ id: string, name: string, displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('atlas_token') : null;
    if (!token) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      cachedPermissionsData = null;
      inFlightPermissionsPromise = null;
      setPermissions([]);
      setGrouped({});
      setRoles([]);
      setLoading(false);
      return;
    }

    // 1. Memory cache check
    if (cachedPermissionsData) {
      setPermissions(cachedPermissionsData.permissions || []);
      setGrouped(cachedPermissionsData.grouped || {});
      setRoles(cachedPermissionsData.roles || []);
      setLoading(false);
      return;
    }

    // 2. localStorage check
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedPermissionsData = parsed;
          setPermissions(parsed.permissions || []);
          setGrouped(parsed.grouped || {});
          setRoles(parsed.roles || []);
          setLoading(false);

          // If on a page editing or creating something (/new), skip background recheck
          if (window.location.pathname.includes('/new')) {
            return;
          }
        }
      } catch (e) {
        console.error('[PermissionProvider] Local storage load failed:', e);
      }
    }

    // 3. Short-circuit on '/new' routes if no cache exists, to avoid blocking thread
    if (typeof window !== 'undefined' && window.location.pathname.includes('/new')) {
      setLoading(false);
      return;
    }

    // 4. Fetch from network, deduplicating active requests
    try {
      if (!inFlightPermissionsPromise) {
        inFlightPermissionsPromise = apiFetch('/api/permissions/me');
      }
      const data = await inFlightPermissionsPromise;
      cachedPermissionsData = data;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
      }

      setPermissions(data.permissions || []);
      setGrouped(data.grouped || {});
      setRoles(data.roles || []);
    } catch (error) {
      console.error('[PermissionProvider] Failed to load permissions:', error);
      inFlightPermissionsPromise = null; // Reset promise on error to allow retry
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
