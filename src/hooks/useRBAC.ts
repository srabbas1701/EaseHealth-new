import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { User } from '@supabase/supabase-js'

export type UserRole = 'patient' | 'doctor' | 'admin' | null

export const useRBAC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<string[]>([])
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Get current user
  useEffect(() => {
    const checkRole = async () => {
      try {
        // Get current user directly
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
          setUserRole(null)
          setIsLoading(false)
          return
        }

        console.log('🔍 useRBAC: Checking role for user:', currentUser.id)

        // Check if admin first (temporarily disabled until migration is applied)
        // TODO: Re-enable after applying RBAC migration
        /*
        try {
          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('role, permissions')
            .eq('user_id', user.id)
            .single()

          if (adminError && adminError.code !== 'PGRST116') {
            // PGRST116 is "not found" which is expected for non-admin users
            console.warn('⚠️ useRBAC: Error checking admin status:', adminError)
          }

          if (admin) {
            console.log('🔍 useRBAC: User is admin')
            setUserRole('admin')
            setPermissions(admin.permissions || [])
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.warn('⚠️ useRBAC: Exception checking admin status:', error)
        }
        */

        // Check if doctor
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', currentUser.id)
          .single()

        if (doctor) {
          console.log('🔍 useRBAC: User is doctor')
          setUserRole('doctor')
          setDoctorId(doctor.id)
          setIsLoading(false)
          return
        }

        // Check profile role and email verification
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email_verified')
          .eq('id', currentUser.id)
          .single()

        console.log('🔍 useRBAC: Profile data:', profile)
        const role = profile?.role || 'patient'
        const isEmailVerified = profile?.email_verified || false

        console.log('🔍 useRBAC: Setting role to:', role, 'email verified:', isEmailVerified)

        // For patients, check email verification
        if (role === 'patient' && !isEmailVerified) {
          console.log('🔍 useRBAC: Patient email not verified, redirecting to verification')
          setUserRole(null) // Block access until verified
        } else {
          setUserRole(role as 'patient' | 'doctor' | 'admin')
        }
        setIsLoading(false)

      } catch (error) {
        console.error('Error checking role:', error)
        setUserRole(null)
        setIsLoading(false)
      }
    }

    checkRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('🔍 useRBAC: Auth state changed, checking role again')
        checkRole()
      }
    })

    return () => subscription.unsubscribe()
  }, []) // Run on mount and when auth state changes

  const hasRole = (roles: string[]) => {
    return userRole ? roles.includes(userRole) : false
  }

  const hasPermission = (permission: string) => {
    return permissions.includes(permission)
  }

  const canAccess = (resource: string, action: string) => {
    const accessRules = {
      'admin': ['*'], // Admin can access everything
      'doctor': ['appointments:read', 'appointments:update', 'patients:read', 'schedules:manage', 'profile:read', 'profile:update'],
      'patient': ['appointments:read', 'appointments:create', 'profile:read', 'profile:update']
    }

    const userPermissions = accessRules[userRole as keyof typeof accessRules] || []
    return userPermissions.includes('*') || userPermissions.includes(`${resource}:${action}`)
  }

  const getDefaultDashboard = (role: UserRole) => {
    switch (role) {
      case 'admin': return '/admin-dashboard';
      case 'doctor': return '/doctor-dashboard';
      case 'patient': return '/patient-dashboard';
      default: return '/';
    }
  }

  return {
    userRole,
    isLoading,
    permissions,
    doctorId,
    hasRole,
    hasPermission,
    canAccess,
    getDefaultDashboard
  }
}