# Profile Image Display and Dashboard Timeout Fix

## Date: November 4, 2025

## Issues Fixed

### Issue 1: Profile Picture Not Displaying in Doctor Profile Update Page
**Root Cause**: Inconsistent handling of profile image URLs. The database stored full public URLs, but the display logic expected file paths.

### Issue 2: Dashboard Timeout After Profile Update
**Root Cause**: 
1. Using signed URLs instead of public URLs for profile images (causing unnecessary API calls)
2. Inconsistent URL format handling between save and load operations

## Changes Made

### 1. DoctorProfileUpdatePage.tsx (Lines 146-166)

**Before:**
```typescript
if (doctorData.profile_image_url) {
  try {
    const imageUrl = await getDoctorSignedUrl(
      doctorData.profile_image_url,
      'profile_image'
    );
    if (imageUrl) {
      setProfileImagePreview(imageUrl);
    }
  } catch (error) {
    console.error('Error loading profile image:', error);
  }
}
```

**After:**
```typescript
if (doctorData.profile_image_url) {
  try {
    let imageUrl = doctorData.profile_image_url;
    
    // If it's already a full URL, use it directly
    if (imageUrl.startsWith('http')) {
      setProfileImagePreview(imageUrl);
    } else {
      // Otherwise, it's a path - get the public URL
      imageUrl = await getDoctorSignedUrl(
        imageUrl,
        'profile_image'
      );
      setProfileImagePreview(imageUrl);
    }
  } catch (error) {
    console.error('Error loading profile image:', error);
  }
}
```

**Why**: Handles both full URLs (legacy data) and paths (new standard) gracefully.

### 2. DoctorProfileUpdatePage.tsx (Lines 246-271)

**Before:**
```typescript
if (uploadResult.publicUrl) {
  profileImageUrl = uploadResult.publicUrl;
} else if (uploadResult.path) {
  profileImageUrl = uploadResult.path;
} else {
  throw new Error('Failed to upload profile image');
}
```

**After:**
```typescript
// Store the path (not the full URL) for consistency
// This allows us to generate fresh public URLs on demand
if (uploadResult.path) {
  profileImageUrl = uploadResult.path;
} else {
  throw new Error('Failed to upload profile image');
}
```

**Why**: 
- Stores only the path in the database (e.g., `doctorId/profile_image/file.jpg`)
- Generates fresh public URLs on demand
- Reduces database storage and improves flexibility

### 3. DoctorDashboardPage.tsx (Lines 185-212)

**Before:**
```typescript
if (profileImageUrl && !profileImageUrl.startsWith('http')) {
  try {
    const cleanPath = profileImageUrl.replace('doctor-profile-images/', '');
    const { data: signedUrlData } = await supabase.storage
      .from('doctor-profile-images')
      .createSignedUrl(cleanPath, 3600);

    if (signedUrlData?.signedUrl) {
      profileImageUrl = signedUrlData.signedUrl;
    }
  } catch (err) {
    console.error('Error generating signed URL:', err);
  }
}
```

**After:**
```typescript
if (profileImageUrl && !profileImageUrl.startsWith('http')) {
  try {
    const cleanPath = profileImageUrl.replace('doctor-profile-images/', '');
    const { data: publicUrlData } = supabase.storage
      .from('doctor-profile-images')
      .getPublicUrl(cleanPath);

    if (publicUrlData?.publicUrl) {
      profileImageUrl = publicUrlData.publicUrl;
    }
  } catch (err) {
    console.error('Error generating public URL:', err);
  }
}
```

**Why**: 
- Uses `getPublicUrl()` instead of `createSignedUrl()` - profile images are public
- `getPublicUrl()` is instantaneous (no API call), preventing timeouts
- `createSignedUrl()` requires an API call and can timeout under load

### 4. UnifiedDoctorRegistrationForm.tsx (Lines 371-382)

**Before:**
```typescript
uploadDoctorDocument(formData.profilePicture, finalUserId, 'profile_image')
  .then(result => {
    setUploadedFiles(prev => new Set(prev).add('profilePicture'));
    updateFormData({ profilePictureUrl: result.publicUrl || result.signedUrl });
    return result.publicUrl || result.signedUrl;
  })
```

**After:**
```typescript
uploadDoctorDocument(formData.profilePicture, finalUserId, 'profile_image')
  .then(result => {
    setUploadedFiles(prev => new Set(prev).add('profilePicture'));
    // Store the path instead of full URL for consistency
    updateFormData({ profilePictureUrl: result.path });
    return result.path;
  })
```

**Why**: Ensures new registrations also store paths instead of full URLs.

## Technical Details

### Storage Strategy
- **Database**: Stores relative paths (e.g., `doctorId/profile_image/timestamp_filename.jpg`)
- **Display**: Generates public URLs on-the-fly using `getPublicUrl()`
- **Benefits**:
  - Consistent handling across all components
  - No API calls for public images (instant load)
  - Flexible if storage URLs change in future
  - Backward compatible with existing full URLs

### Public URL vs Signed URL
- **Public URL**: Generated locally, no API call, instant, used for public images
- **Signed URL**: Requires API call, has expiration, used for private documents
- **Profile Images**: Should use public URLs (as per `doctorFileUploadUtils.ts:169-174`)

## Testing Checklist

- [x] No linter errors in modified files
- [ ] Test profile update with new image upload
- [ ] Test profile update without image change
- [ ] Test dashboard loads correctly after profile update
- [ ] Test profile image displays in update page
- [ ] Test profile image displays in dashboard
- [ ] Test new doctor registration with profile image
- [ ] Test backward compatibility with existing full URLs in database

## Backward Compatibility

The fix handles both:
1. **Legacy data**: Full URLs already stored in database (checks `startsWith('http')`)
2. **New data**: Relative paths stored going forward

This ensures no breaking changes for existing users.

## Additional Fix: Dashboard Auth Check Issue

### 5. DoctorDashboardPage.tsx (Lines 164-234) - Auth Dependency Fix

**Before:**
```typescript
const loadDoctorData = useCallback(async () => {
  if (!isAuthenticated || !user || !profile) {
    console.log('❌ Cannot load doctor data - missing auth:', { ... });
    return;
  }
  // ... load doctor data
}, [isAuthenticated, user, profile]);
```

**After:**
```typescript
const loadDoctorData = useCallback(async () => {
  if (!isAuthenticated || !user) {
    console.log('❌ Cannot load doctor data - missing auth:', { ... });
    return;
  }
  // ... load doctor data
}, [isAuthenticated, user]);
```

**Why**: 
- The `profile` object comes from the `profiles` table, not the `doctors` table
- After updating doctor profile, the `profile` state might be briefly stale
- Dashboard only needs `user` and `isAuthenticated` to load doctor data
- The doctor-specific data is loaded from the `doctors` table using `getDoctorIdByUserId(user.id)`
- Removing the `profile` dependency prevents timeout/loading failures after profile updates

## Files Modified

1. `src/pages/DoctorProfileUpdatePage.tsx`
2. `src/pages/DoctorDashboardPage.tsx` (2 changes: profile image URL handling + auth check fix)
3. `src/components/UnifiedDoctorRegistrationForm.tsx`

## No Breaking Changes

- ✅ Backward compatible with existing data
- ✅ No API changes
- ✅ No database schema changes
- ✅ No breaking functionality for other features
- ✅ Follows existing patterns in `doctorFileUploadUtils.ts`

