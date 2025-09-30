import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile, getProfile } from '../utils/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingInitialAuth, setIsLoadingInitialAuth] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔄 Starting initial session check...')
      setIsLoadingInitialAuth(true)
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError)
          throw sessionError
        }
        
        console.log('✅ Session fetched:', session ? 'User logged in' : 'No active session')
        setSession(session)
        setUser(session?.user ?? null)
        
        // Set initial auth loading to false as soon as we know the session status
        setIsLoadingInitialAuth(false)
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id)
          setIsProfileLoading(true)
          try {
            const userProfile = await getProfile(session.user.id)
            console.log('✅ Profile fetched:', userProfile ? 'Profile found' : 'No profile')
            setProfile(userProfile)
          } catch (error) {
            console.error('❌ Unexpected error fetching profile:', error)
            setProfile(null)
          } finally {
            setIsProfileLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ Error during initial session check:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
        setIsLoadingInitialAuth(false)
      } finally {
        console.log('✅ Initial session check complete')
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'User session active' : 'No session')
        
        try {
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
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error)
          setProfile(null)
        } finally {
          console.log('✅ Auth state change complete')
        }
      }
    )

    return () => subscription.unsubscribe()
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