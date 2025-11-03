import React from 'react'
import { Navigate } from 'react-router-dom'
import { useRBAC } from '../hooks/useRBAC'
import { logAuditEvent } from '../utils/audit'

interface RBACRouteProps {
  children: React.ReactNode
  allowedRoles: ('patient' | 'doctor' | 'admin')[]
  resource?: string
  action?: string
  fallbackPath?: string
  showLoading?: boolean
}

export const RBACRoute: React.FC<RBACRouteProps> = ({
  children,
  allowedRoles,
  resource,
  action,
  fallbackPath = '/',
  showLoading = true
}) => {
  const { userRole, isLoading, canAccess } = useRBAC()

  console.log('🔍 RBACRoute: userRole =', userRole, 'isLoading =', isLoading, 'allowedRoles =', allowedRoles)

  if (isLoading && showLoading) {
    console.log('🔍 RBACRoute: Showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userRole) {
    console.log('🔍 RBACRoute: No user role, redirecting to login')
    const currentPath = window.location.pathname;
    const loginUrl = `/login-page?redirect=${encodeURIComponent(currentPath)}`;
    return <Navigate to={loginUrl} replace />
  }

  if (!allowedRoles.includes(userRole)) {
    // Log unauthorized access attempt
    console.warn(`🔍 RBACRoute: Unauthorized access attempt: User role ${userRole} not allowed for roles ${allowedRoles.join(', ')}`)
    logAuditEvent('unauthorized_access', 'route', undefined, {
      userRole,
      allowedRoles,
      path: window.location.pathname
    }, false)
    return <Navigate to={fallbackPath} replace />
  }

  console.log('🔍 RBACRoute: Access granted, rendering children')

  if (resource && action && !canAccess(resource, action)) {
    console.warn(`Access denied: User cannot ${action} ${resource}`)
    logAuditEvent('access_denied', resource, undefined, {
      action,
      userRole,
      path: window.location.pathname
    }, false)
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}