# Appointment Booking Data Flow Verification

## 📋 **Data Flow Summary**

When a user clicks "Sign in to Book Appointment" and completes the booking process, the following data should be saved:

### **1. Appointments Table** ✅
**Table**: `appointments`
**Data Saved**:
- `id` - Unique appointment ID (UUID)
- `doctor_id` - ID of the selected doctor
- `patient_id` - ID of the patient profile (not user ID)
- `appointment_date` - Selected date (YYYY-MM-DD format)
- `start_time` - Selected time (HH:MM:SS format)
- `end_time` - Calculated end time
- `duration_minutes` - Duration of the appointment
- `status` - 'scheduled'
- `notes` - 'Appointment booked through EaseHealth platform'
- `queue_token` - Generated queue token (QT-YYYY-XXXX format)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### **2. Time Slots Table** ✅
**Table**: `time_slots`
**Data Updated**:
- `status` - Changed from 'available' to 'booked'
- `appointment_id` - Set to the created appointment ID
- `notes` - Updated with booking information
- `updated_at` - Timestamp

### **3. Patients Table** ✅
**Table**: `patients`
**Data Saved** (if patient profile doesn't exist):
- `id` - Patient profile ID (UUID)
- `user_id` - Supabase auth user ID
- `full_name` - Patient's full name
- `email` - Patient's email
- `phone_number` - Patient's phone number
- `is_active` - true
- `created_at` - Timestamp
- `updated_at` - Timestamp

### **4. Patient Pre-Registrations Table** ✅
**Table**: `patient_pre_registrations`
**Data Saved** (if coming from sign-up flow):
- `id` - Pre-registration ID (UUID)
- `user_id` - Supabase auth user ID
- `full_name` - Patient's full name
- `email` - Patient's email
- `phone_number` - Patient's phone number
- `status` - 'completed'
- `created_at` - Timestamp
- `updated_at` - Timestamp

## 🔄 **Booking Flow Steps**

### **Step 1: User Authentication**
- User clicks "Sign in to Book Appointment"
- Redirected to LoginPage with booking details
- User logs in or signs up

### **Step 2: Patient Profile Creation**
- Check if patient profile exists in `patients` table
- If not, create patient profile
- If coming from sign-up, also create pre-registration record

### **Step 3: Appointment Creation**
- Generate unique queue token
- Create appointment record in `appointments` table
- Update corresponding time slot in `time_slots` table

### **Step 4: User Feedback**
- Show queue token modal with booking confirmation
- Display appointment details
- Redirect to Patient Dashboard

## 🧪 **Testing Checklist**

### **Database Schema Verification**
- [ ] `appointments` table has `queue_token` column
- [ ] `generate_queue_token()` function exists
- [ ] All required tables exist and are accessible

### **Data Flow Testing**
- [ ] Patient profile is created/retrieved correctly
- [ ] Appointment record is created with all required fields
- [ ] Queue token is generated and saved
- [ ] Time slot status is updated to 'booked'
- [ ] Queue token modal displays correct information

### **Error Handling Testing**
- [ ] Handles missing patient profile gracefully
- [ ] Handles appointment creation failures
- [ ] Handles time slot booking conflicts
- [ ] Shows appropriate error messages

## 🚨 **Common Issues to Check**

1. **Queue Token Column Missing**
   - Run: `add_queue_token_column.sql`
   - Verify column exists in appointments table

2. **Queue Token Function Missing**
   - Run: `create_queue_token_function.sql`
   - Test function with: `SELECT generate_queue_token();`

3. **Patient Profile Issues**
   - Ensure patient profile is created before appointment
   - Check user_id mapping between auth and patients table

4. **Time Slot Conflicts**
   - Verify time slot availability before booking
   - Check race condition handling

## 📊 **Expected Database State After Booking**

### **Before Booking**
```sql
-- Time slot should be available
SELECT * FROM time_slots WHERE status = 'available';

-- No appointment should exist for this slot
SELECT * FROM appointments WHERE appointment_date = '2024-01-15';
```

### **After Booking**
```sql
-- Time slot should be booked
SELECT * FROM time_slots WHERE status = 'booked';

-- Appointment should exist with queue token
SELECT * FROM appointments WHERE queue_token IS NOT NULL;

-- Patient profile should exist
SELECT * FROM patients WHERE user_id = 'user-uuid';
```

## 🔧 **SQL Commands to Verify**

```sql
-- Check appointments table structure
\d appointments;

-- Check if queue_token column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'queue_token';

-- Test queue token generation
SELECT generate_queue_token();

-- Check recent appointments
SELECT id, queue_token, appointment_date, start_time, status, created_at
FROM appointments 
ORDER BY created_at DESC 
LIMIT 5;

-- Check time slots status
SELECT id, status, appointment_id, schedule_date, start_time
FROM time_slots 
WHERE status = 'booked'
ORDER BY updated_at DESC 
LIMIT 5;
```

