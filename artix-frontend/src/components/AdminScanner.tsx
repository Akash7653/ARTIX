import { useState, useEffect } from 'react';
import { LogOut, Download, CheckCircle2, XCircle, BarChart3, Clock, Eye, EyeOff, Mail } from 'lucide-react';
import { api } from '../lib/api';

interface Registration {
  _id: string;
  registration_id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  year_of_study: string;
  branch: string;
  roll_number: string;
  selected_events: string[];
  total_amount: number;
  transaction_id: string;
  utr_id: string;
  approval_status: 'pending' | 'approved';
  selected_for_event: boolean | null;
  verification_id?: string;
  created_at: string;
  payment_screenshot_base64?: string;
  payment_screenshot_mimetype?: string;
  team_members?: Array<{ member_name: string; member_branch: string; member_phone: string }>;
}

interface Stats {
  totalRegistrations: number;
  approvedEntries: number;
  rejectedEntries: number;
  pendingEntries: number;
  approvedRevenue: number;
  pendingRevenue: number;
}

const ADMIN_PASSWORD = '23J41A69A3';

export function AdminScanner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      loadData();
    } else {
      setMessage('❌ Invalid password');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, exportRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/stats`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL}/admin/export`).then(r => r.json())
      ]);
      
      setStats(statsRes);
      // The export endpoint returns data in excel format, but we need the raw registrations
      // Let's fetch all registrations directly from the database
      // For now we'll use the export data and map it back
    } catch (err) {
      console.error('Failed to load data:', err);
      setMessage('⚠️ Failed to load data');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleApprove = async (registrationId: string) => {
    setProcessingId(registrationId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });

      if (!response.ok) throw new Error('Approval failed');
      
      const result = await response.json();
      
      // Update local state
      setRegistrations(prev => prev.map(r => 
        r.registration_id === registrationId 
          ? { ...r, approval_status: 'approved', selected_for_event: true, verification_id: result.registration?.verification_id }
          : r
      ));
      
      setMessage(`✅ Participant APPROVED! Verification ID: ${result.registration?.verification_id}`);
      setMessageType('success');
      
      // Reload stats
      setTimeout(loadData, 1000);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Failed to approve participant');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (registrationId: string) => {
    setProcessingId(registrationId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected: true })
      });

      if (!response.ok) throw new Error('Rejection failed');
      
      // Update local state
      setRegistrations(prev => prev.map(r => 
        r.registration_id === registrationId 
          ? { ...r, approval_status: 'approved', selected_for_event: false }
          : r
      ));
      
      setMessage('❌ Participant REJECTED');
      setMessageType('success');
      
      // Reload stats
      setTimeout(loadData, 1000);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to reject participant');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/export`);
      const data = await response.json();
      
      // Convert to CSV
      const headers = Object.keys(data.data[0] || {});
      const csv = [
        headers.join(','),
        ...data.data.map((row: any) => 
          headers.map(header => {
            const value = row[header]?.toString().replace(/,/g, ';') || '';
            return `"${value}"`;
          }).join(',')
        )
      ].join('\n');
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ARTIX-Registrations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      setMessage('✅ Data exported successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to export data');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadRegistrations = async () => {
    // This is a placeholder - in a real app, we'd have an endpoint to fetch all registrations
    // For now, we'll show a message to the user
    setMessage('📋 Registrations list feature coming soon. Use Excel Export for full data.');
    setTimeout(() => setMessage(''), 4000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-400">ARTIX 2K26 Event Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition"
                  placeholder="Enter password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Login
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center font-semibold ${
              messageType === 'error' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">ARTIX 2K26 Registration Management</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 px-4 md:px-6 py-3 rounded-lg hover:bg-red-500/30 transition font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg font-semibold animate-slide-in ${
            messageType === 'error' 
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-green-500/20 text-green-300 border border-green-500/30'
          }`}>
            {message}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Registrations</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.totalRegistrations}</p>
                </div>
                <BarChart3 className="w-12 h-12 text-blue-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Approved</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{stats.approvedEntries}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rejected</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.rejectedEntries}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pendingEntries}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Approved Revenue</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">₹{stats.approvedRevenue}</p>
                </div>
                <Mail className="w-12 h-12 text-purple-400 opacity-30" />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={loadRegistrations}
            className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition font-semibold"
          >
            📋 View Registrations
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 txt-green-300 px-6 py-3 rounded-lg hover:bg-green-500/30 transition font-semibold"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition font-semibold"
          >
            🔄 Refresh Stats
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <p className="text-blue-300 font-semibold mb-3">💡 How to Use Admin Dashboard:</p>
          <ul className="text-blue-200 space-y-2 text-sm md:text-base">
            <li>✓ Use <strong>Export to Excel</strong> to download all registrations with their details</li>
            <li>✓ Review Transaction ID and UTR ID from each participant's payment screenshot</li>
            <li>✓ Verify payment amount matches the selected events total</li>
            <li>✓ Use the <strong>Approve/Reject</strong> option (coming with registration search)</li>
            <li>✓ On approval, a unique Verification ID is automatically generated and can be sent via email</li>
            <li>✓ Track revenue - only approved registrations count toward total revenue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

