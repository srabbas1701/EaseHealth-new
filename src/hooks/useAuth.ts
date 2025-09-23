import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile, getProfile } from '../utils/supabase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔄 Starting initial session check...')
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError)
          throw sessionError
        }
        
        console.log('✅ Session fetched:', session ? 'User logged in' : 'No active session')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id)
          try {
            const userProfile = await getProfile(session.user.id)
            console.log('✅ Profile fetched:', userProfile ? 'Profile found' : 'No profile')
            setProfile(userProfile)
          } catch (error) {
            console.error('❌ Unexpected error fetching profile:', error)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('❌ Error during initial session check:', error)
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        console.log('✅ Initial session check complete, setting loading to false')
        setLoading(false)
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
            try {
              const userProfile = await getProfile(session.user.id)
              console.log('✅ Profile fetched after auth change:', userProfile ? 'Profile found' : 'No profile')
              setProfile(userProfile)
            } catch (error) {
              console.error('❌ Error fetching profile after auth change:', error)
              setProfile(null)
            }
          } else {
            console.log('🚪 User logged out, clearing profile')
            setProfile(null)
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error)
          setProfile(null)
        } finally {
          console.log('✅ Auth state change complete, setting loading to false')
          setLoading(false)
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
    loading,
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
        console.log('✅ User logged out successfully')
      } catch (error) {
        console.error('❌ Critical error signing out:', error)
        throw error
      }
    }
  }
}