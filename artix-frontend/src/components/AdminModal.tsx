import { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: Props) {
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
        <AdminDashboard onLogout={() => {
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
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border-2 border-red-500/30 shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-500/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Enter admin email"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Enter admin password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border-2 border-red-500/50">
              <p className="text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Info Text */}
          <p className="text-center text-sm text-gray-500">
            Only authorized admins can access this panel
          </p>
        </form>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
