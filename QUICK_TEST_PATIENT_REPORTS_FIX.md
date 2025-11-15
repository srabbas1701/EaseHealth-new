# Quick Test Guide - Patient Reports Reload Fix

## 🎯 Quick Test (2 minutes)

### Test: Upload Report → See Immediately

1. **Login as Patient**
   ```
   Email: [your patient email]
   Password: [your password]
   ```

2. **Go to Profile Update**
   - Click "Update Profile" button in dashboard
   - Or navigate to `/patient-profile-update`

3. **Upload Lab Report**
   - Scroll to "Lab Reports" section
   - Click "Choose Files" or drag-and-drop
   - Select any PDF/image file
   - Click "Update Profile" button at bottom

4. **Wait for Redirect**
   - Success message shows: "Profile updated successfully!"
   - Auto-redirects to dashboard after 2 seconds

5. **✅ VERIFY - Report Shows Immediately**
   - Dashboard loads
   - Click "Uploaded Files" tab
   - **CHECK:** Your newly uploaded report is visible
   - Click "Pre-Registration" tab → "Lab Reports" section
   - **CHECK:** Report appears here too

### Expected Console Logs

You should see these in browser console:

```
📄 Uploading 1 lab report files...
✅ Lab report uploaded and recorded in database: [filename]
✅ 1 lab reports saved to patient_reports table
🗑️ Cleared patient reports cache for fresh reload
Profile updated successfully!
🔄 Profile updated - forcing data reload
🔄 Manually refreshing patient data...
🗑️ Cleared patient reports cache
✅ Patient data refreshed successfully
✅ Fetched X reports for patient [patient-id]
```

---

## ⚡ Quick Checks

### Check 1: Cache is Cleared
```javascript
// In browser console BEFORE upload
sessionStorage.getItem('patient_reports_cache_[your-patient-id]')
// Should return cached data if exists

// AFTER upload
sessionStorage.getItem('patient_reports_cache_[your-patient-id]')
// Should return null (cache cleared)
```

### Check 2: Database has the Record
```sql
-- In Supabase SQL Editor
SELECT 
  report_name,
  uploaded_by,
  upload_source,
  upload_date,
  is_deleted
FROM patient_reports
WHERE patient_id = '[your-patient-id]'
  AND is_deleted = false
ORDER BY upload_date DESC
LIMIT 5;
```

**Expected Result:**
```
report_name       | uploaded_by | upload_source            | upload_date           | is_deleted
------------------|-------------|--------------------------|----------------------|------------
your_file.pdf     | NULL        | patient_profile_update   | 2025-02-09 10:30:00  | false
```

### Check 3: File in Storage
```javascript
// In Supabase Dashboard → Storage → lab-reports
// Look for: [user-id]/documents/lab_reports/[timestamp]_[filename]
```

---

## 🐛 Troubleshooting

### Issue: Report Still Not Showing

**Step 1: Check Console for Errors**
```javascript
// Look for:
// ❌ Failed to upload
// ❌ Error in database insert
// ⚠️ JWT errors
```

**Step 2: Verify Upload Succeeded**
```sql
-- Check if record was created
SELECT * FROM patient_reports 
WHERE report_name LIKE '%[your_filename]%'
ORDER BY created_at DESC
LIMIT 1;
```

**Step 3: Check RLS Policies**
```sql
-- Verify patient can see their reports
SELECT * FROM patient_reports 
WHERE patient_id IN (
  SELECT id FROM patients WHERE user_id = auth.uid()
)
LIMIT 5;
```

**Step 4: Manual Cache Clear**
```javascript
// In browser console
sessionStorage.clear();
location.reload();
```

**Step 5: Check Network Tab**
- Open DevTools → Network
- Upload a report
- Look for POST to `/storage/v1/object/lab-reports`
- Should return 200 OK
- Look for POST to `/rest/v1/patient_reports`
- Should return 201 Created

---

## ✅ Success Criteria

All of these should be TRUE:

- ✅ File uploaded to storage successfully
- ✅ Record created in `patient_reports` table with `uploaded_by = NULL`
- ✅ Cache cleared: `console.log('🗑️ Cleared patient reports cache')`
- ✅ Dashboard reloaded: `console.log('🔄 Profile updated - forcing data reload')`
- ✅ Fresh data fetched: `console.log('✅ Fetched X reports')`
- ✅ Report visible in "Uploaded Files" tab
- ✅ Report visible in "Pre-Registration" → "Lab Reports"
- ✅ No page refresh needed
- ✅ No logout required

---

## 🔄 Test Multiple Reports

1. Upload 3 files at once
2. **VERIFY:** All 3 show immediately
3. **VERIFY:** Upload source = "patient profile update"
4. **VERIFY:** Correct timestamps
5. **VERIFY:** Can view each file (signed URLs work)

---

## 🎨 Visual Verification

### Uploaded Files Tab
```
┌─────────────────────────────────────────────┐
│ Lab Reports                      3 files    │
├─────────────────────────────────────────────┤
│ 📄 blood_test.pdf                           │
│    2025-02-09 • patient profile update      │
│    [View] [Delete]                          │
├─────────────────────────────────────────────┤
│ 📄 xray_chest.png                           │
│    2025-02-09 • patient profile update      │
│    [View] [Delete]                          │
└─────────────────────────────────────────────┘
```

### Pre-Registration Tab
```
┌─────────────────────────────────────────────┐
│ Lab Reports                                 │
├─────────────────────────────────────────────┤
│ blood_test.pdf                              │
│ Feb 9, 2025        [View Report] →          │
├─────────────────────────────────────────────┤
│ xray_chest.png                              │
│ Feb 9, 2025        [View Report] →          │
└─────────────────────────────────────────────┘
```

---

## 📱 Test on Different Scenarios

### Scenario 1: Fresh Upload
- New patient account
- First time uploading
- ✅ Should work

### Scenario 2: Additional Upload
- Existing patient with old reports
- Upload new report
- ✅ New report appears with old ones

### Scenario 3: After Page Refresh
- Upload report
- Press F5 (refresh)
- ✅ Report still visible

### Scenario 4: Browser Back Button
- Upload report → Redirected to dashboard
- Click back button
- Navigate forward to dashboard again
- ✅ Report still visible

### Scenario 5: Manual Navigation
- Upload report
- Don't wait for redirect
- Manually navigate to dashboard
- Click manual refresh button
- ✅ Report appears after refresh

---

## 🔧 Developer Notes

### Files Changed
1. `src/pages/PatientProfileUpdatePage.tsx`
   - Added cache clearing after upload (lines 768-776)
   - Added reload state in navigation (lines 783-787)

2. `src/pages/PatientDashboardPage.tsx`
   - Added reload signal detection (lines 156-163)
   - Simplified caching logic (lines 162-169)
   - Enhanced manual refresh (lines 219-228)

### Key Functions
- `uploadFiles()` - Clears cache after upload
- `refreshPatientData()` - Clears cache before refresh
- `usePatientReports()` - Hook that manages reports cache

### Cache Keys
```javascript
const cacheKey = `patient_reports_cache_${patientId}`;
```

### Navigation State
```javascript
navigate('/patient-dashboard', { 
  state: { profileUpdated: true, reloadData: true } 
});
```

---

**Date:** 2025-02-09  
**Issue:** Patient uploads not showing immediately  
**Status:** ✅ FIXED  
**Test Time:** ~2 minutes












