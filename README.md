# 🏥 EaseHealth - Modern Healthcare Management Platform

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.57.4-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)

A comprehensive, modern healthcare management platform built with React, TypeScript, and Supabase. EaseHealth provides seamless appointment booking, patient management, and healthcare administration with enterprise-grade security and accessibility.

## 🌟 MVP Features (Implemented)

### 🔐 **Role-Based Access Control (RBAC)** ✅
- **Multi-role system**: Patient, Doctor, and Admin roles with granular permissions
- **Route protection**: `RBACRoute` component ensures only authorized roles can access specific dashboards
- **Login validation**: Strict role verification on login - prevents users from accessing wrong dashboards
- **User-friendly error messages**: Clear guidance when users attempt unauthorized access
- **Audit logging**: Tracks unauthorized access attempts and security events
- **Database-level security**: Row Level Security (RLS) policies enforce access control
- **Role-specific navigation**: Features menu adapts based on user role and authentication status

### 👥 **Multi-Role Dashboard System** ✅
- **Patient Dashboard**: Personalized health tracking, appointment management, medical history, and profile management
- **Doctor Dashboard**: Schedule management, patient records, and appointment handling
- **Admin Dashboard**: System administration, user management, analytics, and pre-registration monitoring

### 📅 **Smart Appointment Booking** ✅
- Real-time availability checking
- Multi-step booking process with validation
- Automatic confirmation and reminders
- Doctor specialty filtering
- Time slot management
- Queue token generation for pre-registered patients

### 👤 **Patient Management** ✅
- **Pre-Registration**: Complete patient onboarding with Aadhaar-based verification
- **Profile Update**: Editable patient profile with clear distinction between read-only and editable sections
  - Account & Identity (read-only): Patient ID, registration date, email, phone, DOB, gender
  - Contact & Address (editable): Address, city, state (dropdown with Indian states)
  - Medical Details (editable): Medical history, allergies, current medications, insurance info
  - Emergency Contacts (editable): Emergency contact information
  - Document Management: Upload and manage ID proofs, lab reports, and profile images
- **Document Upload**: Secure file storage with Supabase Storage
- **Queue Management**: Digital queue tokens for efficient patient flow

### 🔐 **Advanced Security & Authentication** ✅
- Supabase-powered authentication
- Role-based access control (RBAC) with strict enforcement
- Protected routes with automatic redirects
- Session management and recovery
- Email verification system
- Password reset functionality
- DPDP compliance ready
- User-friendly error handling for duplicate email registrations
- Automatic form mode switching (signup → login) on duplicate email detection

### 🌐 **Internationalization (i18n)** ✅
- **Multi-language support**: English and Hindi (हिंदी)
- **Complete translation coverage**: All pages, forms, error messages, and UI elements
- **Real-time language switching**: Instant translation without page refresh
- **Accessibility**: Screen reader compatible translations
- **Localized content**: 
  - Homepage sections (Trust & Compliance, Testimonials, FAQs)
  - Login/Signup page (all elements and error messages)
  - Patient Profile Update page
  - All navigation elements
  - Form labels, placeholders, and validation messages

### ♿ **Accessibility & UX** ✅
- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- Dark mode support with system preference detection
- Multi-language support (English/Hindi)
- Progressive enhancement
- Skip links for keyboard users
- Focus management and visible focus indicators
- Semantic HTML structure

### 📊 **Analytics & Insights** ✅
- Patient health metrics visualization
- Appointment trends and analytics
- Real-time dashboard statistics
- Professional chart integration
- Admin analytics for system monitoring

### 🎨 **Modern UI/UX** ✅
- **Responsive Design**: Mobile-first approach, optimized for all device sizes
- **Dark Mode**: System preference detection with manual toggle option
- **Gradient Buttons**: Consistent, modern button styling across the application
- **Visual Hierarchy**: Clear distinction between read-only and editable sections
- **Indian States Dropdown**: Pre-populated dropdown for state selection
- **Date Formatting**: DD-MM-YYYY format for date display
- **Form Validation**: Real-time validation with user-friendly error messages
- **Loading States**: Proper loading indicators during async operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/srabbas1701/EaseHealth-AI.git
   cd EaseHealth-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env-template.txt .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db push
   
   # Or manually run SQL files in supabase/migrations/
   # Key migrations include:
   # - RBAC system (roles, admins table, audit_logs)
   # - Patient pre-registration tables
   # - Queue token generation
   # - RLS policies
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open in Browser**
   