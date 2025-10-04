// Test script to check time_slots table data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://whwjdnvxskaysebdbexv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indod2pkbnZ4c2theXNlYmRiZXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDA4NzgsImV4cCI6MjA3NDIxNjg3OH0.6G7U4giw4BQtEbJoapWkhf2d-biVxl-hgDbzg4jufO4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTimeSlots() {
  try {
    console.log('🔍 Checking time_slots table...');
    
    // Get all time slots
    const { data: allSlots, error: allError } = await supabase
      .from('time_slots')
      .select('*')
      .limit(10)
    
    if (allError) {
      console.error('❌ Error fetching time slots:', allError);
      return;
    }
    
    console.log('📋 All time slots:', allSlots?.length || 0);
    if (allSlots && allSlots.length > 0) {
      console.log('Sample time slot:', allSlots[0]);
    }
    
    // Get available time slots
    const { data: availableSlots, error: availableError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('status', 'available')
      .limit(5)
    
    if (availableError) {
      console.error('❌ Error fetching available slots:', availableError);
    } else {
      console.log('✅ Available time slots:', availableSlots?.length || 0);
      if (availableSlots && availableSlots.length > 0) {
        console.log('Sample available slot:', availableSlots[0]);
      }
    }
    
    // Get booked time slots
    const { data: bookedSlots, error: bookedError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('status', 'booked')
      .limit(5)
    
    if (bookedError) {
      console.error('❌ Error fetching booked slots:', bookedError);
    } else {
      console.log('📅 Booked time slots:', bookedSlots?.length || 0);
      if (bookedSlots && bookedSlots.length > 0) {
        console.log('Sample booked slot:', bookedSlots[0]);
      }
    }
    
    // Check if we have doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, full_name')
      .limit(3)
    
    if (doctorsError) {
      console.error('❌ Error fetching doctors:', doctorsError);
    } else {
      console.log('👨‍⚕️ Doctors:', doctors?.length || 0);
      if (doctors && doctors.length > 0) {
        console.log('Sample doctor:', doctors[0]);
        
        // Check time slots for this doctor
        const { data: doctorSlots, error: doctorSlotsError } = await supabase
          .from('time_slots')
          .select('*')
          .eq('doctor_id', doctors[0].id)
          .limit(3)
        
        if (doctorSlotsError) {
          console.error('❌ Error fetching doctor slots:', doctorSlotsError);
        } else {
          console.log(`📅 Time slots for ${doctors[0].full_name}:`, doctorSlots?.length || 0);
          if (doctorSlots && doctorSlots.length > 0) {
            console.log('Sample doctor slot:', doctorSlots[0]);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTimeSlots();
