import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Clock, 
  Bell, 
  Shield, 
  ChevronDown, 
  Play, 
  Check, 
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Heart,
  Brain,
  Zap
} from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userState, setUserState] = useState<'new' | 'returning' | 'authenticated'>('new');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Simulate user state changes for demo
  useEffect(() => {
    const states: ('new' | 'returning' | 'authenticated')[] = ['new', 'returning', 'authenticated'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % states.length;
      setUserState(states[index]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDynamicCTA = () => {
    switch (userState) {
      case 'returning':
        return (
          <button className="bg-white text-[#0075A2] px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-[#E8E8E8]">
            Log In
          </button>
        );
      case 'authenticated':
        return (
          <button className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
            My Dashboard
          </button>
        );
      default:
        return (
          <button className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
            Get Started
          </button>
        );
    }
  };

  const benefits = [
    {
      icon: Calendar,
      title: "Smart Appointment Booking",
      description: "Optimized slots, instant confirmation, and SMS/WhatsApp reminders.",
      image: "smart appointment booking.png"
    },
    {
      icon: FileText,
      title: "Digital Pre-Registration",
      description: "Aadhaar-based check-in and secure document upload — skip waiting lines.",
      image: "digital pre-registration.png"
    },
    {
      icon: Clock,
      title: "Queue Dashboard",
      description: "Get live updates on patient flow, queue status, and predicted wait times.",
      image: "queqe dashboard.png"
    },
    {
      icon: Bell,
      title: "Medication & Follow-up Reminders",
      description: "Stay on track with timely alerts for prescriptions and follow-ups.",
      image: "follow up reminders.png"
    },
    {
      icon: Shield,
      title: "Consent & Secure Data",
      description: "Your health records are encrypted, consent-logged, and fully DPDP-compliant.",
      image: null
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Book Appointment",
      description: "Choose doctor & slot with instant confirmation."
    },
    {
      number: "02", 
      title: "Pre-Register",
      description: "Upload Aadhaar & documents, get your digital queue token."
    },
    {
      number: "03",
      title: "Visit & Care", 
      description: "Walk in, consult, and receive reminders & digital prescriptions."
    }
  ];

  const testimonials = [
    {
      text: "Booking was quick and I got SMS reminders before my visit.",
      author: "Priya S.",
      location: "Mumbai"
    },
    {
      text: "Pre-registration saved me 30 minutes at the clinic.",
      author: "Rajesh K.", 
      location: "Delhi"
    },
    {
      text: "I could track my turn on the app — no more waiting blindly.",
      author: "Anjali M.",
      location: "Bangalore"
    }
  ];

  const faqs = [
    {
      question: "Is my data secure?",
      answer: "Yes. EasyHealth AI complies with India's DPDP Act with AI-enhanced encryption & intelligent audit logs."
    },
    {
      question: "Do I need Aadhaar?",
      answer: "Aadhaar makes pre-registration seamless, but you can also sign up with mobile number."
    },
    {
      question: "Which doctors can I book with?",
      answer: "Only partnered doctors & clinics listed on EaseHealth."
    },
    {
      question: "Does the app send reminders?",
      answer: "Yes, you'll get SMS/WhatsApp alerts for appointments and follow-ups."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#0A2647]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-lg flex items-center justify-center relative">
                <Heart className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#00D4AA] to-[#0075A2] rounded-full flex items-center justify-center">
                  <Brain className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0A2647]">EasyHealth AI</h1>
                <p className="text-xs text-gray-600">Your Health. Simplified.</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#home" className="text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Home</a>
              <div className="relative group">
                <button className="flex items-center text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">
                  Features <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-4 space-y-3">
                    <a href="#features" className="block text-sm hover:text-[#0075A2] transition-colors">• Appointment Booking</a>
                    <a href="#features" className="block text-sm hover:text-[#0075A2] transition-colors">• Digital Pre-Registration</a>
                    <a href="#features" className="block text-sm hover:text-[#0075A2] transition-colors">• Queue Dashboard</a>
                    <a href="#features" className="block text-sm hover:text-[#0075A2] transition-colors">• Smart Reminders</a>
                    <a href="#features" className="block text-sm hover:text-[#0075A2] transition-colors">• Secure Consent Management</a>
                  </div>
                </div>
              </div>
              <a href="#how-it-works" className="text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">How It Works</a>
              <a href="#testimonials" className="text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Testimonials</a>
              <a href="#faqs" className="text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">FAQs</a>
              <a href="#contact" className="text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Contact</a>
            </nav>

            {/* Dynamic CTA */}
            <div className="hidden lg:block">
              {getDynamicCTA()}
            </div>

            {/* Mobile menu button */}
            <button 
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-[#0A2647] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-[#0A2647] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-[#0A2647] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden bg-white border-t border-[#E8E8E8] py-4">
              <div className="space-y-4">
                <a href="#home" className="block text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Home</a>
                <a href="#features" className="block text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Features</a>
                <a href="#how-it-works" className="block text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">How It Works</a>
                <a href="#testimonials" className="block text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Testimonials</a>
                <a href="#faqs" className="block text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">FAQs</a>
                <a href="#contact" className="block text-[#0A2647] hover:text-[#0075A2] transition-colors font-medium">Contact</a>
                <div className="pt-4 border-t border-[#E8E8E8]">
                  {getDynamicCTA()}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-white to-[#F6F6F6] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2647] leading-tight mb-6">
                Your Health.{' '}
                <span className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] bg-clip-text text-transparent">
                  Simplified.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                From booking your appointment to reminders and real-time queue updates — EasyHealth AI makes doctor visits effortless with intelligent automation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-[#0075A2] to-[#0A2647] text-white px-8 py-4 rounded-lg font-medium text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                  Book Appointment Now
                </button>
                <button className="border-2 border-[#E8E8E8] text-[#0A2647] px-8 py-4 rounded-lg font-medium text-lg hover:border-[#0075A2] hover:text-[#0075A2] transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/digital pre-registration.png" 
                  alt="Digital Pre-Registration Interface" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-full opacity-10"></div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-full opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] mb-4">
              Why Choose EasyHealth AI?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience healthcare the modern way with AI-powered features designed for Indian patients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] group"
              >
                {benefit.image ? (
                  <div className="mb-6">
                    <img 
                      src={`/${benefit.image}`} 
                      alt={benefit.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <div className="relative">
                      <benefit.icon className="w-8 h-8 text-white" />
                      {benefit.title.includes('Secure') && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#00D4AA] to-[#0075A2] rounded-full flex items-center justify-center">
                          <Zap className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#0A2647] mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust and Compliance Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] mb-4">
              Trust and Compliance
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your data security and privacy are our top priorities, backed by industry-leading compliance standards
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F6F6F6] rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] group text-center">
              <div className="mb-6">
                <img 
                  src="/dpdp compliance.png" 
                  alt="DPDP Compliance"
                  className="w-full h-48 object-contain rounded-lg mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0A2647] mb-3">DPDP Compliance</h3>
              <p className="text-gray-600 leading-relaxed">Full compliance with India's Digital Personal Data Protection Act, ensuring your health data is handled with the highest security standards.</p>
            </div>
            
            <div className="bg-[#F6F6F6] rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] group text-center">
              <div className="mb-6">
                <img 
                  src="/India Data Residency.png" 
                  alt="India Data Residency"
                  className="w-full h-48 object-contain rounded-lg mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0A2647] mb-3">India Data Residency</h3>
              <p className="text-gray-600 leading-relaxed">Your data stays within India's borders, complying with local regulations and ensuring complete privacy and sovereignty.</p>
            </div>
            
            <div className="bg-[#F6F6F6] rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#E8E8E8] group text-center">
              <div className="mb-6">
                <img 
                  src="/Immutable Audit Logs.png" 
                  alt="Immutable Audit Logs"
                  className="w-full h-48 object-contain rounded-lg mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0A2647] mb-3">Immutable Audit Logs</h3>
              <p className="text-gray-600 leading-relaxed">Complete transparency with tamper-proof logging of all healthcare interactions, ensuring accountability and trust.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-[#F6F6F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] mb-4">
              Healthcare in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From booking to care, we've simplified the entire process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-[#F6F6F6] rounded-2xl p-8 text-center hover:bg-white hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#0075A2]">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2647] mb-4">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-[#0075A2] to-[#0A2647]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 lg:py-24 bg-[#F6F6F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] mb-4">
              What Patients Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real experiences from patients across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-[#E8E8E8]">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-full mr-1"></div>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[#0A2647]">{testimonial.author}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2647] mb-4">
              Got Questions?
            </h2>
            <p className="text-lg text-gray-600">
              Find answers to common questions about EaseHealth
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-[#E8E8E8] rounded-2xl overflow-hidden">
                <button
                  className="w-full p-6 text-left bg-[#F6F6F6] hover:bg-white transition-colors flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-bold text-[#0A2647]">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#0075A2] transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="p-6 bg-white border-t border-[#E8E8E8]">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#E8E8E8] border-t-4 border-gradient-to-r from-[#0075A2] to-[#0A2647]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0075A2] to-[#0A2647] rounded-lg flex items-center justify-center">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0A2647]">EaseHealth</h3>
                  <p className="text-sm text-gray-600">Your Health. Simplified.</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Making healthcare accessible and convenient for every Indian patient with cutting-edge AI technology and compassionate care.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </button>
                <button className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-[#0A2647] mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#home" className="block text-gray-600 hover:text-[#0075A2] transition-colors">Home</a>
                <a href="#features" className="block text-gray-600 hover:text-[#0075A2] transition-colors">Features</a>
                <a href="#how-it-works" className="block text-gray-600 hover:text-[#0075A2] transition-colors">How It Works</a>
                <a href="#testimonials" className="block text-gray-600 hover:text-[#0075A2] transition-colors">Testimonials</a>
                <a href="#" className="block text-gray-600 hover:text-[#0075A2] transition-colors">Privacy Policy</a>
                <a href="#contact" className="block text-gray-600 hover:text-[#0075A2] transition-colors">Contact</a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold text-[#0A2647] mb-4">Contact Us</h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">+91 80-EASEHEALTH</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">hello@easehealth.in</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                  <span className="text-sm">Bangalore, Karnataka<br />India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-300 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-600 text-sm mb-4 md:mb-0">
              © 2025 EaseHealth. Built with care for Indian patients.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-600" />
              <span>DPDP Compliant</span>
              <span className="mx-2">•</span>
              <Check className="w-4 h-4 text-green-600" />
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;