# 🏥 EaseHealth - Modern Healthcare Management Platform

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.57.4-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)

A comprehensive, modern healthcare management platform built with React, TypeScript, and Supabase. EaseHealth provides seamless appointment booking, patient management, and healthcare administration with enterprise-grade security and accessibility.

## 🌟 Features

### 👥 **Multi-Role Dashboard System**
- **Patient Dashboard**: Personalized health tracking, appointment management, and medical history
- **Doctor Dashboard**: Schedule management, patient records, and appointment handling
- **Admin Dashboard**: System administration, user management, and analytics

### 📅 **Smart Appointment Booking**
- Real-time availability checking
- Multi-step booking process with validation
- Automatic confirmation and reminders
- Doctor specialty filtering
- Time slot management

### 🔐 **Advanced Security & Authentication**
- Supabase-powered authentication
- Role-based access control (RBAC)
- Protected routes with automatic redirects
- Session management and recovery
- DPDP compliance ready

### ♿ **Accessibility & UX**
- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- Dark mode support
- Multi-language support (English/Hindi)
- Progressive enhancement

### 📊 **Analytics & Insights**
- Patient health metrics visualization
- Appointment trends and analytics
- Real-time dashboard statistics
- Professional chart integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/easehealth.git
   cd easehealth
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
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open in Browser**
   ```
   http://localhost:5173
   ```

## 🏗️ Project Structure

```
easehealth/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AccessibilityAnnouncer.tsx
│   │   ├── AuthModal.tsx
│   │   ├── Navigation.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── pages/              # Application pages
│   │   ├── PatientDashboardPage.tsx
│   │   ├── SmartAppointmentBookingPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useDarkMode.ts
│   ├── contexts/           # React contexts
│   │   └── LanguageContext.tsx
│   ├── utils/              # Utility functions
│   │   ├── supabase.ts
│   │   └── ...
│   └── translations/       # Internationalization
│       ├── en.ts
│       └── hi.ts
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🎯 Key Features Deep Dive

### 🔐 **Authentication System**
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Role-Based Access**: Different dashboards for patients, doctors, and admins
- **Session Management**: Persistent sessions with automatic recovery
- **Security**: Enterprise-grade authentication with Supabase

### 📱 **Responsive Design**
- **Mobile-First**: Optimized for all device sizes
- **Progressive Enhancement**: Works without JavaScript
- **Touch-Friendly**: Optimized for mobile interactions
- **Cross-Browser**: Compatible with all modern browsers

### 🌐 **Internationalization**
- **Multi-Language**: English and Hindi support
- **RTL Ready**: Right-to-left language support
- **Dynamic Switching**: Real-time language switching
- **Accessibility**: Screen reader compatible translations

### 📊 **Data Visualization**
- **Health Metrics**: Visual representation of patient health data
- **Appointment Trends**: Historical appointment analytics
- **Real-Time Stats**: Live dashboard statistics
- **Interactive Charts**: Professional chart integration

## 🛠️ Technology Stack

### **Frontend**
- **React 18.3.1** - Modern UI library with hooks and concurrent features
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.2** - Fast build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **React Router 7.9.1** - Client-side routing

### **Backend & Database**
- **Supabase 2.57.4** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security
- **Real-time subscriptions** - Live data updates

### **UI & Icons**
- **Lucide React** - Beautiful, customizable icons
- **Custom Components** - Accessible, reusable UI components
- **Dark Mode** - System preference detection
- **Responsive Design** - Mobile-first approach

### **Development Tools**
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **Vite** - Fast development and building
- **PostCSS** - CSS processing

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
npx supabase start   # Start local Supabase
npx supabase db push # Push migrations
npx supabase gen types # Generate TypeScript types
```

## 🔧 Configuration

### **Environment Variables**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Tailwind Configuration**
Custom color palette and design system in `tailwind.config.js`:
- Primary: `#0075A2` (Blue)
- Secondary: `#0A2647` (Dark Blue)
- Accent: `#0EA5E9` (Light Blue)

### **TypeScript Configuration**
Strict type checking enabled with custom paths and module resolution.

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Netlify**
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### **Manual Deployment**
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📚 Documentation

- **[Development Standards](DEVELOPMENT_STANDARDS.md)** - Coding guidelines and best practices
- **[Quick Reference](QUICK_REFERENCE.md)** - Common commands and shortcuts
- **[Testing Guide](TESTING_GUIDE.md)** - Testing strategies and examples
- **[Storage Setup Guide](STORAGE_SETUP_GUIDE.md)** - Supabase storage configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow the [Development Standards](DEVELOPMENT_STANDARDS.md)
- Write accessible, semantic HTML
- Use TypeScript for type safety
- Follow React best practices
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For providing an excellent backend-as-a-service platform
- **React Team** - For the amazing React library
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide** - For the beautiful icon set
- **Vite** - For the fast build tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/easehealth/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/easehealth/discussions)
- **Email**: support@easehealth.com

## 🔮 Roadmap

- [ ] **Mobile App** - React Native mobile application
- [ ] **Telemedicine** - Video consultation features
- [ ] **AI Integration** - Health insights and recommendations
- [ ] **Payment Gateway** - Integrated payment processing
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **API Documentation** - Comprehensive API docs
- [ ] **Multi-tenant** - Support for multiple healthcare providers

---

<div align="center">

**Built with ❤️ for better healthcare**

[🌟 Star this repo](https://github.com/yourusername/easehealth) | [🐛 Report Bug](https://github.com/yourusername/easehealth/issues) | [💡 Request Feature](https://github.com/yourusername/easehealth/issues)

</div>