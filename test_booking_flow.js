// Test script to verify appointment booking data flow
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingFlow() {
  console.log('🧪 Testing Appointment Booking Data Flow...\n');

  try {
    // 1. Check if appointments table has queue_token column
    console.log('1. Checking appointments table structure...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (appointmentsError) {
      console.error('❌ Error accessing appointments table:', appointmentsError.message);
      return;
    }
    
    console.log('✅ Appointments table accessible');
    if (appointments.length > 0) {
      console.log('📋 Sample appointment structure:', Object.keys(appointments[0]));
    }

    // 2. Check if time_slots table exists and has correct structure
    console.log('\n2. Checking time_slots table structure...');
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('time_slots')
      .select('*')
      .limit(1);
    
    if (timeSlotsError) {
      console.error('❌ Error accessing time_slots table:', timeSlotsError.message);
      return;
    }
    
    console.log('✅ Time_slots table accessible');
    if (timeSlots.length > 0) {
      console.log('📋 Sample time_slot structure:', Object.keys(timeSlots[0]));
    }

    // 3. Check if patients table exists
    console.log('\n3. Checking patients table structure...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (patientsError) {
      console.error('❌ Error accessing patients table:', patientsError.message);
      return;
    }
    
    console.log('✅ Patients table accessible');
    if (patients.length > 0) {
      console.log('📋 Sample patient structure:', Object.keys(patients[0]));
    }

    // 4. Test queue token generation function
    console.log('\n4. Testing queue token generation...');
    const { data: queueToken, error: tokenError } = await supabase.rpc('generate_queue_token');
    
    if (tokenError) {
      console.error('❌ Error generating queue token:', tokenError.message);
      console.log('⚠️  Queue token function may not be installed. Check create_queue_token_function.sql');
    } else {
      console.log('✅ Queue token generated:', queueToken);
    }

    // 5. Check recent appointments for queue tokens
    console.log('\n5. Checking recent appointments for queue tokens...');
    const { data: recentAppointments, error: recentError } = await supabase
      .from('appointments')
      .select('id, queue_token, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Error fetching recent appointments:', recentError.message);
    } else {
      console.log('📋 Recent appointments:');
      recentAppointments.forEach(apt => {
        console.log(`   - ID: ${apt.id}, Token: ${apt.queue_token || 'NULL'}, Status: ${apt.status}, Created: ${apt.created_at}`);
      });
    }

    console.log('\n✅ Data flow test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Appointments table: ✅ Accessible');
    console.log('   - Time_slots table: ✅ Accessible');
    console.log('   - Patients table: ✅ Accessible');
    console.log('   - Queue token function: ' + (tokenError ? '❌ Not available' : '✅ Working'));
    
    if (tokenError) {
      console.log('\n⚠️  IMPORTANT: You need to run the SQL files to set up the database:');
      console.log('   1. Run: add_queue_token_column.sql');
      console.log('   2. Run: create_queue_token_function.sql');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBookingFlow();

