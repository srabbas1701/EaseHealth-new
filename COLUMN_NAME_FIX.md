# Column Name Fix - appointment_date → schedule_date

## Error Found

```
Could not find the 'appointment_date' column of 'appointments' in the schema cache
```

## Root Cause

The `createAppointment` function was using the wrong column name:
- ❌ **Code was using**: `appointment_date`
- ✅ **Database has**: `schedule_date`

## Database Schema

From `sql/migrations/create_appointments_table.sql`:
```sql
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  schedule_date DATE NOT NULL,  -- ← This is the correct column name
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

## Fix Applied

**File**: `src/utils/supabase.ts`

### Fixed Line 1158:
```javascript
// Before (WRONG):
appointment_date: date,

// After (CORRECT):
schedule_date: date,  // Fixed: Changed from appointment_date to schedule_date
```

### Fixed Line 1212:
```javascript
// Before (WRONG):
appointment_date: date,

// After (CORRECT):
schedule_date: date,  // Fixed: Changed from appointment_date to schedule_date
```

## Why This Happened

The column name in the database is `schedule_date` (consistent with the `time_slots` table which also uses `schedule_date`), but the code was using `appointment_date` which doesn't exist.

## Testing

After this fix, the appointment booking should work correctly:
1. User selects doctor, date, and time
2. System creates appointment with correct column name
3. System updates time slot status to 'booked'
4. User sees success message

## Files Modified

- ✅ `src/utils/supabase.ts` - Fixed column name in createAppointment function

