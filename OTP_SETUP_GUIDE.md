# OTP Setup Guide for EaseHealth

## 🔒 SECURITY UPDATE: User Validation Added

**IMPORTANT**: The OTP system now includes **user validation** to prevent unauthorized password resets. Only registered users (with valid email/phone in the `patients` table) can reset their passwords.

## Current Status: Demo Mode

The OTP system is currently in **demo mode** - it simulates sending OTPs but doesn't actually send them to your phone/email. This is why you're not receiving the OTPs.

## Quick Test Solution

For immediate testing, the OTP is displayed in the browser console. When you request an OTP:

1. **Use a registered email/phone** (must exist in the `patients` table)
2. Open browser console (F12)
3. Look for: `🔑 DEMO OTP for [phone/email]: [6-digit-code]`
4. Use that OTP to complete the reset process

## Security Features

### ✅ User Validation
- **Email Check**: Validates email exists in `patients` table
- **Phone Check**: Validates phone number exists in `patients` table
- **OTP Verification**: Ensures OTP was verified for the correct contact
- **Mismatch Prevention**: Prevents using OTP from one contact to reset another

### ✅ Error Messages
- `"This email is not registered in our system"`
- `"This phone number is not registered in our system"`
- `"OTP verification required"`
- `"Email/Phone mismatch with OTP verification"`

### ✅ Database Queries
The system queries the `patients` table to verify:
```sql
SELECT id, user_id, email, phone_number 
FROM patients 
WHERE email = ? OR phone_number = ?
```

## Production Setup Options

### Option 1: TextLocal SMS (Recommended for India)

**Advantages:**
- Good for Indian phone numbers
- Affordable pricing
- Easy setup

**Setup Steps:**
1. Sign up at [TextLocal](https://www.textlocal.in/)
2. Get your API key from dashboard
3. Add to your `.env.local` file:
   ```
   REACT_APP_TEXTLOCAL_API_KEY=your_api_key_here
   REACT_APP_TEXTLOCAL_SENDER=TXTLCL
   ```
4. Uncomment the TextLocal section in `src/utils/otpUtils.ts`

### Option 2: Twilio SMS (Global)

**Advantages:**
- Works worldwide
- Reliable delivery
- Good documentation

**Setup Steps:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get Account SID, Auth Token, and Phone Number
3. Add to your `.env.local` file:
   ```
   REACT_APP_TWILIO_ACCOUNT_SID=your_account_sid
   REACT_APP_TWILIO_AUTH_TOKEN=your_auth_token
   REACT_APP_TWILIO_PHONE_NUMBER=your_twilio_phone
   ```
4. Uncomment the Twilio section in `src/utils/otpUtils.ts`

### Option 3: Supabase Edge Functions (Recommended)

**Advantages:**
- Integrated with your existing Supabase setup
- Server-side security
- Customizable

**Setup Steps:**
1. Create Supabase Edge Function for SMS
2. Create Supabase Edge Function for Email
3. Uncomment the Supabase sections in `src/utils/otpUtils.ts`

## Email Setup Options

### Option 1: SendGrid (Recommended)

**Setup Steps:**
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Get API key
3. Add to `.env.local`:
   ```
   REACT_APP_SENDGRID_API_KEY=your_api_key
   REACT_APP_FROM_EMAIL=noreply@easehealth.com
   ```
4. Uncomment SendGrid section in `src/utils/otpUtils.ts`

### Option 2: Supabase Built-in Email

**Setup Steps:**
1. Configure email templates in Supabase dashboard
2. Uncomment Supabase email section in `src/utils/otpUtils.ts`

## Implementation Steps

1. **Choose your SMS service** (TextLocal recommended for India)
2. **Choose your email service** (SendGrid recommended)
3. **Get API credentials** from chosen services
4. **Create `.env.local` file** with credentials
5. **Uncomment the relevant sections** in `src/utils/otpUtils.ts`
6. **Test the OTP flow** with real phone/email

## Cost Estimates

- **TextLocal**: ~₹0.30 per SMS in India
- **Twilio**: ~$0.0075 per SMS globally
- **SendGrid**: Free tier: 100 emails/day

## Security Notes

- Never commit API keys to version control
- Use environment variables for all credentials
- Consider rate limiting for OTP requests
- Implement proper error handling

## Testing

After setup:
1. Try OTP via email first (easier to test)
2. Then test SMS OTP
3. Verify OTP expiration (10 minutes)
4. Test resend functionality
5. Test invalid OTP handling

## Support

If you need help with setup, provide:
1. Which service you chose
2. Any error messages
3. Console logs
4. Your phone number format (+91XXXXXXXXXX)
