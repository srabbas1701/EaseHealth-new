import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

// Debug logging for environment variables
console.log('🔧 Environment Variables Check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
console.log('All env vars:', import.meta.env);

// Create a mock Supabase client for development when env vars are missing
export const isMockSupabase = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
console.log('🔧 Using Mock Supabase:', isMockSupabase);
let supabase: any
if (isMockSupabase) {
  console.warn('⚠️ Supabase environment variables not found. Using mock client for development.')
  
  // Create a mock Supabase client that doesn't make real API calls
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: ({ email, password }: { email: string; password: string }) => {
        console.log('🔐 Mock login attempt:', email);
        // Simulate successful login for demo purposes
        const mockUser = {
          id: 'demo-user-id',
          email: email,
          user_metadata: { full_name: 'Demo Doctor' }
        };
        const mockSession = {
          user: mockUser,
          access_token: 'mock-token',
          expires_at: Date.now() + 3600000 // 1 hour from now
        };
        return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
      },
      signUp: ({ email, password }: { email: string; password: string }) => {
        console.log('🔐 Mock signup attempt:', email);
        // Simulate successful signup for demo purposes
        const mockUser = {
          id: 'demo-user-id',
          email: email,
          user_metadata: { full_name: 'Demo Doctor' }
        };
        const mockSession = {
          user: mockUser,
          access_token: 'mock-token',
          expires_at: Date.now() + 3600000 // 1 hour from now
        };
        return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        console.log('🔐 Mock auth state change listener registered');
        // Simulate auth state change after a short delay
        setTimeout(() => {
          const mockUser = {
            id: 'demo-user-id',
            email: 'demo@example.com',
            user_metadata: { full_name: 'Demo Doctor' }
          };
          const mockSession = {
            user: mockUser,
            access_token: 'mock-token',
            expires_at: Date.now() + 3600000
          };
          callback('SIGNED_IN', mockSession);
        }, 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
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
    }),
    storage: {
      from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
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

// Session validation utility
export const validateSession = async (maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Validating session (attempt ${attempt}/${maxRetries})`)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error(`❌ Session validation error (attempt ${attempt}):`, error)
        if (attempt === maxRetries) return false
        continue
      }
      
      if (!session || !session.user) {
        console.log(`❌ No valid session found (attempt ${attempt})`)
        if (attempt === maxRetries) return false
        continue
      }
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log(`❌ Session expired (attempt ${attempt})`)
        if (attempt === maxRetries) return false
        continue
      }
      
      console.log(`✅ Session is valid (attempt ${attempt})`)
      return true
    } catch (error) {
      console.error(`❌ Session validation failed (attempt ${attempt}):`, error)
      if (attempt === maxRetries) return false
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return false
}

// Force refresh session
export const refreshSession = async (): Promise<boolean> => {
  try {
    console.log('🔄 Force refreshing session...')
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('❌ Session refresh failed:', error)
      return false
    }
    
    if (!session || !session.user) {
      console.log('❌ No session after refresh')
      return false
    }
    
    console.log('✅ Session refreshed successfully')
    return true
  } catch (error) {
    console.error('❌ Session refresh error:', error)
    return false
  }
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
    
    // First try to get from specialties table
    const { data: specialtiesData, error: specialtiesError } = await supabase
      .from('specialties')
      .select('id, name, description, sort_order')
      .eq('is_active', true)
      .order('sort_order, name')
      .limit(50)

    if (!specialtiesError && specialtiesData && specialtiesData.length > 0) {
      console.log('✅ Found specialties in specialties table:', specialtiesData.length)
      specialtiesCache = specialtiesData
      specialtiesCacheTime = now
      return specialtiesData
    }

    console.log('🔄 Specialties table empty or error, trying to get from doctors...')
    
    // If specialties table is empty, get unique specialties from doctors table
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('doctors')
      .select('specialty')
      .eq('is_active', true)
      .not('specialty', 'is', null)

    if (!doctorsError && doctorsData && doctorsData.length > 0) {
      // Get unique specialties from doctors
      const uniqueSpecialties = [...new Set(doctorsData.map(d => d.specialty))]
        .filter(specialty => specialty && specialty.trim())
        .map((specialty, index) => ({
          id: `doctor-specialty-${index}`,
          name: specialty,
          description: `${specialty} specialist`,
          sort_order: index + 1
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      console.log('✅ Found specialties from doctors:', uniqueSpecialties.length)
      specialtiesCache = uniqueSpecialties
      specialtiesCacheTime = now
      return uniqueSpecialties
    }

    console.log('🔄 No specialties found in database, using fallback...')
    
    // Return fallback specialties if both fail
    const fallbackSpecialties = [
      { id: 'fallback-1', name: 'Cardiology', description: 'Heart and cardiovascular system specialist', sort_order: 1 },
      { id: 'fallback-2', name: 'Neurology', description: 'Brain and nervous system specialist', sort_order: 2 },
      { id: 'fallback-3', name: 'Dermatology', description: 'Skin, hair, and nail specialist', sort_order: 3 },
      { id: 'fallback-4', name: 'Orthopedic Surgery', description: 'Bones, joints, and musculoskeletal specialist', sort_order: 4 },
      { id: 'fallback-5', name: 'Pediatrics', description: 'Children health specialist', sort_order: 5 },
      { id: 'fallback-6', name: 'Gynecology', description: 'Women health and reproductive system specialist', sort_order: 6 },
      { id: 'fallback-7', name: 'Internal Medicine', description: 'Adult general medicine specialist', sort_order: 7 },
      { id: 'fallback-8', name: 'Psychiatry', description: 'Mental health and psychiatric specialist', sort_order: 8 },
      { id: 'fallback-9', name: 'Ophthalmology', description: 'Eye and vision specialist', sort_order: 9 },
      { id: 'fallback-10', name: 'ENT Specialist', description: 'Ear, nose, and throat specialist', sort_order: 10 },
      { id: 'fallback-11', name: 'Urology', description: 'Urinary system and male reproductive health specialist', sort_order: 11 },
      { id: 'fallback-12', name: 'Gastroenterology', description: 'Digestive system specialist', sort_order: 12 },
      { id: 'fallback-13', name: 'Pulmonology', description: 'Lung and respiratory system specialist', sort_order: 13 },
      { id: 'fallback-14', name: 'Endocrinology', description: 'Hormones and endocrine system specialist', sort_order: 14 },
      { id: 'fallback-15', name: 'Oncology', description: 'Cancer treatment specialist', sort_order: 15 },
      { id: 'fallback-16', name: 'Radiology', description: 'Medical imaging and diagnostic specialist', sort_order: 16 },
      { id: 'fallback-17', name: 'Anesthesiology', description: 'Pain management and anesthesia specialist', sort_order: 17 },
      { id: 'fallback-18', name: 'Emergency Medicine', description: 'Emergency and urgent care specialist', sort_order: 18 },
      { id: 'fallback-19', name: 'Family Medicine', description: 'Comprehensive family healthcare specialist', sort_order: 19 },
      { id: 'fallback-20', name: 'General Surgery', description: 'General surgical procedures specialist', sort_order: 20 }
    ]
    
    // Cache fallback data
    specialtiesCache = fallbackSpecialties
    specialtiesCacheTime = now
    console.log('✅ Using fallback specialties:', fallbackSpecialties.length)
    return fallbackSpecialties
    
  } catch (error) {
    console.error('❌ Network error:', error)
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
  console.log(`🔄 Upserting schedule for doctor ${schedule.doctor_id}, day ${schedule.day_of_week}`);
  
  const { data, error } = await supabase
    .from('doctor_schedules')
    .upsert(schedule, { 
      onConflict: 'doctor_id,day_of_week',
      ignoreDuplicates: false 
    })
    .select()
    .maybeSingle()

  if (error) throw error
  
  // Only generate time slots if this is a new schedule or if the schedule was updated
  if (data && schedule.is_available) {
    console.log(`🔄 Schedule saved for doctor ${schedule.doctor_id}, generating time slots for next 4 weeks...`);
    try {
      await generateTimeSlotsForNext4Weeks(schedule.doctor_id);
      console.log(`✅ Time slots generated successfully for doctor ${schedule.doctor_id}`);
    } catch (slotError) {
      console.warn(`⚠️ Failed to generate time slots for doctor ${schedule.doctor_id}:`, slotError);
      // Don't throw error here - schedule is saved, time slots are optional
    }
  } else if (data && !schedule.is_available) {
    console.log(`ℹ️ Schedule marked as unavailable for doctor ${schedule.doctor_id}, day ${schedule.day_of_week}`);
  }
  
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
  console.log(`🔄 Creating appointment for doctor ${doctorId}, patient ${patientId}, date ${date}, time ${startTime}`);
  console.log('🔧 Using Mock Supabase:', isMockSupabase);
  
  // First, check if the time slot is available (with race condition protection)
  const availabilityCheck = await checkSlotAvailability(doctorId, date, startTime);
  console.log('🔍 Availability check result:', availabilityCheck);
  
  if (!availabilityCheck.available) {
    throw new Error(availabilityCheck.error || 'Time slot is not available');
  }

  // Get the full slot details
  const { data: existingSlot, error: slotError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('id', availabilityCheck.slotId)
    .single()

  if (slotError || !existingSlot) {
    console.error('❌ Error getting slot details:', slotError);
    throw new Error('Time slot not found');
  }

  // Double-check the slot is still available (race condition protection)
  if (existingSlot.status !== 'available') {
    throw new Error(`Time slot is no longer available (status: ${existingSlot.status})`);
  }

  // Generate a unique appointment ID
  const appointmentId = crypto.randomUUID();

  // Update the time slot to mark it as booked (atomic operation)
  const { data, error } = await supabase
    .from('time_slots')
    .update({
      status: 'booked',
      appointment_id: appointmentId,
      notes: notes || `Appointment booked by patient ${patientId}`
    })
    .eq('id', existingSlot.id)
    .eq('status', 'available') // Additional race condition protection
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating time slot:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to book appointment - slot may have been taken by another user');
  }

  console.log('✅ Appointment created successfully:', data);
  return {
    id: appointmentId,
    doctor_id: doctorId,
    patient_id: patientId,
    schedule_date: date,
    start_time: startTime,
    end_time: existingSlot.end_time,
    duration_minutes: durationMinutes,
    status: 'booked',
    notes: notes || `Appointment booked by patient ${patientId}`,
    time_slot_id: existingSlot.id
  };
}

// Cancel an appointment (mark time slot as available again)
export const cancelAppointment = async (appointmentId: string) => {
  console.log(`🔄 Cancelling appointment: ${appointmentId}`);
  
  // Find the time slot with this appointment ID
  const { data: timeSlot, error: findError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single()

  if (findError) {
    console.error('❌ Error finding time slot for appointment:', findError);
    throw new Error('Appointment not found');
  }

  if (!timeSlot) {
    throw new Error('Appointment not found');
  }

  // Update the time slot to mark it as available again
  const { data, error } = await supabase
    .from('time_slots')
    .update({
      status: 'available',
      appointment_id: null,
      notes: 'Appointment cancelled - slot available'
    })
    .eq('id', timeSlot.id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error cancelling appointment:', error);
    throw error;
  }

  console.log('✅ Appointment cancelled successfully:', data);
  return data;
}

// Get all appointments for a doctor
export const getDoctorAppointments = async (doctorId: string, date?: string) => {
  let query = supabase
    .from('time_slots')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('status', 'booked')
    .order('schedule_date')
    .order('start_time')

  if (date) {
    query = query.eq('schedule_date', date)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Get all appointments for a patient
export const getPatientAppointments = async (patientId: string) => {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('status', 'booked')
    .contains('notes', `patient ${patientId}`)
    .order('schedule_date')
    .order('start_time')

  if (error) throw error
  return data || []
}

// Check if a time slot is available for booking (with race condition protection)
export const checkSlotAvailability = async (doctorId: string, date: string, startTime: string) => {
  const { data, error } = await supabase
    .from('time_slots')
    .select('id, status, appointment_id')
    .eq('doctor_id', doctorId)
    .eq('schedule_date', date)
    .eq('start_time', startTime)
    .maybeSingle()

  if (error) {
    console.error('❌ Error checking slot availability:', error);
    return { available: false, error: 'Error checking slot availability' };
  }

  if (!data) {
    return { available: false, error: 'Slot not found' };
  }

  if (data.status !== 'available') {
    return { 
      available: false, 
      error: `Slot is ${data.status}`,
      currentStatus: data.status 
    };
  }

  return { available: true, slotId: data.id };
}

export const generateTimeSlots = async (doctorId: string, date: string) => {
  console.log(`🔄 Generating time slots for doctor ${doctorId} on ${date}`);
  
  // First check if slots already exist for this date
  const { data: existingSlots, error: checkError } = await supabase
    .from('time_slots')
    .select('id, start_time, status')
    .eq('doctor_id', doctorId)
    .eq('schedule_date', date)
    .limit(1)

  if (checkError) {
    console.warn('⚠️ Error checking existing slots:', checkError);
  }

  // If slots already exist, return them instead of regenerating
  if (existingSlots && existingSlots.length > 0) {
    console.log(`✅ Time slots already exist for ${date}, skipping generation`);
    return existingSlots;
  }

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
  if (!schedule) {
    console.log(`ℹ️ No schedule found for doctor ${doctorId} on day ${dayOfWeek}`);
    return []
  }

  console.log(`📅 Generating slots based on schedule: ${schedule.start_time} - ${schedule.end_time}`);

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

  // Insert generated slots only if we have slots to insert
  if (slots.length > 0) {
    console.log(`💾 Inserting ${slots.length} time slots for ${date}`);
    const { data, error } = await supabase
      .from('time_slots')
      .upsert(slots, { 
        onConflict: 'doctor_id,schedule_date,start_time',
        ignoreDuplicates: true 
      })
      .select()

    if (error) throw error
    console.log(`✅ Successfully inserted ${data?.length || 0} time slots for ${date}`);
    return data
  }

  console.log(`ℹ️ No slots generated for ${date}`);
  return []
}

// Generate time slots for a range of dates (e.g., next 30 days)
export const generateTimeSlotsForRange = async (doctorId: string, startDate: string, endDate: string) => {
  console.log(`🔄 Generating time slots for doctor ${doctorId} from ${startDate} to ${endDate}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allSlots = [];
  
  // Generate slots for each date in the range
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    console.log(`📅 Generating slots for ${dateStr}`);
    
    try {
      const slots = await generateTimeSlots(doctorId, dateStr);
      allSlots.push(...(slots || []));
    } catch (error) {
      console.warn(`⚠️ Failed to generate slots for ${dateStr}:`, error);
    }
  }
  
  console.log(`✅ Generated ${allSlots.length} total time slots`);
  return allSlots;
}

// Generate time slots for the next 4 weeks when doctor saves schedule
export const generateTimeSlotsForNext4Weeks = async (doctorId: string) => {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 28); // 4 weeks = 28 days
  
  const startDateStr = today.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`🚀 Generating time slots for next 4 weeks: ${startDateStr} to ${endDateStr}`);
  return await generateTimeSlotsForRange(doctorId, startDateStr, endDateStr);
}

// Keep the old function for backward compatibility but limit to 4 weeks
export const generateTimeSlotsForNext30Days = async (doctorId: string) => {
  console.log(`⚠️ Using deprecated generateTimeSlotsForNext30Days, redirecting to 4 weeks`);
  return await generateTimeSlotsForNext4Weeks(doctorId);
}

// Check if time slots need regeneration for a doctor (useful for daily operations)
export const checkTimeSlotsStatus = async (doctorId: string, daysAhead: number = 7) => {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + daysAhead);
  
  const startDateStr = today.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`🔍 Checking time slots status for doctor ${doctorId} from ${startDateStr} to ${endDateStr}`);
  
  // Get count of existing slots
  const { count: existingSlots, error: countError } = await supabase
    .from('time_slots')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .gte('schedule_date', startDateStr)
    .lte('schedule_date', endDateStr)
  
  if (countError) {
    console.warn('⚠️ Error checking existing slots count:', countError);
    return { needsGeneration: true, existingCount: 0 };
  }
  
  // Get count of available days in the period
  const { data: schedules, error: scheduleError } = await supabase
    .from('doctor_schedules')
    .select('day_of_week')
    .eq('doctor_id', doctorId)
    .eq('is_available', true)
  
  if (scheduleError) {
    console.warn('⚠️ Error checking doctor schedules:', scheduleError);
    return { needsGeneration: true, existingCount: 0 };
  }
  
  if (!schedules || schedules.length === 0) {
    console.log('ℹ️ No available schedules found for doctor');
    return { needsGeneration: false, existingCount: 0 };
  }
  
  // Calculate expected slots count (rough estimate)
  const availableDays = schedules.length;
  const totalDays = daysAhead;
  const expectedSlotsPerDay = 8; // Rough estimate
  const expectedTotalSlots = availableDays * Math.ceil(totalDays / 7) * expectedSlotsPerDay;
  
  const needsGeneration = (existingSlots || 0) < expectedTotalSlots * 0.5; // If less than 50% of expected slots exist
  
  console.log(`📊 Time slots status: ${existingSlots || 0} existing, ~${expectedTotalSlots} expected, needs generation: ${needsGeneration}`);
  
  return { 
    needsGeneration, 
    existingCount: existingSlots || 0,
    expectedCount: expectedTotalSlots,
    availableDays: availableDays
  };
}

// ===== WEEKLY SCHEDULE SYSTEM =====

// Get weekly schedules for a specific week
export const getWeeklySchedules = async (doctorId: string, startDate: string, endDate: string) => {
  console.log(`📅 Getting weekly schedules for doctor ${doctorId} from ${startDate} to ${endDate}`);
  
  const { data, error } = await supabase
    .from('doctor_weekly_schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .gte('schedule_date', startDate)
    .lte('schedule_date', endDate)
    .order('schedule_date', { ascending: true })
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('❌ Error fetching weekly schedules:', error);
    throw error;
  }

  console.log(`✅ Found ${data?.length || 0} weekly schedules`);
  return data || [];
};

// Get template schedules for a doctor
export const getTemplateSchedules = async (doctorId: string) => {
  console.log(`📋 Getting template schedules for doctor ${doctorId}`);
  
  const { data, error } = await supabase
    .from('doctor_weekly_schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('is_template', true)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('❌ Error fetching template schedules:', error);
    throw error;
  }

  console.log(`✅ Found ${data?.length || 0} template schedules`);
  return data || [];
};

// Create or update weekly schedule
export const upsertWeeklySchedule = async (schedule: {
  doctor_id: string;
  schedule_date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time?: string;
  break_end_time?: string;
  is_available: boolean;
  is_template?: boolean;
}) => {
  console.log(`🔄 Upserting weekly schedule for doctor ${schedule.doctor_id} on ${schedule.schedule_date}`);
  
  const { data, error } = await supabase
    .from('doctor_weekly_schedules')
    .upsert(schedule, {
      onConflict: 'doctor_id,schedule_date,day_of_week',
      ignoreDuplicates: false
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Error upserting weekly schedule:', error);
    throw error;
  }

  console.log(`✅ Weekly schedule upserted successfully`);
  return data;
};

// Generate weekly time slots for a specific date range
export const generateWeeklyTimeSlots = async (doctorId: string, startDate: string, endDate: string) => {
  console.log(`🔄 Generating weekly time slots for doctor ${doctorId} from ${startDate} to ${endDate}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allSlots = [];
  
  // Generate slots for each date in the range
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    console.log(`📅 Generating slots for ${dateStr} (day ${dayOfWeek})`);
    
    try {
      // First check if specific schedule exists for this date
      const { data: specificSchedule } = await supabase
        .from('doctor_weekly_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('schedule_date', dateStr)
        .eq('is_template', false)
        .maybeSingle();
      
      let schedule = specificSchedule;
      
      // If no specific schedule, use template
      if (!schedule) {
        const { data: templateSchedule } = await supabase
          .from('doctor_weekly_schedules')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_template', true)
          .eq('is_available', true)
          .maybeSingle();
        
        schedule = templateSchedule;
      }
      
      if (!schedule || !schedule.is_available) {
        console.log(`ℹ️ No available schedule for ${dateStr}`);
        continue;
      }
      
      // Check if slots already exist for this date
      const { data: existingSlots } = await supabase
        .from('doctor_weekly_time_slots')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('schedule_date', dateStr)
        .limit(1);
      
      if (existingSlots && existingSlots.length > 0) {
        console.log(`✅ Slots already exist for ${dateStr}, skipping`);
        continue;
      }
      
      // Generate time slots based on schedule
      const slots = [];
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      const breakStart = schedule.break_start_time ? new Date(`2000-01-01T${schedule.break_start_time}`) : null;
      const breakEnd = schedule.break_end_time ? new Date(`2000-01-01T${schedule.break_end_time}`) : null;
      
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + schedule.slot_duration_minutes * 60000);
        
        // Skip break time
        if (breakStart && breakEnd && 
            ((currentTime >= breakStart && currentTime < breakEnd) ||
             (slotEnd > breakStart && slotEnd <= breakEnd))) {
          currentTime = new Date(breakEnd);
          continue;
        }
        
        if (slotEnd <= endTime) {
          slots.push({
            doctor_id: doctorId,
            schedule_date: dateStr,
            start_time: currentTime.toTimeString().slice(0, 8),
            end_time: slotEnd.toTimeString().slice(0, 8),
            duration_minutes: schedule.slot_duration_minutes,
            status: 'available' as const
          });
        }
        
        currentTime = slotEnd;
      }
      
      // Insert generated slots
      if (slots.length > 0) {
        const { data, error } = await supabase
          .from('doctor_weekly_time_slots')
          .upsert(slots, {
            onConflict: 'doctor_id,schedule_date,start_time',
            ignoreDuplicates: true
          })
          .select();
        
        if (error) {
          console.warn(`⚠️ Error inserting slots for ${dateStr}:`, error);
        } else {
          console.log(`✅ Inserted ${data?.length || 0} slots for ${dateStr}`);
          allSlots.push(...(data || []));
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to generate slots for ${dateStr}:`, error);
    }
  }
  
  console.log(`✅ Generated ${allSlots.length} total weekly time slots`);
  return allSlots;
};

// Get available weekly time slots for booking
export const getAvailableWeeklyTimeSlots = async (doctorId: string, date: string) => {
  console.log(`🔍 Getting available weekly time slots for doctor ${doctorId} on ${date}`);
  
  const { data, error } = await supabase
    .from('doctor_weekly_time_slots')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('schedule_date', date)
    .eq('status', 'available')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error fetching available weekly time slots:', error);
    throw error;
  }

  console.log(`✅ Found ${data?.length || 0} available weekly time slots`);
  return data || [];
};

// Delete time slots for a specific day of week
export const deleteTimeSlotsForDayOfWeek = async (doctorId: string, dayOfWeek: number, daysAhead: number = 28) => {
  console.log(`🗑️ Deleting time slots for doctor ${doctorId}, day ${dayOfWeek}, next ${daysAhead} days`);
  
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + daysAhead);
  
  // Get all dates for this day of week in the specified period
  const datesToClean = [];
  for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
    if (date.getDay() === dayOfWeek) {
      datesToClean.push(date.toISOString().split('T')[0]);
    }
  }
  
  if (datesToClean.length === 0) {
    console.log(`ℹ️ No dates found for day ${dayOfWeek} in the next ${daysAhead} days`);
    return { deletedCount: 0 };
  }
  
  console.log(`📅 Deleting slots for dates: ${datesToClean.join(', ')}`);
  
  const { data, error } = await supabase
    .from('time_slots')
    .delete()
    .eq('doctor_id', doctorId)
    .in('schedule_date', datesToClean)
    .select('id');
  
  if (error) {
    console.error('❌ Error deleting time slots:', error);
    throw error;
  }
  
  const deletedCount = data?.length || 0;
  console.log(`✅ Deleted ${deletedCount} time slots for day ${dayOfWeek}`);
  
  return { deletedCount };
};

// Patient profile functions
export const createPatientProfile = async (userId: string, patientData: any) => {
  console.log('🔄 createPatientProfile called with:', { userId, patientData });
  console.log('🔧 Using Mock Supabase:', isMockSupabase);
  
  // First check if patient already exists
  const { data: existingPatient, error: checkError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('🔍 Existing patient check result:', { existingPatient, checkError });

  if (checkError) {
    console.error('❌ Error checking existing patient:', checkError);
    throw checkError;
  }

  if (existingPatient) {
    console.log('ℹ️ Patient profile already exists, updating instead');
    // Update existing patient profile
    const { data, error } = await supabase
      .from('patients')
      .update(patientData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Patient profile updated successfully:', data);
    return data
  }

  // Create new patient profile
  console.log('🔄 Creating new patient profile...');
  const { data, error } = await supabase
    .from('patients')
    .insert([
      {
        user_id: userId,
        ...patientData
      }
    ])
    .select()
    .single()

  console.log('🔍 Patient profile creation result:', { data, error });

  if (error) {
    console.error('❌ Error creating patient profile:', error);
    throw error
  }
  
  console.log('✅ Patient profile created successfully:', data);
  return data
}

export const getPatientProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('❌ Error fetching patient profile:', error);
      return null;
    }
    
    console.log('✅ Patient profile fetched:', data ? 'Found' : 'Not found');
    return data
  } catch (error) {
    console.error('❌ Unexpected error fetching patient profile:', error)
    return null
  }
}

export const updatePatientProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}