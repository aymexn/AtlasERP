'use client';

import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  module: string;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showLoading?: boolean;
}

export function PermissionGuard({
  module,
  resource,
  action,
  fallback = null,
  children,
  showLoading = false
}: PermissionGuardProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }
    return null;
  }

  if (!hasPermission(module, resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  role: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showLoading?: boolean;
}

export function RoleGuard({
  role,
  fallback = null,
  children,
  showLoading = false
}: RoleGuardProps) {
  const { hasRole, loading } = usePermissions();

  if (loading) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      );
    }
    return null;
  }

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Can component for quick conditional rendering
 */
export function Can({ module, resource, action, children }: { 
  module: string, 
  resource: string, 
  action: string, 
  children: React.ReactNode 
}) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, resource, action)) return null;
  return <>{children}</>;
}
