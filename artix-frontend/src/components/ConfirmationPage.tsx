import { useState } from 'react';
import { CheckCircle, Copy, CheckCheck } from 'lucide-react';
import type { RegistrationFormData } from '../types/registration';

interface Props {
  registrationId: string;
  formData: RegistrationFormData;
  verificationId: string;
}

export function ConfirmationPage({ registrationId, formData, verificationId }: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const darkMode = true;

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
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 md:w-32 h-24 md:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4 md:mb-6 animate-bounce-slow shadow-2xl">
            <CheckCircle className="w-12 md:w-16 h-12 md:h-16 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3 md:mb-4">
            Registration Successful! ✨
          </h1>
          <p className={`text-lg md:text-xl lg:text-2xl ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Your registration for ARTIX 2K26 is confirmed</p>
        </div>

        {/* Single Unique ID Section */}
        <div className={`rounded-xl p-6 md:p-10 mb-8 border-3 text-center ${
          darkMode
            ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15 border-purple-500/40'
            : 'bg-gradient-to-br from-purple-400/15 to-pink-400/15 border-purple-400/40'
        }`}>
          <p className={`text-sm uppercase tracking-widest font-bold mb-4 ${
            darkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>🔐 Your Unique ID</p>
          
          <div className={`inline-block p-6 md:p-8 rounded-lg border-2 mb-6 ${
            darkMode
              ? 'bg-gray-900 border-purple-400'
              : 'bg-white border-purple-500'
          }`}>
            <p className={`text-4xl md:text-5xl lg:text-6xl font-mono font-bold tracking-widest break-all ${
              darkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {verificationId}
            </p>
          </div>

          <button
            onClick={copyToClipboard}
            className={`inline-flex items-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 rounded-lg font-bold text-base md:text-lg transition-all ${
              copied
                ? darkMode
                  ? 'bg-green-500/30 text-green-400 border border-green-500'
                  : 'bg-green-100 text-green-700 border border-green-400'
                : darkMode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                  : 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:shadow-lg'
            }`}
          >
            {copied ? (
              <>
                <CheckCheck className="w-5 h-5" /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" /> Copy ID
              </>
            )}
          </button>

          <p className={`mt-6 text-sm md:text-base ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Save this ID - you'll need it for verification at the event
          </p>
        </div>

        {/* Your Information */}
        <div className={`rounded-xl p-6 md:p-8 mb-8 border-2 ${
          darkMode
            ? 'bg-gray-800/50 border-gray-700/50'
            : 'bg-white/50 border-gray-300/50'
        }`}>
          <h3 className={`text-lg md:text-xl font-bold mb-6 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>Your Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
              <p className={`text-lg font-semibold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {formData.fullName}
              </p>
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
              <p className={`text-lg font-semibold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {formData.email}
              </p>
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
              <p className={`text-lg font-semibold mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {formData.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className={`p-6 md:p-8 border rounded-xl ${
          darkMode
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-blue-50 border-blue-300'
        }`}>
          <p className={`text-base md:text-lg font-bold mb-4 ${
            darkMode ? 'text-blue-400' : 'text-blue-700'
          }`}>
            📋 What's Next?
          </p>
          <ol className={`text-sm md:text-base space-y-2 list-decimal list-inside ${
            darkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            <li>Save your unique ID above</li>
            <li>The admin will verify your payment and approve your entry</li>
            <li>Show this ID at the event for verification</li>
            <li>You'll receive a confirmation email when approved</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

