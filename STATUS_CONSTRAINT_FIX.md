# Status Constraint Fix - 'scheduled' → 'booked'

## Error Found

```
new row for relation "appointments" violates check constraint "appointments_status_check"
```

## Root Cause

The code was using an invalid status value:
- ❌ **Code was using**: `'scheduled'`
- ✅ **Database allows**: `'booked', 'confirmed', 'cancelled', 'completed', 'no_show'`

## Database Constraint

From `sql/migrations/create_appointments_table.sql`:
```sql
CREATE TABLE IF NOT EXISTS appointments (
  ...
  status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'cancelled', 'completed', 'no_show')),
  ...
);
```

## Fix Applied

**File**: `src/utils/supabase.ts`

### Fixed Line 1162:
```javascript
// Before (WRONG):
status: 'scheduled',

// After (CORRECT):
status: 'booked',  // Fixed: Changed from 'scheduled' to 'booked' to match database constraint
```

### Fixed Line 1216:
```javascript
// Before (WRONG):
status: 'scheduled',

// After (CORRECT):
status: 'booked',  // Fixed: Changed from 'scheduled' to 'booked' to match database constraint
```

## Why This Happened

The database has a CHECK constraint that only allows specific status values:
- `'booked'` - Initial status when appointment is created
- `'confirmed'` - When doctor confirms the appointment
- `'cancelled'` - When appointment is cancelled
- `'completed'` - When appointment is completed
- `'no_show'` - When patient doesn't show up

The code was using `'scheduled'` which is not in the allowed list.

## Testing

After this fix, the appointment booking should work correctly:
1. User selects doctor, date, and time
2. System creates appointment with status = 'booked'
3. System updates time slot status to 'booked'
4. User sees success message

## Files Modified

- ✅ `src/utils/supabase.ts` - Fixed status value in createAppointment function

## All Fixes Applied So Far

1. ✅ Removed mock slot logic
2. ✅ Fixed column name: `appointment_date` → `schedule_date`
3. ✅ Fixed status value: `'scheduled'` → `'booked'`
4. ✅ Fixed IST timezone handling
5. ✅ Added AlertCircle import

