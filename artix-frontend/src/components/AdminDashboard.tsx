import { useState, useEffect } from 'react';
import { CheckCircle2, X, User, Phone, BookOpen, Users, Moon, Sun, LogOut, Search, BarChart3, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface AdminStats {
  totalRegistrations: number;
  pendingEntries: number;
  verifiedEntries: number;
  totalRevenue: number;
}

interface ScanResult {
  success: boolean;
  registration?: {
    registration_id: string;
    verification_id?: string;
    full_name: string;
    phone: string;
    college_name: string;
    branch: string;
    selected_events: string[];
    total_amount: number;
    entry_status: string;
    transaction_id?: string;
    utr_id?: string;
    payment_screenshot_base64?: string;
    payment_screenshot_mimetype?: string;
    payment_screenshot_filename?: string;
    team_members?: Array<{ name: string; branch: string; phone: string }>;
  };
  error?: string;
}

interface Props {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: Props) {
  const [searchId, setSearchId] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [transactionId, setTransactionId] = useState('');
  const [utrId, setUtrId] = useState('');
  const [confirmedEntry, setConfirmedEntry] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalRegistrations: 0,
    pendingEntries: 0,
    verifiedEntries: 0,
    totalRevenue: 0
  });

  // Fetch admin stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔄 Fetching fresh stats...');
        const data = await api.getAdminStats();
        console.log('✅ Fresh data received:', data);
        setStats(data);
      } catch (err) {
        console.error('❌ Failed to fetch stats:', err);
      }
    };

    // Fetch immediately on mount
    fetchStats();
    
    // Refresh every 3 seconds (faster for real-time updates)
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Refresh stats function
  const refreshStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
      console.log('✅ Stats refreshed:', data);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  // Search by verification ID or registration ID
  const handleSearch = async () => {
    if (!searchId.trim()) {
      setError('Please enter a Verification ID or Registration ID');
      return;
    }

    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const data = await api.getRegistration(searchId.trim());
      setScanResult({
        success: true,
        registration: {
          registration_id: data.registration.registration_id,
          verification_id: data.registration.verification_id,
          full_name: data.registration.full_name,
          phone: data.registration.phone,
          college_name: data.registration.college_name,
          branch: data.registration.branch,
          selected_events: data.registration.selected_events || [],
          total_amount: data.registration.total_amount,
          entry_status: data.registration.entry_status,
          transaction_id: data.registration.transaction_id,
          utr_id: data.registration.utr_id,
          payment_screenshot_base64: data.registration.payment_screenshot_base64,
          payment_screenshot_mimetype: data.registration.payment_screenshot_mimetype,
          payment_screenshot_filename: data.registration.payment_screenshot_filename,
          team_members: data.teamMembers
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration not found');
      setScanResult({ success: false, error: 'Not found' });
    } finally {
      setLoading(false);
    }
  };

  // Confirm entry with transaction details
  const handleConfirmEntry = async () => {
    if (!scanResult?.registration || !transactionId || !utrId) {
      setError('Please enter both Transaction ID and UTR ID');
      return;
    }

    setLoading(true);
    try {
      const data = await api.verifyEntry(
        scanResult.registration.registration_id,
        transactionId,
        utrId
      );

      setConfirmedEntry({
        ...scanResult.registration,
        verification_id: data.verificationId || scanResult.registration.verification_id,
        verified_at: new Date().toISOString()
      });
      
      // Reset state
      setScanResult(null);
      setSearchId('');
      setTransactionId('');
      setUtrId('');
      
      // Refresh stats
      await refreshStats();
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-screen overflow-y-auto overflow-x-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    } p-4 md:p-8`}>
      {/* Header with Theme Toggle */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
          <div className="flex-1">
            <h1 className={`text-3xl md:text-5xl font-bold mb-2 md:mb-3 flex items-center gap-2 md:gap-3 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Search className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              Admin Dashboard
            </h1>
            <p className={`text-sm md:text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Real-time participant verification & entry management
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Refresh Stats Button */}
            <button
              onClick={refreshStats}
              className={`p-2 md:p-3 rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-cyan-600'
              }`}
              title="Refresh statistics"
            >
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 animate-spin-slow" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 md:p-3 rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm md:text-base"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Admin Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 md:mb-12">
          {/* Total Registrations */}
          <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 border-2 ${
            isDarkMode
              ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/40 hover:border-blue-500/60 shadow-lg'
              : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-300 hover:border-blue-500 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-200'
              }`}>
                <Users className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-200 text-blue-700'
              }`}>
                Total
              </span>
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats.totalRegistrations}
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Registrations
            </p>
          </div>

          {/* Pending Entries */}
          <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 border-2 ${
            isDarkMode
              ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/40 hover:border-yellow-500/60 shadow-lg'
              : 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 hover:border-yellow-500 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-200'
              }`}>
                <Clock className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-200 text-yellow-700'
              }`}>
                Pending
              </span>
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats.pendingEntries}
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Awaiting Verification
            </p>
          </div>

          {/* Verified Entries */}
          <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 border-2 ${
            isDarkMode
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/40 hover:border-green-500/60 shadow-lg'
              : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 hover:border-green-500 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-green-500/20' : 'bg-green-200'
              }`}>
                <CheckCircle2 className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-200 text-green-700'
              }`}>
                Verified
              </span>
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats.verifiedEntries}
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Successfully Verified
            </p>
          </div>

          {/* Total Revenue */}
          <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 border-2 ${
            isDarkMode
              ? 'bg-gradient-to-br from-pink-900/30 to-rose-900/30 border-pink-500/40 hover:border-pink-500/60 shadow-lg'
              : 'bg-gradient-to-br from-pink-100 to-rose-100 border-pink-300 hover:border-pink-500 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-pink-500/20' : 'bg-pink-200'
              }`}>
                <BarChart3 className={`w-6 h-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                isDarkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-200 text-pink-700'
              }`}>
                Revenue
              </span>
            </div>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              ₹{stats.totalRevenue}
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Revenue
            </p>
          </div>
        </div>

        {/* Search Card */}
        <div className={`rounded-2xl p-4 md:p-8 backdrop-blur-md transition-all duration-300 mb-8 md:mb-12 ${
          isDarkMode
            ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-purple-500/30 shadow-xl hover:shadow-2xl'
            : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-purple-400 shadow-lg hover:shadow-xl'
        }`}>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              Search Registration
            </h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Verification ID or Registration ID..."
              className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border-2 transition-all duration-300 font-medium text-sm md:text-base ${
                isDarkMode
                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none'
              }`}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`w-full px-3 md:px-4 py-2 md:py-3 font-bold rounded-xl transition-all duration-300 text-sm md:text-base ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-lg disabled:opacity-50'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-lg disabled:opacity-50'
              }`}
            >
              {loading ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>
        </div>

        {/* Confirmed Entry Display */}
        {confirmedEntry && (
          <div className={`rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 mb-8 ${
            isDarkMode
              ? 'bg-gradient-to-br from-green-900/20 to-slate-900 border-2 border-green-500/30 shadow-2xl'
              : 'bg-gradient-to-br from-green-50 to-slate-50 border-2 border-green-300 shadow-xl'
          }`}>
            <div className="p-6 md:p-8">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-xl w-fit font-bold text-lg mb-6 ${
                isDarkMode
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                <CheckCircle2 className="w-6 h-6" />
                <span>✓ Entry Verified & Confirmed</span>
              </div>

              <div className={`rounded-xl p-5 mb-4 ${
                isDarkMode ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Participant
                </p>
                <p className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {confirmedEntry.full_name}
                </p>
                
                <div className="grid md:grid-cols-3 gap-3">
                  <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Verification ID</p>
                    <p className={`font-mono text-sm font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{confirmedEntry.verification_id}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Phone</p>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{confirmedEntry.phone}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Amount</p>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>₹{confirmedEntry.total_amount}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setConfirmedEntry(null)}
                className={`w-full px-6 py-3 font-bold rounded-xl transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white hover:shadow-lg'
                    : 'bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500 text-slate-900 hover:shadow-lg'
                }`}
              >
                ← Verify Another
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 md:mb-8 p-3 md:p-5 rounded-xl border-2 transition-all duration-300 ${
            isDarkMode
              ? 'bg-red-500/10 border-red-500/50 shadow-lg'
              : 'bg-red-50 border-red-300 shadow-md'
          }`}>
            <p className={`font-semibold text-sm md:text-lg flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              <X className="w-4 h-4 md:w-5 md:h-5" />
              {error}
            </p>
          </div>
        )}

        {/* Scan Result Container */}
        {scanResult && (
          <div className={`rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 ${
            scanResult.success && scanResult.registration
              ? isDarkMode
                ? 'bg-gradient-to-br from-emerald-900/20 to-slate-900 border-2 border-emerald-500/30 shadow-2xl'
                : 'bg-gradient-to-br from-emerald-50 to-slate-50 border-2 border-emerald-300 shadow-xl'
              : isDarkMode
                ? 'bg-gradient-to-br from-red-900/20 to-slate-900 border-2 border-red-500/30 shadow-2xl'
                : 'bg-gradient-to-br from-red-50 to-slate-50 border-2 border-red-300 shadow-xl'
          }`}>
            {scanResult.success && scanResult.registration ? (
              <div className="p-8 space-y-8">
                {/* Success Badge */}
                <div className={`flex items-center gap-3 px-6 py-4 rounded-xl w-fit font-bold text-lg ${
                  isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Registration Found ✓</span>
                </div>

                {/* Participant Info Card */}
                <div className={`rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-slate-800/40 border border-slate-700/50 shadow-xl'
                    : 'bg-white border border-slate-200 shadow-lg'
                }`}>
                  <h3 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    {scanResult.registration.full_name}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Verification ID */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Verification ID</p>
                      <p className={`font-mono font-bold text-lg ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{scanResult.registration.verification_id || scanResult.registration.registration_id}</p>
                    </div>

                    {/* Registration ID */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Registration ID</p>
                      <p className={`font-mono font-bold text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{scanResult.registration.registration_id}</p>
                    </div>

                    {/* Phone */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Phone</p>
                      <p className={`font-semibold text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <Phone className="w-4 h-4 text-blue-500" />
                        {scanResult.registration.phone}
                      </p>
                    </div>

                    {/* Branch */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Branch</p>
                      <p className={`font-semibold text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <BookOpen className="w-4 h-4 text-green-500" />
                        {scanResult.registration.branch.toUpperCase()}
                      </p>
                    </div>

                    {/* Total Amount */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Amount</p>
                      <p className={`font-bold text-2xl ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>₹{scanResult.registration.total_amount}</p>
                    </div>

                    {/* Entry Status */}
                    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Entry Status</p>
                      <p className={`font-bold text-lg px-4 py-2 rounded-lg w-fit ${
                        scanResult.registration.entry_status === 'verified'
                          ? isDarkMode
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-green-100 text-green-700 border border-green-300'
                          : isDarkMode
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      }`}>
                        {scanResult.registration.entry_status?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Events Section */}
                  {scanResult.registration.selected_events && scanResult.registration.selected_events.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-700/50">
                      <h4 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                        🎯 Selected Events
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {scanResult.registration.selected_events.map((event, i) => (
                          <span key={i} className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                            isDarkMode
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
                              : 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200'
                          }`}>
                            {event.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Members Section */}
                  {scanResult.registration.team_members && scanResult.registration.team_members.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-700/50">
                      <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                        <Users className="w-5 h-5" />
                        Team Members ({scanResult.registration.team_members.length})
                      </h4>
                      <div className="space-y-3">
                        {scanResult.registration.team_members.map((member, i) => (
                          <div key={i} className={`rounded-xl p-4 transition-all ${
                            isDarkMode
                              ? 'bg-slate-700/30 border border-slate-600/50 hover:bg-slate-700/50'
                              : 'bg-slate-100 border border-slate-300 hover:bg-slate-150'
                          }`}>
                            <p className={`font-semibold text-base mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {i === 0 ? '👑 ' : '👤 '}{member.name}
                            </p>
                            <p className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {member.branch.toUpperCase()} • {member.phone}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Screenshot */}
                  {scanResult.registration.payment_screenshot_base64 && (
                    <div className="mt-8 pt-8 border-t border-slate-700/50">
                      <h4 className={`font-bold mb-5 text-xl flex items-center gap-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                        💰 Payment Receipt
                      </h4>
                      <div className={`rounded-2xl overflow-hidden border-2 ${
                        isDarkMode
                          ? 'border-amber-500/30 bg-slate-900/30'
                          : 'border-amber-300 bg-amber-50'
                      } p-4 shadow-lg`}>
                        <img
                          src={`data:${scanResult.registration.payment_screenshot_mimetype || 'image/jpeg'};base64,${scanResult.registration.payment_screenshot_base64}`}
                          alt="Payment Receipt"
                          className={`w-full max-h-96 object-contain rounded-lg ${isDarkMode ? 'bg-black' : 'bg-white'}`}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className={`p-4 mt-4 rounded-lg border-l-4 ${
                          isDarkMode
                            ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                            : 'bg-blue-50 border-blue-500 text-blue-700'
                        }`}>
                          <p className="font-semibold text-sm mb-2">✓ Payment Image Details:</p>
                          <ul className="text-xs space-y-1 ml-4 list-disc">
                            <li><strong>Transaction ID</strong> should be visible in the image</li>
                            <li><strong>UTR ID</strong> should be visible in the image</li>
                            <li>Verify both IDs match before confirming entry</li>
                          </ul>
                        </div>
                        <p className={`text-xs p-3 text-center font-semibold mt-3 ${
                          isDarkMode
                            ? 'text-slate-400'
                            : 'text-slate-700'
                        }`}>
                          📄 {scanResult.registration.payment_screenshot_filename}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Verification Form - Only show if pending */}
                  {scanResult.registration.payment_screenshot_base64 && scanResult.registration.entry_status === 'pending' && (
                    <div className="mt-8 pt-8 border-t border-slate-700/50">
                      <h4 className={`font-bold mb-5 text-xl flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        ✓ Verify Payment Details
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                          <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Transaction ID
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter Transaction ID from receipt"
                            className={`w-full px-4 py-2 rounded-lg border-2 transition-all font-mono text-sm ${
                              isDarkMode
                                ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none'
                            }`}
                          />
                        </div>

                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                          <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            UTR ID
                          </label>
                          <input
                            type="text"
                            value={utrId}
                            onChange={(e) => setUtrId(e.target.value)}
                            placeholder="Enter UTR ID from receipt"
                            className={`w-full px-4 py-2 rounded-lg border-2 transition-all font-mono text-sm ${
                              isDarkMode
                                ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none'
                            }`}
                          />
                        </div>
                      </div>
                      <p className={`text-xs mt-3 p-3 rounded-lg ${
                        isDarkMode
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          : 'bg-blue-50 text-blue-700 border border-blue-300'
                      }`}>
                        ℹ️ Enter the Transaction ID and UTR ID visible in the payment receipt image above to verify the payment.
                      </p>
                    </div>
                  )}

                  {/* Already Verified Badge - Show if verified */}
                  {scanResult.registration.entry_status === 'verified' && (
                    <div className="mt-8 pt-8 border-t border-slate-700/50">
                      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl w-fit font-bold text-lg ${
                        isDarkMode
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-green-100 text-green-700 border border-green-300'
                      }`}>
                        <CheckCircle2 className="w-6 h-6" />
                        <span>✓ Already Verified</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Confirm Entry Button - Only show if pending */}
                  {scanResult.registration.entry_status === 'pending' && (
                    <button
                      onClick={handleConfirmEntry}
                      disabled={loading || !transactionId || !utrId}
                      className={`px-6 py-4 font-bold rounded-xl transition-all duration-300 text-lg disabled:opacity-50 ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-lg'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {loading ? '⏳ Confirming...' : '✓ Confirm Entry'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setSearchId('');
                      setTransactionId('');
                      setUtrId('');
                    }}
                    className={`px-6 py-4 font-bold rounded-xl transition-all duration-300 text-lg ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white hover:shadow-lg'
                        : 'bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500 text-slate-900 hover:shadow-lg'
                    }`}
                  >
                    ← Verify Another
                  </button>
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 px-8 rounded-2xl backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gradient-to-br from-red-900/20 to-slate-900/20 border-2 border-red-500/30'
                  : 'bg-gradient-to-br from-red-50 to-slate-50 border-2 border-red-300'
              }`}>
                <X className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`font-bold text-xl mb-6 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                  {scanResult?.error || 'Registration not found'}
                </p>
                <button
                  onClick={() => setScanResult(null)}
                  className={`px-6 py-3 font-bold rounded-xl transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white hover:shadow-lg'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white hover:shadow-lg'
                  }`}
                >
                  ← Try Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
