# Patient Registration Flow - Quick Testing Guide

## ⚠️ IMPORTANT: Apply Migration First!

Before testing, you MUST apply the database migration:

### Quick Migration Application (Supabase Dashboard)
1. Go to your Supabase Dashboard → SQL Editor
2. Copy the content from: `supabase/migrations/20250126000000_add_queue_token_and_pre_registrations.sql`
3. Paste and click **RUN**
4. Wait for success confirmation

## 🧪 Testing Steps

### 1. Open Browser Console
- Press **F12** or **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)
- Go to **Console** tab
- Keep it open during the entire test

### 2. Start the Flow
1. Navigate to: `http://localhost:5173/smart-appointment-booking`
2. Select a **Specialty** (e.g., Gastroenterology)
3. Select a **Doctor**
4. Select a **Date** (one with available slots - highlighted in green)
5. Select a **Time Slot**
6. Click **"Sign in to Book Appointment"** button

### 3. Login Page
- You should see the login page with your booking details displayed at the top
- Click the **"Sign Up"** link (below the login form)

### 4. Pre-Registration Form
Fill in the following fields:

#### Required Fields:
- **Full Name**: John Doe
- **Email**: test.patient@example.com (use a unique email)
- **Password**: Test123! (at least 6 characters)
- **Confirm Password**: Test123!
- **Phone Number**: +1234567890
- **Date of Birth**: 1990-01-01
- **Gender**: Male
- **Address**: 123 Test Street
- **Emergency Contact Name**: Jane Doe
- **Emergency Contact Phone**: +0987654321
- **Consent Checkbox**: ✅ Check this

#### Optional Fields (you can skip):
- City, State
- Medical History
- Allergies
- Current Medications
- Blood Type
- Insurance Provider/Number
- Document uploads

### 5. Submit the Form
Click **"Create Profile"** button

### 6. Watch Console Logs
You should see logs appearing in this order:

```
✅ 🔄 Starting form submission...
✅ 🔑 Auth state: { user: null, ... }
✅ 📝 Form data: { fullName: "John Doe", ... }
✅ 🔐 Creating new auth account for: test.patient@example.com
✅ ✅ Successfully created auth account with ID: <uuid>
✅ 📊 Attempting to insert into patients table: { ... }
✅ ✅ Successfully inserted into patients table: { id: <uuid>, ... }
✅ 📊 Attempting to insert into patient_pre_registrations table: { ... }
✅ ✅ Successfully inserted into patient_pre_registrations table
✅ 📅 Attempting to create appointment with booking details: { ... }
✅ ✅ Successfully updated time slot status
✅ 🎫 Generated queue token: QT-2025-XXXXXXXX
✅ 📅 Creating appointment with data: { ... }
✅ ✅ Successfully created appointment: { id: <uuid>, queue_token: "...", ... }
```

### 7. Queue Token Modal Should Appear
You should see a modal with:
- ✅ Green checkmark icon
- ✅ "Booking Confirmed!" heading
- ✅ Your queue token (e.g., QT-2025-ABC12345)
- ✅ Appointment details (doctor, date, time)
- ✅ Copy button for the token

### 8. Verify in Supabase Dashboard

Go to your Supabase Dashboard and check:

#### Authentication Table
- Path: Authentication → Users
- ✅ New user with email: test.patient@example.com

#### Patients Table
- Path: Table Editor → patients
- ✅ New record with your full name and email

#### Patient Pre-Registrations Table
- Path: Table Editor → patient_pre_registrations
- ✅ New record with same data

#### Time Slots Table
- Path: Table Editor → time_slots
- ✅ Your selected slot should have status: 'booked'

#### Appointments Table
- Path: Table Editor → appointments
- ✅ New appointment record with:
  - patient_id matching your patient record
  - doctor_id matching selected doctor
  - appointment_date and start_time matching your selection
  - queue_token (e.g., QT-2025-ABC12345)
  - status: 'scheduled'

## 🐛 Troubleshooting

### ❌ Nothing happens when clicking "Create Profile"
**Check console for errors:**
- Form validation errors? → Fill all required fields
- "Column 'queue_token' does not exist"? → Migration not applied
- "Table 'patient_pre_registrations' does not exist"? → Migration not applied

### ❌ Error: "User already registered"
- Use a different email address
- Or delete the test user from Supabase Dashboard → Authentication

### ❌ Error: "Password too weak"
- Use at least 6 characters
- Include letters and numbers

### ❌ Error: "Row Level Security policy violation"
- Check that RLS policies were created by the migration
- Verify user_id matches in all tables

### ❌ Modal doesn't appear
**Check console logs:**
- Did appointment creation succeed?
- Are `queueToken` and `appointmentDetails` set?
- Is `showQueueTokenModal` true?

### ❌ Time slot not updating to 'booked'
- Check if bookingDetails includes `timeSlotId`
- Verify the update query in console logs

## 📊 What Each Step Does

| Step | What Happens | Database Changes |
|------|-------------|------------------|
| 1. Form Validation | Checks all required fields | None |
| 2. Auth Account Creation | Creates Supabase auth user | `auth.users` ← INSERT |
| 3. File Upload | Uploads documents to storage | `storage.objects` ← INSERT |
| 4. Patient Record | Creates patient profile | `patients` ← INSERT |
| 5. Pre-Registration | Saves registration data | `patient_pre_registrations` ← INSERT |
| 6. Time Slot Update | Marks slot as booked | `time_slots` ← UPDATE status |
| 7. Queue Token | Generates unique token | None (function call) |
| 8. Appointment Creation | Books the appointment | `appointments` ← INSERT |
| 9. Modal Display | Shows success + token | None (UI only) |

## 🎯 Success Criteria

✅ **All of these should be true:**
1. No red error messages in console
2. All green ✅ log messages appear
3. Queue token modal displays
4. Can copy queue token
5. All 5 database tables have new records
6. Time slot status changed to 'booked'

## 🔄 Testing Again

To test again with the same booking slot:
1. Go to Supabase Dashboard → Table Editor → time_slots
2. Find your booked slot
3. Change status back to 'available'
4. Delete the appointment record (appointments table)
5. Use a different email address for registration

## 📞 Need Help?

If you encounter issues:
1. Copy the entire console log
2. Take screenshots of any error messages
3. Check which step failed (look for the last ✅ before ❌)
4. Share the error details

## 🎉 When Everything Works

You should see:
- ✅ 5 database tables updated
- ✅ Queue token displayed: QT-2025-XXXXXXXX
- ✅ Success modal appears
- ✅ No errors in console
- ✅ Complete audit trail in logs

**The patient registration and appointment booking flow is now fully functional!**

