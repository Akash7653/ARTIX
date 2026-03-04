import { useState } from 'react';
import { X, LogIn, Shield } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export function AdminModal({ isOpen, onClose, darkMode = true }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Hardcoded credentials for admin
      const ADMIN_EMAIL = 'thrinadhgujjarlapudi@gmail.com';
      const ADMIN_PASSWORD = '23J41A69A3';

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setIsLoggedIn(true);
        setEmail('');
        setPassword('');
      } else {
        setError('❌ Invalid email or password');
      }
    } catch (err) {
      setError('❌ Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show dashboard if logged in
  if (isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[999]">
        <AdminDashboard darkMode={darkMode} onLogout={() => {
          setIsLoggedIn(false);
          setEmail('');
          setPassword('');
          onClose();
        }} />
      </div>
    );
  }

  // Show login form
  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-colors duration-300 ${
      darkMode ? 'bg-black/60' : 'bg-white/70'
    }`}>
      <div className={`rounded-3xl shadow-2xl w-full max-w-md animate-scale-in transition-all duration-300 overflow-hidden border-2 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-blue-500/30'
          : 'bg-gradient-to-br from-white via-gray-50 to-white border-blue-300/50'
      }`}>
        
        {/* Decorative Top Gradient */}
        <div className={`h-1 w-full bg-gradient-to-r ${
          darkMode 
            ? 'from-blue-500 via-purple-500 to-pink-500' 
            : 'from-blue-400 via-purple-400 to-pink-400'
        }`}></div>

        {/* Header */}
        <div className={`flex items-center justify-between p-8 border-b transition-colors duration-300 ${
          darkMode ? 'border-blue-500/20' : 'border-blue-200/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              darkMode
                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                : 'bg-gradient-to-r from-blue-400 to-purple-400'
            }`}>
              <Shield className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-white'}`} />
            </div>
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-300 ${
              darkMode
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {/* Email Field */}
          <div>
            <label className={`block mb-3 font-semibold transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              📧 Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-800/60 border-2 border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:bg-gray-800/80 focus:shadow-lg focus:shadow-blue-500/20'
                  : 'bg-gray-100/80 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:bg-white focus:shadow-lg focus:shadow-blue-400/20'
              }`}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className={`block mb-3 font-semibold transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              🔑 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-800/60 border-2 border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:bg-gray-800/80 focus:shadow-lg focus:shadow-blue-500/20'
                  : 'bg-gray-100/80 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:bg-white focus:shadow-lg focus:shadow-blue-400/20'
              }`}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              darkMode
                ? 'bg-red-500/15 border-red-500/50 text-red-400'
                : 'bg-red-100/70 border-red-400/50 text-red-700'
            }`}>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg ${
              darkMode
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg hover:shadow-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin">⟳</div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login as Admin</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className={`flex items-center gap-3 transition-colors duration-300 ${
            darkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium">Secure Access</span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>

          {/* Info Text */}
          <p className={`text-center text-sm font-medium transition-colors duration-300 ${
            darkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Only authorized admins can access this panel
          </p>
        </form>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
