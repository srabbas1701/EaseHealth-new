import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile, getProfile, validateSession, refreshSession } from '../utils/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingInitialAuth, setIsLoadingInitialAuth] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [sessionRecoveryAttempts, setSessionRecoveryAttempts] = useState(0)

  // Session recovery function with retry logic
  const recoverSession = useCallback(async (maxRetries = 3) => {
    console.log(`🔄 Attempting session recovery (attempt ${sessionRecoveryAttempts + 1}/${maxRetries})...`)
    
    try {
      // First try to validate current session
      const isValid = await validateSession(1)
      if (isValid) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('✅ Session recovered successfully')
          setSession(session)
          setUser(session.user)
          setSessionRecoveryAttempts(0)
          return true
        }
      }
      
      // If validation failed, try to refresh the session
      const refreshed = await refreshSession()
      if (refreshed) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('✅ Session refreshed and recovered successfully')
          setSession(session)
          setUser(session.user)
          setSessionRecoveryAttempts(0)
          return true
        }
      }
      
      console.log('❌ No valid session found during recovery')
      return false
    } catch (error) {
      console.error('❌ Session recovery failed:', error)
      if (sessionRecoveryAttempts < maxRetries - 1) {
        setSessionRecoveryAttempts(prev => prev + 1)
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (sessionRecoveryAttempts + 1)))
        return recoverSession(maxRetries)
      }
      return false
    }
  }, [sessionRecoveryAttempts])

  // Handle tab visibility changes - only for authenticated users
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible' && session && user && !isLoadingInitialAuth) {
      console.log('🔄 Tab became visible, validating session...')
      const isValid = await validateSession(1)
      if (!isValid) {
        console.log('❌ Session invalid, attempting recovery...')
        const recovered = await recoverSession()
        if (!recovered) {
          console.log('❌ Could not recover session, user may need to re-authenticate')
          setUser(null)
          setSession(null)
          setProfile(null)
        }
      }
    }
  }, [session, user, isLoadingInitialAuth, recoverSession])

  useEffect(() => {
    // Simple, direct approach
    const getInitialSession = async () => {
      console.log('🔄 Starting initial session check...')
      setIsLoadingInitialAuth(true)
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError)
          setSession(null)
          setUser(null)
          setProfile(null)
        } else {
          console.log('✅ Session fetched:', session ? 'User logged in' : 'No active session')
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('👤 Fetching profile for user:', session.user.id)
            setIsProfileLoading(true)
            try {
              const userProfile = await getProfile(session.user.id)
              console.log('✅ Profile fetched:', userProfile ? 'Profile found' : 'No profile')
              setProfile(userProfile)
            } catch (error) {
              console.error('❌ Error fetching profile:', error)
              setProfile(null)
            } finally {
              setIsProfileLoading(false)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error during initial session check:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        setIsLoadingInitialAuth(false)
        console.log('✅ Initial session check complete')
      }
    }

    getInitialSession()

    // Simple auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'User session active' : 'No session')
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Fetching profile for user after auth change:', session.user.id)
          setIsProfileLoading(true)
          try {
            const userProfile = await getProfile(session.user.id)
            console.log('✅ Profile fetched after auth change:', userProfile ? 'Profile found' : 'No profile')
            setProfile(userProfile)
          } catch (error) {
            console.error('❌ Error fetching profile after auth change:', error)
            setProfile(null)
          } finally {
            setIsProfileLoading(false)
          }
        } else {
          console.log('🚪 User logged out, clearing profile')
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getUserState = (): 'new' | 'returning' | 'authenticated' => {
    if (user && session) {
      return 'authenticated'
    }
    return 'new'
  }

  return {
    user,
    session,
    profile,
    isLoadingInitialAuth,
    isProfileLoading,
    userState: getUserState(),
    isAuthenticated: !!user && !!session,
    handleLogout: async () => {
      console.log('🚪 Logging out user...')
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('❌ Error during logout:', error)
          throw error
        }
        
        // Clear local state immediately
        setUser(null)
        setSession(null)
        setProfile(null)
        
        // Clear localStorage items
        localStorage.removeItem('isDoctor')
        localStorage.removeItem('userRole')
        
        console.log('✅ User logged out successfully')
      } catch (error) {
        console.error('❌ Critical error signing out:', error)
        // Even if logout fails, clear local state
        setUser(null)
        setSession(null)
        setProfile(null)
        localStorage.removeItem('isDoctor')
        localStorage.removeItem('userRole')
        throw error
      }
    }
  }
}