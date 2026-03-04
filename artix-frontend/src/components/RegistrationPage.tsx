import { useState, useEffect } from 'react';
import { ParticipantDetailsForm } from './ParticipantDetailsForm';
import { EventSelection } from './EventSelection';
import { TeamMembersSection } from './TeamMembersSection';
import { PaymentSection } from './PaymentSection';
import { ConfirmationPage } from './ConfirmationPage';
import { AdminModal } from './AdminModal';
import { Sun, Moon } from 'lucide-react';
import type { RegistrationFormData } from '../types/registration';

export function RegistrationPage({ fromLandingPage = false }) {
  const [showLanding, setShowLanding] = useState(fromLandingPage ? false : true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('artix_darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    phone: '',
    collegeName: '',
    yearOfStudy: '',
    branch: '',
    rollNumber: '',
    section: '',
    selectedIndividualEvents: [],
    teamSize: 0,
    teamMembers: [],
    paymentScreenshot: null,
  });

  const [registrationId, setRegistrationId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Save darkMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('artix_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const updateFormData = (updates: Partial<RegistrationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleGoBack = () => {
    window.location.href = '/';
  };

  if (showConfirmation) {
    return (
      <ConfirmationPage
        registrationId={registrationId}
        formData={formData}
      />
    );
  }

  if (showLanding) {
    return (
      <>
        <LandingPage2
          onStart={() => setShowLanding(false)}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          onOpenAdminModal={() => setShowAdminModal(true)}
        />
        <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} darkMode={darkMode} />
      </>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
      darkMode
        ? 'bg-black'
        : 'bg-white'
    }`}>
      {/* Video Background */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/videos/iot-animation.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for text readability */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-black/70' : 'bg-white/50'}`}></div>
      
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 md:p-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
            darkMode
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-yellow-400/30'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-400/30'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-6 h-6 md:w-7 md:h-7" /> : <Moon className="w-6 h-6 md:w-7 md:h-7" />}
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 relative z-20">
        {/* Back Button */}
        <button
          onClick={() => fromLandingPage ? handleGoBack() : setShowLanding(true)}
          className={`mb-6 flex items-center gap-2 px-5 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ${
            darkMode
              ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 border border-gray-700'
              : 'bg-white/40 text-gray-700 hover:bg-gray-300 border border-gray-400'
          }`}
        >
          ← Back {fromLandingPage ? 'to Landing Page' : 'to Home'}
        </button>

        <header className="text-center mb-12">
          <h1 className={`text-5xl md:text-6xl font-bold transition-colors duration-300 mb-6 ${
            darkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500'
          }`}>
            IoT esSENCE 2K26
          </h1>
          <div className={`space-y-3 transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-100'}`}>
            <p className={`text-2xl lg:text-3xl font-semibold ${
              darkMode ? 'text-blue-300' : 'text-blue-200'
            }`}>
              Department of Internet of Things (IoT)
            </p>
            <p className="text-xl lg:text-2xl font-semibold">Event Registration Form</p>
          </div>
        </header>

        <div className="space-y-6">
          <ParticipantDetailsForm
            formData={formData}
            updateFormData={updateFormData}
            darkMode={darkMode}
          />

          <EventSelection
            formData={formData}
            updateFormData={updateFormData}
            darkMode={darkMode}
          />

          {formData.selectedIndividualEvents.includes('project_expo') && (
            <TeamMembersSection
              formData={formData}
              updateFormData={updateFormData}
            />
          )}

          <PaymentSection
            formData={formData}
            updateFormData={updateFormData}
            darkMode={darkMode}
            onSubmitSuccess={(regId) => {
              setRegistrationId(regId);
              setShowConfirmation(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function LandingPage2({
  onStart,
  darkMode,
  onToggleTheme,
  onOpenAdminModal,
}: {
  onStart: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenAdminModal: () => void;
}) {
  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center px-4 overflow-hidden relative ${
      darkMode
        ? 'bg-black'
        : 'bg-white'
    }`}>
      {/* Video Background */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/videos/iot-animation.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for text readability */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-white/40'}`}></div>
      
      {/* Admin Button */}
      <div className="fixed top-4 left-4 z-[100] md:top-6 md:left-6">
        <button
          onClick={onOpenAdminModal}
          className={`inline-flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-lg font-bold text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
            darkMode
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
              : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
          }`}
          title="Open Admin Panel"
        >
          <span>🔐</span>
          <span>Admin</span>
        </button>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
        <button
          onClick={onToggleTheme}
          className={`p-3 md:p-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
            darkMode
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-yellow-400/30'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-400/30'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-6 h-6 md:w-7 md:h-7" /> : <Moon className="w-6 h-6 md:w-7 md:h-7" />}
        </button>
      </div>

      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-float"></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full filter blur-3xl animate-float"></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-300/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
          </>
        )}

        {/* IoT Animated Nodes */}
        <div className="absolute top-10 left-10 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" style={{ boxShadow: darkMode ? '0 0 20px rgba(0, 206, 209, 0.5)' : '0 0 15px rgba(0, 149, 218, 0.3)' }}></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s', boxShadow: darkMode ? '0 0 15px rgba(59, 130, 246, 0.5)' : '0 0 10px rgba(37, 99, 235, 0.3)' }}></div>
        <div className="absolute bottom-32 left-1/4 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '2s', boxShadow: darkMode ? '0 0 18px rgba(139, 92, 246, 0.5)' : '0 0 13px rgba(124, 58, 237, 0.3)' }}></div>
        <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s', boxShadow: darkMode ? '0 0 20px rgba(34, 211, 238, 0.5)' : '0 0 15px rgba(6, 182, 212, 0.3)' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s', boxShadow: darkMode ? '0 0 15px rgba(96, 165, 250, 0.5)' : '0 0 10px rgba(59, 130, 246, 0.3)' }}></div>

        {/* IoT Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: darkMode ? 0.1 : 0.05 }}>
          <line x1="40" y1="50" x2="200" y2="150" stroke={darkMode ? '#0ea5e9' : '#0284c7'} strokeWidth="1" opacity="0.6" />
          <line x1="80%" y1="20" x2="70%" y2="40%" stroke={darkMode ? '#8b5cf6' : '#7c3aed'} strokeWidth="1" opacity="0.6" />
          <line x1="200" y1="200" x2="300" y2="100" stroke={darkMode ? '#06b6d4' : '#0891b2'} strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* IoT esSENCE Logo */}
        <div className="mb-8 md:mb-12 pt-4 md:pt-0 animate-fade-in relative">
          <div className="inline-flex items-center justify-center">
            {/* Circular glow background */}
            <div className={`absolute w-40 h-40 md:w-48 md:h-48 rounded-full ${
              darkMode ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10' : 'bg-gradient-to-br from-blue-400/20 to-cyan-400/10'
            } blur-2xl`}></div>
            
            {/* Circular logo container */}
            <div className={`relative w-36 h-36 md:w-44 md:h-44 rounded-full p-2 ${
              darkMode 
                ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border-2 border-blue-500/40' 
                : 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-2 border-blue-400/40'
            }`}>
              <img 
                src="/iot-essence.jpeg" 
                alt="IoT esSENCE Logo" 
                className="w-full h-full rounded-full object-cover opacity-95 hover:opacity-100 transition-opacity duration-300 shadow-lg" 
                style={{ filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))' }} 
              />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h1 className={`text-6xl md:text-7xl font-bold mb-4 transition-colors duration-300 ${
          darkMode
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400'
            : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600'
        }`}>
          IoT esSENCE 2K26
        </h1>

        {/* Subtitle */}
        <p className={`text-2xl font-semibold mb-10 transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          IoT esSENCE 2K26
        </p>

        {/* Description */}
        <p className={`text-2xl lg:text-3xl mb-10 transition-colors duration-300 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          A Premier Technical Event by the Department of Internet of Things
        </p>

        {/* Event Details */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-center mb-14 px-2 md:px-0">
          <div className={`px-4 md:px-8 py-3 md:py-4 rounded-lg backdrop-blur-sm transition-all duration-300 text-sm sm:text-base md:text-lg lg:text-2xl font-semibold whitespace-nowrap md:whitespace-normal ${
            darkMode
              ? 'bg-gray-800/40 border border-gray-700/50'
              : 'bg-white/40 border border-gray-300/50'
          }`}>
            <p className={darkMode ? 'text-blue-400' : 'text-blue-600'}>📅 Mar 16-17</p>
          </div>
          <div className={`px-4 md:px-8 py-3 md:py-4 rounded-lg backdrop-blur-sm transition-all duration-300 text-sm sm:text-base md:text-lg lg:text-2xl font-semibold whitespace-nowrap md:whitespace-normal ${
            darkMode
              ? 'bg-gray-800/40 border border-gray-700/50'
              : 'bg-white/40 border border-gray-300/50'
          }`}>
            <p className={darkMode ? 'text-purple-400' : 'text-purple-600'}>📍 MREC-Sports Block Auditorium</p>
          </div>
        </div>

        {/* Tech Innovation & Event Highlights Section */}
        <div className="mb-16 space-y-10">
          {/* Tech Innovation Vision */}
          <div className="text-center mb-12 px-4">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-300 ${
              darkMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700'
            }`}>
              🚀 Tech Innovation & IoT Ideology
            </h2>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Explore cutting-edge Internet of Things technologies, smart solutions, and innovative projects that are shaping the future of connected devices and intelligent systems.
            </p>
          </div>

          {/* Event Highlights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mb-12">
            {/* Card 1: Project Expo */}
            <div className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
              darkMode ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700/50' : 'bg-gradient-to-br from-blue-100/40 to-cyan-100/40 border border-blue-300/50'
            } p-8 backdrop-blur-md`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-cyan-500/0 group-hover:via-blue-500/30 transition-all duration-500"></div>
              <div className="relative z-10">
                <h3 className={`text-3xl mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>💡</h3>
                <h4 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Project Expo</h4>
                <p className={`transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Showcase your innovative IoT projects and prototypes. Compete with brilliant minds and win exciting prizes.</p>
              </div>
            </div>

            {/* Card 2: Innovation Track */}
            <div className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
              darkMode ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/50' : 'bg-gradient-to-br from-purple-100/40 to-pink-100/40 border border-purple-300/50'
            } p-8 backdrop-blur-md`}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 group-hover:via-purple-500/30 transition-all duration-500"></div>
              <div className="relative z-10">
                <h3 className={`text-3xl mb-4 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>⚙️</h3>
                <h4 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Tech Workshops</h4>
                <p className={`transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Learn from industry experts about IoT applications, machine learning, and automation technologies.</p>
              </div>
            </div>

            {/* Card 3: Networking */}
            <div className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
              darkMode ? 'bg-gradient-to-br from-cyan-900/40 to-teal-900/40 border border-cyan-700/50' : 'bg-gradient-to-br from-cyan-100/40 to-teal-100/40 border border-cyan-300/50'
            } p-8 backdrop-blur-md`}>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-teal-500/0 group-hover:via-cyan-500/30 transition-all duration-500"></div>
              <div className="relative z-10">
                <h3 className={`text-3xl mb-4 ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>🤝</h3>
                <h4 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Networking Events</h4>
                <p className={`transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Connect with innovators, entrepreneurs, and tech enthusiasts from across the region.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chief Guests Section */}
        <div className="mb-16 px-4">
          <h2 className={`text-4xl md:text-5xl font-bold text-center mb-12 transition-colors duration-300 ${
            darkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-700'
          }`}>
            👑 Chief Guests & Speakers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Guest 1: Karthik */}
            <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/50'
                : 'bg-gradient-to-b from-slate-100/60 to-slate-200/60 border border-slate-300/50'
            } backdrop-blur-md overflow-hidden`}>
              <div className={`relative pt-8 px-6 pb-4 ${
                darkMode ? 'bg-gradient-to-b from-blue-500/20 to-transparent' : 'bg-gradient-to-b from-blue-400/20 to-transparent'
              }`}>
                <div className={`w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 ${
                  darkMode ? 'border-blue-500/50' : 'border-blue-400/50'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <img 
                    src="/Karthik-founder- offashshoot.jpeg" 
                    alt="Karthik" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Karthik</h3>
                <p className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>Founder of FlashShoot</p>
                <p className={`text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Leading innovator in digital fashion technology and e-commerce solutions</p>
              </div>
            </div>

            {/* Guest 2: Dodla Megha */}
            <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/50'
                : 'bg-gradient-to-b from-slate-100/60 to-slate-200/60 border border-slate-300/50'
            } backdrop-blur-md overflow-hidden`}>
              <div className={`relative pt-8 px-6 pb-4 ${
                darkMode ? 'bg-gradient-to-b from-purple-500/20 to-transparent' : 'bg-gradient-to-b from-purple-400/20 to-transparent'
              }`}>
                <div className={`w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 ${
                  darkMode ? 'border-purple-500/50' : 'border-purple-400/50'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <img 
                    src="/dodla-megha.jpeg" 
                    alt="Dodla Megha" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Dodla Megha</h3>
                <p className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>Tech Industry Leader</p>
                <p className={`text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Visionary entrepreneur with expertise in IoT and sustainable technology solutions</p>
              </div>
            </div>

            {/* Guest 3: Deepak Mourya */}
            <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/50'
                : 'bg-gradient-to-b from-slate-100/60 to-slate-200/60 border border-slate-300/50'
            } backdrop-blur-md overflow-hidden`}>
              <div className={`relative pt-8 px-6 pb-4 ${
                darkMode ? 'bg-gradient-to-b from-cyan-500/20 to-transparent' : 'bg-gradient-to-b from-cyan-400/20 to-transparent'
              }`}>
                <div className={`w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 ${
                  darkMode ? 'border-cyan-500/50' : 'border-cyan-400/50'
                } group-hover:scale-110 transition-transform duration-300`}>
                  <img 
                    src="/Deepak-mourya.jpeg" 
                    alt="Deepak Mourya" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Deepak Mourya</h3>
                <p className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>Founder of Happysundays</p>
                <p className={`text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Innovative entrepreneur revolutionizing digital experiences and lifestyle technology</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-row gap-2 sm:gap-4 md:gap-6 justify-center items-center px-2 md:px-0 pb-8 md:pb-0 flex-wrap">
          <button
            onClick={onStart}
            className={`flex-1 sm:flex-none px-3 sm:px-6 md:px-12 lg:px-14 py-3 sm:py-4 md:py-5 lg:py-6 text-xs sm:text-base md:text-xl lg:text-2xl font-bold rounded-full transition-all duration-300 hover:scale-110 shadow-lg whitespace-nowrap ${
              darkMode
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/50'
                : 'bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:shadow-xl hover:shadow-purple-500/50'
            }`}
          >
            Start Registration →
          </button>

          {/* Problem Statements Button */}
          <a 
            href="https://artixs-problemstatements-zk5x.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 md:px-8 lg:px-10 py-3.5 sm:py-4 md:py-5 lg:py-6 text-xs sm:text-base md:text-lg lg:text-xl font-bold rounded-full transition-all duration-300 hover:scale-110 shadow-xl ${
              darkMode
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-2xl hover:shadow-orange-500/50 hover:from-orange-400 hover:to-red-500'
                : 'bg-gradient-to-r from-orange-600 to-red-700 text-white hover:shadow-2xl hover:shadow-orange-500/50 hover:from-orange-500 hover:to-red-600'
            }`}
          >
            <span>📋</span>
            <span className="whitespace-normal sm:whitespace-nowrap">View Problem Statements</span>
          </a>
        </div>


      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-iot {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes drift {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -10px) rotate(90deg);
          }
          50% {
            transform: translate(-15px, 15px) rotate(180deg);
          }
          75% {
            transform: translate(10px, -20px) rotate(270deg);
          }
        }
        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(0, 206, 209, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(0, 206, 209, 0.8));
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
