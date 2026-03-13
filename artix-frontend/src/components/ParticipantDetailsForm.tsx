import { useState } from 'react';
import type { RegistrationFormData } from '../types/registration';
import { isValidEmail, isValidPhone, isValidName, isValidCollege } from '../utils/validation';

interface Props {
  formData: RegistrationFormData;
  updateFormData: (updates: Partial<RegistrationFormData>) => void;
  darkMode?: boolean;
}

export function ParticipantDetailsForm({ formData, updateFormData, darkMode = true }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation checks
  const nameError = touched.fullName && formData.fullName && !isValidName(formData.fullName);
  const emailError = touched.email && formData.email && !isValidEmail(formData.email);
  const phoneError = touched.phone && formData.phone && !isValidPhone(formData.phone);
  const collegeError = touched.collegeName && formData.collegeName && !isValidCollege(formData.collegeName);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  return (
    <div className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800/40 via-gray-800/30 to-gray-900/40 border-gray-700/50'
        : 'bg-gradient-to-br from-white/40 via-blue-50/40 to-white/40 border-gray-300/50'
    }`}>
      <h2 className={`text-2xl md:text-3xl font-bold mb-6 md:mb-8 ${
        darkMode ? 'text-blue-400' : 'text-blue-600'
      }`}>Participant Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
        <div>
          <label className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Full Name *</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            onBlur={() => handleBlur('fullName')}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              nameError
                ? darkMode
                  ? 'border-red-500/80 bg-red-900/20 text-white'
                  : 'border-red-500 bg-red-50 text-gray-900'
                : darkMode
                  ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                  : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
            placeholder="Enter your full name"
          />
          {nameError && (
            <p className="text-red-500 text-xs md:text-sm mt-1">❌ Name must contain only letters and spaces</p>
          )}
        </div>

        <div>
          <label className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Email * <span className="text-xs md:text-sm text-gray-500">(Must be unique)</span></label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value.toLowerCase().trim() })}
            onBlur={() => handleBlur('email')}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              emailError
                ? darkMode
                  ? 'border-red-500/80 bg-red-900/20 text-white'
                  : 'border-red-500 bg-red-50 text-gray-900'
                : darkMode
                  ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                  : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
            placeholder="your.email@example.com"
          />
          {emailError && (
            <p className="text-red-500 text-xs md:text-sm mt-1">❌ Please enter a valid email address</p>
          )}
          <p className="text-xs md:text-sm mt-2 text-gray-500">💡 Each email can only register once</p>
        </div>

        <div>
          <label className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>WhatsApp Number * 📱</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value.replace(/\D/g, '') })} // Only digits
            onBlur={() => handleBlur('phone')}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              phoneError
                ? darkMode
                  ? 'border-red-500/80 bg-red-900/20 text-white'
                  : 'border-red-500 bg-red-50 text-gray-900'
                : darkMode
                  ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                  : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
            placeholder="10-digit WhatsApp number"
          />
          {phoneError && (
            <p className="text-red-500 text-xs md:text-sm mt-1">❌ Please enter a valid 10-digit number</p>
          )}
          <p className="text-xs md:text-sm mt-2 text-gray-500">💡 Your active WhatsApp number for registration confirmations</p>
        </div>

        <div>
          <label htmlFor="yearOfStudy" className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Year of Study *</label>
          <select
            id="yearOfStudy"
            required
            value={formData.yearOfStudy}
            onChange={(e) => updateFormData({ yearOfStudy: e.target.value })}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              darkMode
                ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
          >
            <option value="">Select year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>

        <div>
          <label className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Branch *</label>
          <input
            type="text"
            required
            value={formData.branch}
            onChange={(e) => updateFormData({ branch: e.target.value })}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              darkMode
                ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
            placeholder="e.g., CSE, ECE, IoT"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Roll Number *</label>
          <input
            type="text"
            required
            value={formData.rollNumber}
            onChange={(e) => updateFormData({ rollNumber: e.target.value })}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              darkMode
                ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
            placeholder="Your roll number"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={`block mb-2 md:mb-3 text-base md:text-lg font-semibold ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Section *</label>
          <input
            type="text"
            required
            value={formData.section || ''}
            onChange={(e) => updateFormData({ section: e.target.value })}
            className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 backdrop-blur-sm text-base md:text-lg ${
              darkMode
                ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
            }`}
            placeholder="e.g., A, B, C"
          />
        </div>
      </div>
    </div>
  );
}
