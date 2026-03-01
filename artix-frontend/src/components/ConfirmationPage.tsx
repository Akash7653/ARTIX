import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import type { RegistrationFormData } from '../types/registration';

interface Props {
  registrationId: string;
  formData: RegistrationFormData;
  verificationId: string;
}

export function ConfirmationPage({ registrationId, formData, verificationId }: Props) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationId);
  };

  const darkMode = true; // Confirmation page uses dark theme

  return (
    <div className={`min-h-screen transition-colors duration-300 py-6 md:py-8 px-4 flex items-center justify-center ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
        : 'bg-gradient-to-br from-white via-blue-50 to-white'
    }`}>
      <div className={`max-w-4xl w-full p-4 md:p-8 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
        darkMode
          ? 'bg-gradient-to-br from-gray-800/40 via-gray-800/30 to-gray-900/40 border-gray-700/50'
          : 'bg-gradient-to-br from-white/40 via-green-50/40 to-white/40 border-gray-300/50'
      }`}>
        <div className="text-center mb-6 md:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 md:w-32 h-24 md:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4 md:mb-6 animate-bounce-slow shadow-2xl">
            <CheckCircle className="w-12 md:w-16 h-12 md:h-16 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 md:mb-4">
            Registration Successful!
          </h1>
          <p className={`text-lg md:text-xl lg:text-2xl ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Your registration for ARTIX 2K26 is confirmed</p>
        </div>

        <div className={`rounded-xl p-4 md:p-8 mb-6 md:mb-8 border-2 ${
          darkMode
            ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30'
            : 'bg-gradient-to-br from-blue-400/10 to-purple-400/10 border-blue-400/30'
        }`}>
          <div className="text-center mb-4 md:mb-6">
            <p className={`mb-2 md:mb-3 text-base md:text-xl ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Registration ID</p>
            <p className={`text-2xl md:text-4xl lg:text-5xl font-bold tracking-wider ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>{registrationId}</p>
          </div>

          <div className={`border-t pt-4 md:pt-6 mt-4 md:mt-6 ${
            darkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 text-sm md:text-lg lg:text-xl">
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
                <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formData.fullName}</p>
              </div>
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formData.email}</p>
              </div>
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formData.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-2 rounded-xl p-4 md:p-8 text-center ${
          darkMode
            ? 'bg-gray-800/50 border-purple-500/30'
            : 'bg-white/40 border-purple-400/30'
        }`}>
          <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 ${
            darkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>Your Verification ID</h2>
          <p className={`mb-6 md:mb-8 text-base md:text-lg ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Use this ID to verify your entry at the event
          </p>

          {verificationId && (
            <div className="flex justify-center mb-6 md:mb-8">
              <div className={`p-4 md:p-6 rounded-lg border-2 ${
                darkMode
                  ? 'bg-gray-900 border-purple-400'
                  : 'bg-white border-purple-500'
              }`}>
                <p className={`text-xs uppercase tracking-widest mb-2 md:mb-3 font-semibold ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Verification ID
                </p>
                <p className={`text-3xl md:text-5xl lg:text-6xl font-mono font-bold tracking-widest break-all ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {verificationId}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={copyToClipboard}
            className={`inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition-all hover:shadow-lg ${
              darkMode
                ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-green-500/50'
                : 'bg-gradient-to-r from-green-600 to-blue-700 text-white hover:shadow-green-600/50'
            }`}
          >
            📋 Copy ID
          </button>
        </div>

        <div className={`mt-6 md:mt-8 p-4 md:p-6 border rounded-lg ${
          darkMode
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-yellow-400/10 border-yellow-400/30'
        }`}>
          <p className={`text-center text-base md:text-lg mb-3 md:mb-4 ${
            darkMode ? 'text-yellow-500' : 'text-yellow-700'
          }`}>
            <strong>Important:</strong> Save your verification ID. You'll need it to verify your entry at the event.
          </p>
          <div className={`text-center text-xs md:text-sm p-3 md:p-4 rounded-lg ${
            darkMode
              ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              : 'bg-blue-50 border border-blue-300 text-blue-700'
          }`}>
            <p className="font-semibold mb-1 md:mb-2">Instructions for Admin Verification:</p>
            <p>The admin will enter your Verification ID in the admin dashboard to verify your entry and confirm payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
