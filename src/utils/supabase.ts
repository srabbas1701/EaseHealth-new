import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

// Create a mock Supabase client for development when env vars are missing
export const isMockSupabase = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
let supabase: any
if (isMockSupabase) {
  console.warn('⚠️ Supabase environment variables not found. Using mock client for development.')
  
  // Create a mock Supabase client that doesn't make real API calls
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        }),
        upsert: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          })
        })
      })
    })
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Types for our database
export interface Profile {
  id: string
  full_name: string
  phone_number: string
  age?: number
  gender?: string
  city?: string
  state?: string
  created_at?: string
  updated_at?: string
}

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Profile helper functions
export const createProfile = async (userId: string, profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        ...profileData
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getProfile = async (userId: string) => {
  try {
    console.log('🔍 Attempting to fetch profile for user:', userId)
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Profile fetch timeout'))
      }, 60000) // 60 second timeout
    })

    // Create the profile fetch promise
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // Race between the profile fetch and timeout
    const { data, error } = await Promise.race([profilePromise, timeoutPromise])

    if (error) {
      console.log('⚠️ Profile fetch error:', error.code, error.message)
      // Always return null for any error - don't throw
      return null
    }
    
    console.log('✅ Profile fetched successfully:', data ? 'Profile found' : 'No data returned')
    return data
  } catch (error) {
    if (error instanceof Error && error.message === 'Profile fetch timeout') {
      console.error('⏰ Profile fetch timed out after 60 seconds')
    } else {
      console.error('❌ Unexpected error in getProfile:', error)
    }
    // Always return null, never throw
    return null
  }
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Pre-registration types and functions
export interface PreRegistration {
  id?: string
  user_id?: string
  full_name: string
  age: number
  gender: string
  phone_number: string
  city: string
  state: string
  symptoms: string
  lab_reports_url?: string
  aadhaar_url?: string
  consent_agreed: boolean
  status?: string
  queue_token?: string
  registration_time?: string
  created_at?: string
  updated_at?: string
}

export const createPreRegistration = async (userId: string, data: Omit<PreRegistration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: result, error } = await supabase
    .from('pre_registrations')
    .insert([
      {
        user_id: userId,
        ...data
      }
    ])
    .select()
    .single()

  if (error) throw error
  return result
}

export const getPreRegistration = async (userId: string) => {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// Specialty types and functions
export interface Specialty {
  id: string
  name: string
  description?: string
  icon?: string
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

// Doctor types and functions
export interface Doctor {
  id: string
  user_id?: string
  full_name: string
  email: string
  phone_number: string
  specialty: string
  specialty_id?: string
  license_number: string
  experience_years: number
  qualification: string
  hospital_affiliation?: string
  consultation_fee?: number
  profile_image_url?: string
  bio?: string
  is_verified: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface DoctorSchedule {
  id?: string
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  break_start_time?: string
  break_end_time?: string
  is_available: boolean
  created_at?: string
  updated_at?: string
}

export interface TimeSlot {
  id?: string
  doctor_id: string
  schedule_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'available' | 'booked' | 'blocked' | 'break'
  appointment_id?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

// Add caching at the top of the file
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function for caching
const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() })
}

// Cache for specialties to avoid repeated API calls
let specialtiesCache: Specialty[] | null = null
let specialtiesCacheTime: number = 0

// Get all active specialties - optimized for speed with caching
export const getSpecialties = async (forceRefresh = false): Promise<Specialty[]> => {
  const now = Date.now()
  
  // Return cached data if it's still fresh and not forcing refresh
  if (!forceRefresh && specialtiesCache && (now - specialtiesCacheTime) < CACHE_DURATION) {
    console.log('📦 Returning cached specialties')
    return specialtiesCache
  }

  try {
    console.log('🔄 Fetching specialties from database...')
    const { data, error } = await supabase
      .from('specialties')
      .select('id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order, name')
      .limit(20) // Limit to prevent large data transfers

    if (error) {
      console.error('Supabase error:', error)
      // Return fallback specialties if database fails
      const fallbackSpecialties = [
        { id: 'fallback-1', name: 'General Medicine', description: 'General health and primary care', is_active: true, sort_order: 1 },
        { id: 'fallback-2', name: 'Cardiology', description: 'Heart specialist', is_active: true, sort_order: 2 },
        { id: 'fallback-3', name: 'Neurology', description: 'Brain specialist', is_active: true, sort_order: 3 },
        { id: 'fallback-4', name: 'Dermatology', description: 'Skin specialist', is_active: true, sort_order: 4 },
        { id: 'fallback-5', name: 'Pediatrics', description: 'Children specialist', is_active: true, sort_order: 5 },
        { id: 'fallback-6', name: 'Gynecology', description: 'Women health specialist', is_active: true, sort_order: 6 }
      ]
      
      // Cache fallback data
      specialtiesCache = fallbackSpecialties
      specialtiesCacheTime = now
      return fallbackSpecialties
    }

    const specialties = data || []
    
    // Cache the successful result
    specialtiesCache = specialties
    specialtiesCacheTime = now
    console.log('✅ Specialties cached successfully')
    
    return specialties
  } catch (error) {
    console.error('Network error:', error)
    return []
  }
}

// Simplified getDoctors function - no complex relationships
export const getDoctors = async () => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id, 
        full_name, 
        specialty,
        is_active, 
        is_verified,
        consultation_fee
      `)
      .eq('is_active', true)
      .limit(20)
      .order('full_name')

    if (error) {
      console.error('Supabase error:', error)
      // Return mock data with simple specialty names
      return [
        {
          id: 'mock-1',
          full_name: 'Dr. Anjali Sharma',
          specialty: 'Cardiology',
          is_active: true,
          is_verified: true,
          consultation_fee: 500
        },
        {
          id: 'mock-2',
          full_name: 'Dr. Rajesh Kumar',
          specialty: 'Neurology',
          is_active: true,
          is_verified: true,
          consultation_fee: 600
        },
        {
          id: 'mock-3',
          full_name: 'Dr. Priya Singh',
          specialty: 'Dermatology',
          is_active: true,
          is_verified: true,
          consultation_fee: 400
        },
        {
          id: 'mock-4',
          full_name: 'Dr. Amit Patel',
          specialty: 'Cardiology',
          is_active: true,
          is_verified: true,
          consultation_fee: 550
        },
        {
          id: 'mock-5',
          full_name: 'Dr. Sunita Reddy',
          specialty: 'Pediatrics',
          is_active: true,
          is_verified: true,
          consultation_fee: 450
        },
        {
          id: 'mock-6',
          full_name: 'Dr. Vikram Malhotra',
          specialty: 'Orthopedic Surgery',
          is_active: true,
          is_verified: true,
          consultation_fee: 700
        }
      ]
    }

    return data || []
  } catch (error) {
    console.error('Network error:', error)
    return []
  }
}

export const getDoctorByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}


// Optimized getDoctorSchedules function
export const getDoctorSchedules = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_available', true)
      .order('day_of_week')
      .limit(7) // Limit to one week

    if (error) {
      console.error('Schedule fetch error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Network error:', error)
    return []
  }
}

export const upsertDoctorSchedule = async (schedule: Omit<DoctorSchedule, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('doctor_schedules')
    .upsert(schedule, { 
      onConflict: 'doctor_id,day_of_week',
      ignoreDuplicates: false 
    })
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// Optimized getAvailableTimeSlots function
export const getAvailableTimeSlots = async (doctorId: string, date: string) => {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('schedule_date', date)
      .eq('status', 'available')
      .order('start_time')
      .limit(50) // Limit to prevent large data transfers

    if (error) {
      console.error('Time slots fetch error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Network error:', error)
    return []
  }
}

// Fetch time slots for a day regardless of status (available/booked/blocked/break)
export const getTimeSlotsByDate = async (doctorId: string, date: string) => {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('schedule_date', date)
    .order('start_time')

  if (error) throw error
  return data
}

export const bookTimeSlot = async (
  doctorId: string,
  date: string,
  startTime: string,
  durationMinutes: number
) => {
  const payload = {
    doctor_id: doctorId,
    schedule_date: date,
    start_time: startTime,
    end_time: (() => {
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(start.getTime() + durationMinutes * 60000)
      return end.toTimeString().slice(0, 8)
    })(),
    duration_minutes: durationMinutes,
    status: 'booked' as const
  }

  const { data, error } = await supabase
    .from('time_slots')
    .upsert(payload, { onConflict: 'doctor_id,schedule_date,start_time', ignoreDuplicates: false })
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// Appointments API (preferred for confirmed bookings)
export const getAppointmentsByDate = async (doctorId: string, date: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('schedule_date', date)
    .order('start_time')

  if (error) throw error
  return data
}

export const createAppointment = async (
  doctorId: string,
  patientId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  notes?: string
) => {
  const endTime = (() => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(start.getTime() + durationMinutes * 60000)
    return end.toTimeString().slice(0, 8)
  })()

  const payload = {
    doctor_id: doctorId,
    patient_id: patientId,
    schedule_date: date,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: durationMinutes,
    status: 'booked' as const,
    notes
  }

  const { data, error } = await supabase
    .from('appointments')
    .upsert(payload, { onConflict: 'doctor_id,schedule_date,start_time', ignoreDuplicates: false })
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export const generateTimeSlots = async (doctorId: string, date: string) => {
  // This function would generate time slots based on doctor's schedule
  // Implementation would involve checking doctor_schedules and creating time_slots
  const dayOfWeek = new Date(date).getDay()
  
  const { data: schedule, error: scheduleError } = await supabase
    .from('doctor_schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .maybeSingle()

  if (scheduleError) throw scheduleError
  if (!schedule) return []

  // Generate time slots based on schedule
  const slots = []
  const startTime = new Date(`2000-01-01T${schedule.start_time}`)
  const endTime = new Date(`2000-01-01T${schedule.end_time}`)
  const breakStart = schedule.break_start_time ? new Date(`2000-01-01T${schedule.break_start_time}`) : null
  const breakEnd = schedule.break_end_time ? new Date(`2000-01-01T${schedule.break_end_time}`) : null
  
  let currentTime = new Date(startTime)
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + schedule.slot_duration_minutes * 60000)
    
    // Skip break time
    if (breakStart && breakEnd && 
        ((currentTime >= breakStart && currentTime < breakEnd) ||
         (slotEnd > breakStart && slotEnd <= breakEnd))) {
      currentTime = new Date(breakEnd)
      continue
    }
    
    if (slotEnd <= endTime) {
      slots.push({
        doctor_id: doctorId,
        schedule_date: date,
        start_time: currentTime.toTimeString().slice(0, 8),
        end_time: slotEnd.toTimeString().slice(0, 8),
        duration_minutes: schedule.slot_duration_minutes,
        status: 'available' as const
      })
    }
    
    currentTime = slotEnd
  }

  // Insert generated slots
  if (slots.length > 0) {
    const { data, error } = await supabase
      .from('time_slots')
      .upsert(slots, { 
        onConflict: 'doctor_id,schedule_date,start_time',
        ignoreDuplicates: true 
      })
      .select()

    if (error) throw error
    return data
  }

  return []
}