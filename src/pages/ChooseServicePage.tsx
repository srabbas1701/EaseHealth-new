import React from 'react';
import { Calendar, FileText, ArrowRight, Users, Clock, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';

// Auth props interface
interface AuthProps {
  user: any;
  session: any;
  profile: any;
  userState: 'new' | 'returning' | 'authenticated';
  isAuthenticated: boolean;
  handleLogout: () => Promise<void>;
}

function ChooseServicePage({ user, session, profile, userState, isAuthenticated, handleLogout }: AuthProps) {
  const { language } = useLanguage();
  const { t } = useTranslations(language);

  const services = [
    {
      id: 'book-appointment',
      title: t('chooseService.bookAppointment.title'),
      description: t('chooseService.bookAppointment.description'),
      icon: Calendar,
      to: '/smart-appointment-booking',
      features: [
        t('chooseService.bookAppointment.features.0'),
        t('chooseService.bookAppointment.features.1'),
        t('chooseService.bookAppointment.features.2'),
        t('chooseService.bookAppointment.features.3')
      ],
      color: 'from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]'
    },
    {
      id: 'pre-register',
      title: t('chooseService.preRegister.title'),
      description: t('chooseService.preRegister.description'),
      icon: FileText,
      to: '/patient-pre-registration',
      features: [
        t('chooseService.preRegister.features.0'),
        t('chooseService.preRegister.features.1'),
        t('chooseService.preRegister.features.2'),
        t('chooseService.preRegister.features.3')
      ],
      color: 'from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7]'
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: t('chooseService.benefits.fast'),
      description: t('chooseService.benefits.fastDesc')
    },
    {
      icon: Shield,
      title: t('chooseService.benefits.secure'),
      description: t('chooseService.benefits.secureDesc')
    },
    {
      icon: Users,
      title: t('chooseService.benefits.smart'),
      description: t('chooseService.benefits.smartDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <Navigation 
        user={user}
        session={session}
        profile={profile}
        userState={userState}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 transition-colors mb-8 focus-ring"
        >
          <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
{t('nav.home')}
        </Link>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] dark:text-gray-100 leading-tight mb-4">
            {t('chooseService.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto">
            {t('chooseService.subtitle')}
          </p>
        </div>

        {/* Service Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {services.map((service) => (
            <Link
              key={service.id}
              to={service.to}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 focus-ring block"
            >
              <div className="flex items-start space-x-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 mb-3 group-hover:text-[#0075A2] dark:group-hover:text-[#0EA5E9] transition-colors">
                    {service.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  
                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-[#00D4AA] dark:text-[#06D6A0] mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA */}
                  <div className="flex items-center text-[#0075A2] dark:text-[#0EA5E9] font-medium group-hover:text-[#0A2647] dark:group-hover:text-gray-100 transition-colors">
                    {t('chooseService.getStarted')}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 text-center mb-8">
            {t('chooseService.benefits.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] dark:from-[#0EA5E9] to-[#0A2647] dark:to-[#0284C7] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0A2647] dark:text-gray-100 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {userState === 'authenticated' 
              ? t('chooseService.help.authenticated')
              : t('chooseService.help.guest')
            }
          </p>
          <Link 
            to="/#contact" 
            className="inline-flex items-center text-[#0075A2] dark:text-[#0EA5E9] hover:text-[#0A2647] dark:hover:text-gray-100 font-medium transition-colors focus-ring"
          >
            {t('chooseService.help.contactSupport')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ChooseServicePage;