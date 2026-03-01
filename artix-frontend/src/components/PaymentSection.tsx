import { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { INDIVIDUAL_EVENTS, COMBO_OPTIONS, type RegistrationFormData } from '../types/registration';

interface Props {
  formData: RegistrationFormData;
  updateFormData: (updates: Partial<RegistrationFormData>) => void;
  onSubmitSuccess: (registrationId: string) => void;
  darkMode?: boolean;
}

const UPI_ID = '8919068236@ybl';
const PAYEE_NAME = 'PUNDRU MEGHAN REDDY';

export function PaymentSection({ formData, updateFormData, onSubmitSuccess, darkMode = true }: Props) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [utrId, setUtrId] = useState<string>('');

  const calculateTotal = (): number => {
    if (formData.selectedCombo) {
      const combo = COMBO_OPTIONS.find(c => c.id === formData.selectedCombo);
      return combo?.price || 0;
    }
    return formData.selectedIndividualEvents.reduce((total, eventId) => {
      const event = INDIVIDUAL_EVENTS.find(e => e.id === eventId);
      return total + (event?.price || 0);
    }, 0);
  };

  const totalAmount = calculateTotal();

  useEffect(() => {
    if (totalAmount > 0) {
      const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${totalAmount}&cu=INR`;
      QRCode.toDataURL(upiUrl, { width: 300, margin: 2 })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [totalAmount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError(`File size too large. Maximum 10MB allowed. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, JPEG)');
        return;
      }
      
      setError('');
      updateFormData({ paymentScreenshot: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate all required fields
      if (!formData.fullName?.trim()) {
        throw new Error('Please enter your full name');
      }
      
      if (!formData.email?.trim()) {
        throw new Error('Please enter your email');
      }
      
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!formData.paymentScreenshot) {
        throw new Error('Please upload payment screenshot with Transaction ID and UTR ID written in it');
      }

      if (!transactionId.trim()) {
        throw new Error('Please enter Transaction ID');
      }

      if (!utrId.trim()) {
        throw new Error('Please enter UTR ID');
      }

      if (totalAmount === 0) {
        throw new Error('Please select at least one event');
      }

      // Prepare form data with normalized email and transaction/UTR IDs
      const registrationData = {
        ...formData,
        email: formData.email.toLowerCase().trim(),
        fullName: formData.fullName.trim(),
        selectedIndividualEvents: formData.selectedIndividualEvents,
        totalAmount,
        transactionId: transactionId.trim(),
        utrId: utrId.trim()
      };

      // Call API
      const response = await api.register(registrationData);

      if (response.success) {
        onSubmitSuccess(response.registrationId, null);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      // Provide specific error guidance
      if (errorMessage.includes('Email already registered')) {
        setError('❌ This email is already registered. Please use a different email address.');
      } else if (errorMessage.includes('500')) {
        setError('⚠️ Server error. Please check all fields are filled correctly and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (totalAmount === 0) {
    return null;
  }

  return (
    <div className={`p-6 rounded-2xl animate-slide-in border transition-all duration-300 backdrop-blur-md ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800/40 via-gray-800/30 to-gray-900/40 border-gray-700/50'
        : 'bg-gradient-to-br from-white/40 via-green-50/40 to-white/40 border-gray-300/50'
    }`}>
      <h2 className={`text-3xl lg:text-4xl font-bold mb-8 ${
        darkMode
          ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500'
          : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'
      }`}>
        Payment
      </h2>

      <div className="space-y-8">
        {/* QR Code Section with Enhanced Styling */}
        <div className={`rounded-xl p-8 border-2 transition-all hover:shadow-lg ${
          darkMode
            ? 'bg-gradient-to-br from-blue-500/15 to-purple-500/15 border-blue-500/40 hover:border-blue-500/60 hover:shadow-blue-500/20'
            : 'bg-gradient-to-br from-blue-300/15 to-purple-300/15 border-blue-400/40 hover:border-blue-400/60'
        } animate-glow-pulse`}>
          <div className="text-center mb-6">
            <p className={`mb-4 text-2xl font-semibold ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Scan to Pay with UPI</p>
            <p className={`text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-lg`}>
              ₹{totalAmount}
            </p>
          </div>

          {qrCodeDataUrl && (
            <div className="flex justify-center mb-6 transform hover:scale-110 transition-transform duration-300">
              <div className="relative">
                {/* Glow effect behind QR code */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-50 animate-pulse"></div>
                <img
                  src={qrCodeDataUrl}
                  alt="Payment QR Code"
                  className="relative rounded-lg border-4 border-white shadow-2xl w-80 h-80"
                />
              </div>
            </div>
          )}

          {/* Payment Details with Gradient */}
          <div className={`rounded-xl p-6 lg:p-8 border-2 transition-all duration-300 ${
            darkMode
              ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-gradient-to-r from-blue-500/50 to-purple-500/50'
              : 'bg-gradient-to-br from-blue-300/20 via-purple-300/20 to-pink-300/20 border-gradient-to-r from-blue-400/50 to-purple-400/50'
          }`} style={{
            borderImage: darkMode
              ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%) 1'
              : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%) 1'
          }}>
            <div className="text-center mb-6">
              <p className={`text-2xl lg:text-3xl font-bold mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>Payment Details</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div className={`p-4 rounded-lg backdrop-blur-sm ${
                darkMode ? 'bg-gray-800/40' : 'bg-white/40'
              }`}>
                <p className={`text-lg font-semibold mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>UPI ID</p>
                <p className="font-mono text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{UPI_ID}</p>
              </div>
              <div className={`p-4 rounded-lg backdrop-blur-sm ${
                darkMode ? 'bg-gray-800/40' : 'bg-white/40'
              }`}>
                <p className={`text-lg font-semibold mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Payee Name</p>
                <p className="font-bold text-xl lg:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{PAYEE_NAME}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Preview Section */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden border-2 border-cyan-500/40 hover:border-cyan-500/80 transition-all animate-slide-in">
              {/* Watermark overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-10">
                <div className="text-6xl font-bold text-cyan-500 transform -rotate-45">
                  ARTIX 2K26
                </div>
              </div>

              {/* Image with effects */}
              <img
                src={imagePreview}
                alt="Payment screenshot preview"
                className="w-full h-auto max-h-64 object-cover filter hover:brightness-110 hover:contrast-125 transition-all duration-300"
              />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300 animate-shimmer"></div>
            </div>
          )}

          <div>
            <label className={`block mb-4 font-semibold text-lg ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Upload Payment Screenshot <span className="text-red-500">*</span>
            </label>
            
            {/* Important Instructions */}
            <div className={`mb-6 p-5 md:p-6 rounded-lg border-2 space-y-4 ${
              darkMode 
                ? 'bg-red-500/15 border-red-500/40 text-red-200' 
                : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <p className="font-bold text-base md:text-lg">🔴 CRITICAL REQUIREMENTS:</p>
              <div className="space-y-3 text-sm md:text-base">
                <div className="flex gap-3">
                  <span className="font-bold text-xl">1️⃣</span>
                  <div>
                    <p className="font-bold">Transaction ID must be CLEARLY VISIBLE</p>
                    <p className="text-xs md:text-sm opacity-90">Write /screenshot the Transaction ID prominently in the payment screenshot. The admin will look for this.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-xl">2️⃣</span>
                  <div>
                    <p className="font-bold">UTR ID must be CLEARLY VISIBLE</p>
                    <p className="text-xs md:text-sm opacity-90">Write/screenshot the UTR ID prominently in the payment screenshot. Both IDs must be readable.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-xl">3️⃣</span>
                  <div>
                    <p className="font-bold">High-Quality Image Required</p>
                    <p className="text-xs md:text-sm opacity-90">Ensure the image is clear, well-lit, and both IDs are fully legible. Blurry images will be rejected.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-xl">4️⃣</span>
                  <div>
                    <p className="font-bold">Admin Verification</p>
                    <p className="text-xs md:text-sm opacity-90">The admin will verify Transaction ID and UTR ID from your uploaded screenshot during entry verification.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="hidden"
                id="payment-screenshot"
              />
              <label
                htmlFor="payment-screenshot"
                className={`flex items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all group ${
                  darkMode
                    ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/5 bg-gray-800/30'
                    : 'border-gray-400 hover:border-blue-500 hover:bg-blue-500/5 bg-white/30'
                }`}
              >
                {formData.paymentScreenshot ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-green-500 group-hover:animate-bounce" />
                    <div className="text-left">
                      <p className="text-green-500 font-semibold text-lg">Screenshot Uploaded</p>
                      <p className="text-green-400 text-base">{formData.paymentScreenshot.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    <div className="text-left">
                      <p className={`font-semibold text-lg ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Click to upload</p>
                      <p className={`text-base ${
                        darkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}>Payment screenshot (PNG, JPG, up to 10MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Transaction ID and UTR ID Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className={`block mb-3 font-bold text-base md:text-lg ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                💳 Transaction ID *
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 text-base md:text-lg ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                    : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
                }`}
                placeholder="e.g., TXN123456"
              />
              <p className={`text-xs md:text-sm mt-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>From your payment screenshot</p>
            </div>
            <div>
              <label className={`block mb-3 font-bold text-base md:text-lg ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                🏦 UTR ID *
              </label>
              <input
                type="text"
                value={utrId}
                onChange={(e) => setUtrId(e.target.value)}
                required
                className={`w-full px-4 md:px-5 py-2 md:py-3 rounded-lg border-2 transition-all duration-300 text-base md:text-lg ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500/50 focus:bg-gray-800/70'
                    : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:bg-white/70'
                }`}
                placeholder="e.g., 0123456789012"
              />
              <p className={`text-xs md:text-sm mt-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>From your payment screenshot</p>
            </div>
          </div>

          {error && (
            <div className={`p-5 border-2 rounded-lg font-semibold text-lg animate-slide-in space-y-3 ${
              darkMode
                ? 'bg-red-500/15 border-red-500/50 text-red-400'
                : 'bg-red-50/80 border-red-300 text-red-700'
            }`}>
              <p className="flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
              {error.includes('Email already registered') && (
                <p className="text-sm opacity-90">💡 Please go back and use a different email address.</p>
              )}
              {error.includes('too large') && (
                <p className="text-sm opacity-90">💡 Try compressing or reducing the image size and upload again.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!formData.paymentScreenshot || !transactionId || !utrId || isSubmitting}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all relative group overflow-hidden hover:shadow-lg ${
              !formData.paymentScreenshot || !transactionId || !utrId
                ? 'opacity-50 cursor-not-allowed bg-gray-500'
                : darkMode
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/50'
                : 'bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:shadow-blue-600/50'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Submitting Registration...</span>
              </div>
            ) : (
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Complete Registration
                  <CheckCircle2 className="w-6 h-6 group-hover:animate-bounce" />
                </span>
              </>
            )}
          </button>

          <p className={`text-center text-lg ${
            darkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            ✓ Your registration will be processed instantly after payment verification
          </p>
        </form>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-shimmer {
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
