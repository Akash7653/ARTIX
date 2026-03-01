import { useState } from 'react';
import { Search, Check, AlertCircle, Home, LogOut } from 'lucide-react';
import { api } from '../lib/api';

interface VerificationResult {
  registration_id: string;
  full_name: string;
  email: string;
  phone: string;
  selected_events: string[];
  entry_status: string;
  total_amount: number;
  created_at: string;
}

interface Props {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function UserVerificationPage({ onNavigate, onLogout }: Props) {
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [isDarkMode] = useState(true);

  const handleSearch = async () => {
    if (!verificationId.trim()) {
      setError('Please enter your Verification ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.getRegistration(verificationId.trim());
      if (data.registration) {
        setResult(data.registration);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification ID not found');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 py-6 md:py-8 px-4 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <Search className="w-8 h-8" />
              Verify Your Entry
            </h1>
            <p className={`text-sm md:text-base mt-2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Enter your Verification ID to check your registration status
            </p>
          </div>
          <button
            onClick={() => onNavigate('register')}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="Back to registration"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>

        {/* Search Box */}
        <div className={`rounded-xl p-6 md:p-8 border mb-8 backdrop-blur-md ${
          isDarkMode
            ? 'bg-slate-800/40 border-slate-700/50'
            : 'bg-white/40 border-slate-300/50'
        }`}>
          <div className="space-y-4">
            <label className={`block text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              🔐 Enter Your Verification ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="e.g., VER-XXXX-XXXX-XXXX"
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-lg font-mono text-lg tracking-widest transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
                }`}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition-all ${
                  loading
                    ? isDarkMode
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg'
                }`}
              >
                {loading ? '🔍...' : '🔍 Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`rounded-xl p-4 md:p-6 mb-8 border flex gap-3 ${
            isDarkMode
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}>
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Not Found</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-xl border overflow-hidden backdrop-blur-md ${
            isDarkMode
              ? 'bg-slate-800/40 border-slate-700/50'
              : 'bg-white/40 border-slate-300/50'
          }`}>
            {/* Status Header */}
            <div className={`p-6 md:p-8 border-b ${
              result.entry_status === 'verified'
                ? isDarkMode
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-green-50 border-green-300'
                : isDarkMode
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                {result.entry_status === 'verified' ? (
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`} />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`} />
                  </div>
                )}
                <div>
                  <h2 className={`text-2xl md:text-3xl font-bold ${
                    result.entry_status === 'verified'
                      ? isDarkMode
                        ? 'text-green-400'
                        : 'text-green-700'
                      : isDarkMode
                        ? 'text-yellow-400'
                        : 'text-yellow-700'
                  }`}>
                    {result.entry_status === 'verified' ? '✅ Entry Verified' : '⏳ Awaiting Verification'}
                  </h2>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {result.entry_status === 'verified'
                      ? 'Your entry has been verified. See you at the event!'
                      : 'Your entry is pending verification by the admin.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className={`p-6 md:p-8 space-y-6`}>
              {/* Basic Info */}
              <div>
                <h3 className={`text-lg font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-slate-900/30 border border-slate-700/50'
                      : 'bg-slate-100/30 border border-slate-300'
                  }`}>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Full Name</p>
                    <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {result.full_name}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-slate-900/30 border border-slate-700/50'
                      : 'bg-slate-100/30 border border-slate-300'
                  }`}>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Email</p>
                    <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {result.email}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-slate-900/30 border border-slate-700/50'
                      : 'bg-slate-100/30 border border-slate-300'
                  }`}>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Phone</p>
                    <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {result.phone}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-slate-900/30 border border-slate-700/50'
                      : 'bg-slate-100/30 border border-slate-300'
                  }`}>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Amount Paid</p>
                    <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      ₹{result.total_amount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Events */}
              {result.selected_events && result.selected_events.length > 0 && (
                <div>
                  <h3 className={`text-lg font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>Registered Events</h3>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode
                      ? 'bg-slate-900/30 border border-slate-700/50'
                      : 'bg-slate-100/30 border border-slate-300'
                  }`}>
                    <p className={`text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {result.selected_events.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Registration Date */}
              <div className={`p-4 rounded-lg ${
                isDarkMode
                  ? 'bg-slate-900/30 border border-slate-700/50'
                  : 'bg-slate-100/30 border border-slate-300'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Registered On</p>
                <p className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {new Date(result.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className={`p-6 md:p-8 border-t ${
              isDarkMode
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-blue-50 border-blue-300'
            }`}>
              <p className={`text-base ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>💡 Tip:</strong> Save your Verification ID. You'll need it at the event registration desk.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!result && !error && (
          <div className={`rounded-xl p-6 md:p-8 border backdrop-blur-md ${
            isDarkMode
              ? 'bg-slate-800/40 border-slate-700/50'
              : 'bg-white/40 border-slate-300/50'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>How to Verify Your Entry</h3>
            <ol className={`space-y-3 text-base ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <li className="flex gap-3">
                <span className={`font-bold flex-shrink-0 ${
                  isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>1.</span>
                <span>Look for your <strong>Verification ID</strong> from your confirmation email</span>
              </li>
              <li className="flex gap-3">
                <span className={`font-bold flex-shrink-0 ${
                  isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>2.</span>
                <span>Enter it in the search box above (format: VER-XXXX-XXXX-XXXX)</span>
              </li>
              <li className="flex gap-3">
                <span className={`font-bold flex-shrink-0 ${
                  isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>3.</span>
                <span>Click Search to check your registration status</span>
              </li>
              <li className="flex gap-3">
                <span className={`font-bold flex-shrink-0 ${
                  isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>4.</span>
                <span>Once verified (✅), you're ready for the event!</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
