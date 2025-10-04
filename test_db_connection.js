// Test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://whwjdnvxskaysebdbexv.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indod2pkbnZ4c2theXNlYmRiZXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDA4NzgsImV4cCI6MjA3NDIxNjg3OH0.6G7U4giw4BQtEbJoapWkhf2d-biVxl-hgDbzg4jufO4'

console.log('🔧 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test 1: Check if we can connect to the database by querying doctors table
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, full_name')
      .limit(1)
    
    if (doctorsError) {
      console.error('❌ Error connecting to database:', doctorsError);
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📋 Doctors found:', doctors?.length || 0);
    
    // Test 2: Check if patients table exists and has data
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .limit(1)
    
    if (patientsError) {
      console.log('⚠️ Patients table error (might not exist):', patientsError.message);
    } else {
      console.log('✅ Patients table accessible, count:', patients?.length || 0);
    }
    
    // Test 3: Check if time_slots table exists and has data
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('id')
      .limit(1)
    
    if (timeSlotsError) {
      console.log('⚠️ Time slots table error (might not exist):', timeSlotsError.message);
    } else {
      console.log('✅ Time slots table accessible, count:', timeSlots?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
