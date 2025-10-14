# Foreign Key Constraint Fix - patient_id

## Error Found

```
insert or update on table "appointments" violates foreign key constraint "appointments_patient_id_fkey"
```

## Root Cause

The code was using the wrong ID for the patient:
- ❌ **Code was using**: `patientProfile.id` (patient profile ID from `patients` table)
- ✅ **Should use**: `patientProfile.user_id` (user ID from `auth.users` table)

## Database Schema

From `sql/migrations/create_appointments_table.sql`:
```sql
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),  -- ← References auth.users, NOT patients table
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, schedule_date, start_time)
);
```

## The Problem

The `appointments.patient_id` column has a foreign key constraint that references `auth.users(id)`, not `patients(id)`.

So when the code tried to insert `patientProfile.id` (which is from the `patients` table), it violated the foreign key constraint because that ID doesn't exist in `auth.users`.

## Fix Applied

### File 1: `src/pages/LoginPage.tsx` (Line 130)

```javascript
// Before (WRONG):
const appointment = await createAppointment(
  bookingDetails.selectedDoctor.id,
  patientProfile.id,  // ❌ Wrong - this is from patients table
  dateString,
  timeString,
  30,
  'Appointment booked through EaseHealth platform'
);

// After (CORRECT):
const appointment = await createAppointment(
  bookingDetails.selectedDoctor.id,
  patientProfile.user_id,  // ✅ Correct - this is from auth.users
  dateString,
  timeString,
  30,
  'Appointment booked through EaseHealth platform'
);
```

### File 2: `src/pages/SmartAppointmentBookingPage.tsx` (Line 232)

```javascript
// Before (WRONG):
const appointment = await createAppointment(
  doctor.id,
  patientProfile.id, // Use patient profile ID, not user ID  // ❌ Wrong comment and code
  dateString,
  timeString,
  durationMinutes,
  `Appointment booked through EaseHealth platform`
);

// After (CORRECT):
const appointment = await createAppointment(
  doctor.id,
  patientProfile.user_id, // Fixed: Use user_id (auth.users.id) not patient profile id  // ✅ Correct
  dateString,
  timeString,
  durationMinutes,
  `Appointment booked through EaseHealth platform`
);
```

## Why This Happened

The confusion arose because:
1. The `patients` table has its own `id` field
2. The `patients` table also has a `user_id` field that references `auth.users(id)`
3. The `appointments` table's `patient_id` references `auth.users(id)`, not `patients(id)`

So the correct ID to use is `patientProfile.user_id`, not `patientProfile.id`.

## Database Relationships

```
auth.users (id) ←──────────┐
                           │
                           │ user_id (FK)
                           │
                    patients (id, user_id)
                           │
                           │ patient_id (FK)
                           │
                    appointments (patient_id)
```

## Testing

After this fix, the appointment booking should work correctly:
1. User selects doctor, date, and time
2. System gets patient profile
3. System uses `patientProfile.user_id` (from auth.users) for the appointment
4. System creates appointment with correct foreign key reference
5. User sees success message

## Files Modified

- ✅ `src/pages/LoginPage.tsx` - Fixed patient ID to use user_id
- ✅ `src/pages/SmartAppointmentBookingPage.tsx` - Fixed patient ID to use user_id

## All Fixes Applied So Far

1. ✅ Removed mock slot logic
2. ✅ Fixed column name: `appointment_date` → `schedule_date`
3. ✅ Fixed status value: `'scheduled'` → `'booked'`
4. ✅ Fixed IST timezone handling
5. ✅ Added AlertCircle import
6. ✅ Fixed patient ID: `patientProfile.id` → `patientProfile.user_id`

