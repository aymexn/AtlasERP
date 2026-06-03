'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
let cachedUserId: string | null = null;
let inFlightPermissionsPromise: Promise<any> | null = null;
const LOCAL_STORAGE_KEY = 'atlas_permissions';

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [grouped, setGrouped] = useState<GroupedPermissions>({});
  const [roles, setRoles] = useState<{ id: string, name: string, displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id;

  const loadPermissions = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

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
      cachedUserId = null;
      inFlightPermissionsPromise = null;
      setPermissions([]);
      setGrouped({});
      setRoles([]);
      setLoading(false);
      return;
    }

    // 1. Memory cache check (staleTime: Infinity concept)
    if (cachedPermissionsData && cachedUserId === userId) {
      setPermissions(cachedPermissionsData.permissions || []);
      setGrouped(cachedPermissionsData.grouped || {});
      setRoles(cachedPermissionsData.roles || []);
      setLoading(false);
      return;
    }

    // 2. localStorage check (2 hours cache threshold)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const twoHours = 1000 * 60 * 60 * 2;
          if (parsed.userId === userId && (Date.now() - parsed.ts) < twoHours) {
            cachedPermissionsData = parsed.data;
            cachedUserId = userId;
            setPermissions(parsed.data.permissions || []);
            setGrouped(parsed.data.grouped || {});
            setRoles(parsed.data.roles || []);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('[PermissionProvider] Local storage load failed:', e);
      }
    }

    // 3. Short-circuit on '/new' and '/edit' routes if no cache exists, to avoid blocking thread
    if (typeof window !== 'undefined' && 
        (window.location.pathname.includes('/new') || window.location.pathname.includes('/edit'))) {
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
      cachedUserId = userId;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            data,
            userId,
            ts: Date.now()
          }));
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
  }, [userId]);

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
