# Patient Pre-Registration System Testing Guide

## 🎯 **Next Steps - Testing Your Implementation**

Now that you have successfully set up the database and storage system, here's what you need to do to test and complete the integration:

### **Step 1: Test the Database Setup**

1. **Verify Table Creation:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT table_name, column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'patient_pre_registrations'
   ORDER BY ordinal_position;
   ```

2. **Test Data Insertion:**
   ```sql
   -- Insert a test record (replace with your user ID)
   INSERT INTO patient_pre_registrations (
     user_id,
     full_name,
     age,
     gender,
     phone_number,
     city,
     state,
     symptoms,
     consent_agreed,
     status
   ) VALUES (
     'your-user-id-here',
     'Test User',
     30,
     'male',
     '9876543210',
     'Mumbai',
     'maharashtra',
     'Testing symptoms',
     true,
     'pending'
   );
   ```

### **Step 2: Test Storage Buckets**

1. **Verify Buckets Exist:**
   ```sql
   SELECT id, name, public, file_size_limit, allowed_mime_types 
   FROM storage.buckets 
   WHERE id IN ('lab-reports', 'aadhaar-documents');
   ```

2. **Test File Upload (Manual):**
   - Go to Supabase Dashboard → Storage
   - Try uploading a test PDF/JPEG file to each bucket
   - Verify files appear in the correct user folder

### **Step 3: Test React Application**

1. **Start Your Development Server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Test the Pre-Registration Form:**
   - Navigate to `/patient-pre-registration`
   - Fill out the form completely
   - Upload test PDF/JPEG files
   - Submit the form

3. **Expected Behavior:**
   - ✅ File validation (only PDF/JPEG, max 10MB)
   - ✅ Progress bars during upload
   - ✅ Form submission with file URLs stored in database
   - ✅ Success message displayed

### **Step 4: Verify Data Storage**

1. **Check Database Records:**
   ```sql
   SELECT * FROM patient_pre_registrations 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

2. **Check File Storage:**
   - Go to Supabase Dashboard → Storage
   - Check both buckets for uploaded files
   - Verify files are in user-specific folders

### **Step 5: Test File Access**

1. **Test File Download:**
   ```sql
   -- Get signed URL for a file
   SELECT 
     lab_reports_url,
     aadhaar_url
   FROM patient_pre_registrations 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

2. **Verify File Permissions:**
   - Try accessing files from different user accounts
   - Ensure users can only access their own files

## 🔧 **Troubleshooting Common Issues**

### **Issue 1: File Upload Fails**
**Symptoms:** Upload progress stays at 0% or error message appears
**Solutions:**
- Check browser console for errors
- Verify Supabase environment variables are set
- Ensure storage buckets exist and are properly configured
- Check file size and type restrictions

### **Issue 2: Database Insert Fails**
**Symptoms:** Form submission fails with database error
**Solutions:**
- Verify table exists and has correct structure
- Check RLS policies allow inserts
- Ensure user is authenticated
- Verify all required fields are provided

### **Issue 3: Files Not Accessible**
**Symptoms:** Can't download or view uploaded files
**Solutions:**
- Check storage bucket policies
- Verify file paths are correct
- Test with signed URLs for private access
- Ensure user has proper permissions

### **Issue 4: Form Validation Errors**
**Symptoms:** Form won't submit despite filled fields
**Solutions:**
- Check console for validation errors
- Verify all required fields are completed
- Ensure file types are PDF or JPEG
- Check file size limits

## 📊 **Testing Checklist**

### **Database Testing:**
- [ ] Table created successfully
- [ ] Can insert test records
- [ ] RLS policies working correctly
- [ ] Auto-generated timestamps working
- [ ] Queue token generation working

### **Storage Testing:**
- [ ] Buckets created and accessible
- [ ] File upload works for both document types
- [ ] File validation working (type and size)
- [ ] User-specific folders created
- [ ] File permissions working correctly

### **React App Testing:**
- [ ] Form loads without errors
- [ ] File selection works
- [ ] File validation displays correct errors
- [ ] Upload progress bars work
- [ ] Form submission completes successfully
- [ ] Success page displays
- [ ] Error handling works properly

### **Integration Testing:**
- [ ] End-to-end flow works completely
- [ ] Files uploaded to correct storage buckets
- [ ] Database records created with file URLs
- [ ] User can only access their own data
- [ ] Multiple users can use system simultaneously

## 🚀 **Performance Testing**

1. **File Upload Performance:**
   - Test with different file sizes (1MB, 5MB, 10MB)
   - Test with multiple files simultaneously
   - Monitor upload speed and progress

2. **Concurrent Users:**
   - Test with multiple users uploading simultaneously
   - Verify no data conflicts or permission issues
   - Check system responsiveness

3. **Error Recovery:**
   - Test network interruption during upload
   - Test invalid file types
   - Test oversized files
   - Verify proper error messages

## 📝 **Production Readiness Checklist**

### **Security:**
- [ ] All storage buckets are private
- [ ] RLS policies properly configured
- [ ] File validation working
- [ ] User authentication required
- [ ] No sensitive data in URLs

### **Performance:**
- [ ] File size limits enforced
- [ ] Upload progress indicators working
- [ ] Error handling comprehensive
- [ ] Loading states appropriate

### **User Experience:**
- [ ] Clear error messages
- [ ] Intuitive file upload interface
- [ ] Progress feedback during uploads
- [ ] Success confirmation
- [ ] Mobile-responsive design

## 🎉 **You're Ready!**

Once you've completed these tests and everything is working correctly, your Patient Pre-Registration system with document upload functionality will be fully operational!

**Next features you might want to add:**
- File preview functionality
- Document verification status
- Admin dashboard to view submissions
- Email notifications
- SMS queue token delivery
- File download functionality for users
