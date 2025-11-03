export type UserRole = 'patient' | 'doctor' | 'admin'

export interface AdminUser {
  id: string
  user_id: string
  full_name: string
  email: string
  phone_number: string
  role: 'admin' | 'super_admin'
  permissions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  allowed: boolean
  created_at: string
}

export interface RBACContext {
  userRole: UserRole | null
  isLoading: boolean
  permissions: string[]
  doctorId: string | null
  hasRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
  canAccess: (resource: string, action: string) => boolean
}