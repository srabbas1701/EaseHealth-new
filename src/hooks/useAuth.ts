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
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const userProfile = await getProfile(session.user.id)
          setProfile(userProfile)
        } catch (error) {
          console.error('Error fetching profile:', error)
          setProfile(null)
        }
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const userProfile = await getProfile(session.user.id)
            setProfile(userProfile)
          } catch (error) {
            console.error('Error fetching profile:', error)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        
        setLoading(false)
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
    isAuthenticated: !!user && !!session
  }
}