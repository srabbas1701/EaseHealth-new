# Calendar Alignment Debug Guide

## 🔍 **Issue Identified**
The calendar days and dates are misaligned - Sunday's non-availability is showing on Monday.

## 🛠️ **Debugging Steps**

### **Step 1: Check Console Logs**
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Navigate to the Smart Appointment Booking page
4. Select a doctor
5. Look for these debug logs:
   - `Week days array: ["S","M","T","W","T","F","S"]`
   - `Doctor schedules: [...]` (check day_of_week values)
   - `Date: [date], Day of Week: [number], Available: [boolean]`

### **Step 2: Verify Day-of-Week Values**
Check that the console shows:
- **Sunday**: Day of Week: 0
- **Monday**: Day of Week: 1  
- **Tuesday**: Day of Week: 2
- etc.

### **Step 3: Check Doctor Schedule Values**
In the doctor schedule, verify:
- **Sunday**: day_of_week should be 0
- **Monday**: day_of_week should be 1
- etc.

## 🔧 **Potential Fixes**

### **Fix 1: Database Day Mapping Issue**
If the database is storing days differently:

```javascript
// In SmartAppointmentBookingPage.tsx, line ~157
const isAvailable = schedules?.some(schedule => {
  // Handle different day mapping if needed
  let scheduleDay = schedule.day_of_week;
  
  // If database uses ISO standard (Monday=1, Sunday=7)
  if (scheduleDay === 7) {
    scheduleDay = 0; // Convert to JavaScript Sunday=0
  }
  
  return scheduleDay === dayOfWeek && schedule.is_available;
});
```

### **Fix 2: Calendar Grid Alignment Issue**
If the issue is visual alignment:

```javascript
// Ensure weekDays array matches JavaScript getDay() order
const weekDays = ["S","M","T","W","T","F","S"]; // Sunday=0, Monday=1, etc.
```

### **Fix 3: Doctor Schedule Configuration**
Ensure the DoctorScheduleConfigPage stores the correct day values:

```javascript
// In DoctorScheduleConfigPage.tsx
const daysOfWeek = [
  { id: 1, name: 'Monday', short: 'Mon' },    // day_of_week: 1
  { id: 2, name: 'Tuesday', short: 'Tue' },   // day_of_week: 2
  { id: 3, name: 'Wednesday', short: 'Wed' }, // day_of_week: 3
  { id: 4, name: 'Thursday', short: 'Thu' },  // day_of_week: 4
  { id: 5, name: 'Friday', short: 'Fri' },    // day_of_week: 5
  { id: 6, name: 'Saturday', short: 'Sat' },  // day_of_week: 6
  { id: 0, name: 'Sunday', short: 'Sun' }     // day_of_week: 0
];
```

## 🧪 **Testing Steps**

### **Test 1: Manual Calendar Check**
1. Create a doctor schedule with:
   - Sunday: Available
   - Monday: Not Available
2. Check the calendar:
   - Sunday dates should be clickable/available
   - Monday dates should be grayed out

### **Test 2: Database Verification**
```sql
-- Check stored day_of_week values
SELECT day_of_week, is_available, 
  CASE day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name
FROM doctor_schedules 
WHERE doctor_id = 'your-doctor-id';
```

### **Test 3: JavaScript Date Test**
```javascript
// Test in browser console
const testDate = new Date('2024-01-07'); // This should be a Sunday
console.log('Day of week:', testDate.getDay()); // Should output 0

const mondayDate = new Date('2024-01-08'); // This should be a Monday  
console.log('Day of week:', mondayDate.getDay()); // Should output 1
```

## 🎯 **Expected Behavior**

### **Correct Alignment:**
```
Calendar Grid:
S  M  T  W  T  F  S
1  2  3  4  5  6  7
8  9  10 11 12 13 14
...

If Sunday is available: Day 1, 8, 15, 22, 29 should be available
If Monday is not available: Day 2, 9, 16, 23, 30 should be grayed out
```

### **Incorrect Alignment (Current Issue):**
```
Calendar Grid:
S  M  T  W  T  F  S
1  2  3  4  5  6  7
8  9  10 11 12 13 14
...

Sunday availability showing on Monday: Day 2, 9, 16, 23, 30
```

## 🚀 **Quick Fix Implementation**

If the issue is confirmed to be a day mapping problem, apply this fix:

```javascript
// In SmartAppointmentBookingPage.tsx, replace the availability check:
const isAvailable = schedules?.some(schedule => {
  // Convert database day_of_week to JavaScript day if needed
  let dbDay = schedule.day_of_week;
  
  // If your database stores Sunday as 7 instead of 0
  if (dbDay === 7) {
    dbDay = 0;
  }
  
  return dbDay === dayOfWeek && schedule.is_available;
});
```

## 📝 **Next Steps**

1. **Run the debugging** and check console logs
2. **Identify the exact mismatch** between database and JavaScript day values
3. **Apply the appropriate fix** based on the findings
4. **Test with different doctor schedules** to confirm the fix works
5. **Remove debug logging** once the issue is resolved

Let me know what the console logs show, and I can provide a more targeted fix!
