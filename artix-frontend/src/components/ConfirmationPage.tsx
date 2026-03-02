import { CheckCircle } from 'lucide-react';
import type { RegistrationFormData } from '../types/registration';
import { generateWhatsAppMessage, openWhatsAppWeb } from '../utils/whatsappHelper';

interface Props {
  registrationId: string;
  formData: RegistrationFormData;
}

export function ConfirmationPage({ registrationId, formData }: Props) {
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

        {/* Awaiting Approval Message - Always Shown */}
        <div className={`p-6 md:p-10 border-3 rounded-xl mb-8 text-center ${
          darkMode
            ? 'bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-500/40'
            : 'bg-gradient-to-br from-green-400/15 to-emerald-400/15 border-green-400/40'
        }`}>
          <div className="inline-flex items-center gap-3 mb-4">
            <CheckCircle className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <p className={`text-lg md:text-2xl font-bold ${
              darkMode ? 'text-green-400' : 'text-green-600'
            }`}>Details Submitted Successfully! ✅</p>
          </div>
          <p className={`text-base md:text-lg ${
            darkMode ? 'text-green-300' : 'text-green-700'
          }`}>
            Your details have been successfully submitted. If you are approved, you will receive your entry ID to your WhatsApp number. Stay tuned! 🎉
          </p>
        </div>

        {/* WhatsApp Confirmation Message Sent */}
        <div className={`p-6 md:p-10 border-3 rounded-xl mb-8 ${
          darkMode
            ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border-cyan-500/40'
            : 'bg-gradient-to-br from-cyan-400/15 to-blue-400/15 border-cyan-400/40'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className={`text-base md:text-lg font-bold mb-2 ${
                darkMode ? 'text-cyan-300' : 'text-cyan-700'
              }`}>
                📱 WhatsApp Message Sent!
              </p>
              <p className={`text-sm md:text-base ${
                darkMode ? 'text-cyan-200' : 'text-cyan-600'
              }`}>
                A confirmation message with your registration details has been sent to your WhatsApp number (<strong>{formData.phone}</strong>).
                Check your WhatsApp for the message, or click the button below to open WhatsApp Web.
              </p>
            </div>
            <button
              onClick={() => {
                const message = generateWhatsAppMessage(
                  formData.fullName,
                  formData.collegeName,
                  formData.branch,
                  formData.yearOfStudy,
                  formData.phone,
                  formData.selectedIndividualEvents.length > 0 
                    ? formData.selectedIndividualEvents 
                    : (formData.selectedCombo ? [formData.selectedCombo] : []),
                  formData.totalAmount || 0,
                  registrationId
                );
                openWhatsAppWeb(formData.phone, message);
              }}
              className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                darkMode
                  ? 'bg-green-600 text-white hover:bg-green-700 border border-green-500'
                  : 'bg-green-600 text-white hover:bg-green-700 border border-green-500'
              }`}
            >
              💬 Open WhatsApp
            </button>
          </div>
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
            📋 What Happens Next?
          </p>
          <ol className={`text-sm md:text-base space-y-3 list-decimal list-inside ${
            darkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            <li><strong>Admin Review:</strong> The event admin will verify your payment using the Transaction ID and UTR ID you provided in the screenshot.</li>
            <li><strong>Payment Verification:</strong> They will check that the payment amount matches the event fee (₹{formData.totalAmount || 0}).</li>
            <li><strong>Approval Decision:</strong> Admin will approve or reject your registration based on payment verification.</li>
            <li><strong>Entry ID Delivery:</strong> If approved, your unique Entry ID will be generated and sent to your <strong>WhatsApp number</strong>.</li>
            <li><strong>Event Entry:</strong> Show your Entry ID from WhatsApp at the event entrance for verification.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

