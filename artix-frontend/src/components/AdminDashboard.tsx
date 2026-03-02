import { useState, useEffect } from 'react';
import { LogOut, Download, CheckCircle2, XCircle, BarChart3, Clock, Eye, EyeOff, Mail, MessageCircle, Search, RefreshCw, Send } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

interface TeamMember {
  member_name: string;
  member_branch: string;
  member_phone: string;
  is_team_leader?: boolean;
}

interface Registration {
  _id: string;
  registration_id: string;
  verification_id?: string;
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
  team_members: TeamMember[];
  created_at: string;
  notification_sent: boolean;
  entry_verified_at?: string;
}

interface Stats {
  totalRegistrations: number;
  approvedEntries: number;
  rejectedEntries: number;
  pendingEntries: number;
  verifiedEntries: number;
  approvedRevenue: number;
  pendingRevenue: number;
}

const ADMIN_PASSWORD = '23J41A69A3';

interface Props {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [verificationIdInput, setVerificationIdInput] = useState<{ [key: string]: string }>({});
  const [settingVerificationId, setSettingVerificationId] = useState<string | null>(null);
  const [entryVerificationId, setEntryVerificationId] = useState('');
  const [verifyingEntry, setVerifyingEntry] = useState(false);
  const [darkMode, setDarkMode] = useState(true);


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
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      console.log('📊 Loading admin data from:', baseUrl);
      
      const statsRes = await fetch(`${baseUrl}/admin/stats`, { headers });
      console.log('📊 Stats fetch status:', statsRes.status, statsRes.statusText);
      const statsData = await statsRes.json();
      console.log('📊 Stats response:', statsData);
      
      const regsRes = await fetch(`${baseUrl}/admin/registrations`, { headers });
      console.log('📋 Registrations fetch status:', regsRes.status, regsRes.statusText);
      const regsData = await regsRes.json();
      console.log('📋 Registrations FULL response:', regsData);
      console.log('📋 Registrations response keys:', Object.keys(regsData));
      console.log('📋 Registrations data field:', regsData.data);
      console.log('📋 Registrations success field:', regsData.success);
      
      if (!regsRes.ok) {
        throw new Error(`Registrations API error: ${regsRes.status} ${regsRes.statusText}`);
      }
      
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      }
      
      // Check all possible response structures
      let registrationsArray = [];
      if (regsData?.data && Array.isArray(regsData.data)) {
        registrationsArray = regsData.data;
        console.log('✅ Found data in response.data:', registrationsArray.length);
      } else if (Array.isArray(regsData)) {
        registrationsArray = regsData;
        console.log('✅ Response is array directly:', registrationsArray.length);
      } else if (regsData?.registrations && Array.isArray(regsData.registrations)) {
        registrationsArray = regsData.registrations;
        console.log('✅ Found data in response.registrations:', registrationsArray.length);
      } else {
        console.warn('⚠️ Could not find array in response. Full response:', regsData);
      }
      
      console.log('📋 Setting registrations:', registrationsArray.length, 'items');
      setRegistrations(registrationsArray);
      
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      setMessage('⚠️ Failed to load data: ' + err.message);
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleApprove = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });

      if (!response.ok) throw new Error('Approval failed');
      
      const result = await response.json();
      setMessage(`✅ Approved! Now enter the Verification ID.`);
      setMessageType('success');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Failed to approve');
      setMessageType('error');
      console.error(err);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReject = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected: true })
      });

      if (!response.ok) throw new Error('Rejection failed');
      
      setMessage('❌ Participant Rejected');
      setMessageType('success');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to reject');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSetVerificationId = async (registrationId: string) => {
    const verificationId = verificationIdInput[registrationId]?.trim();
    
    if (!verificationId) {
      setMessage('❌ Please enter a verification ID');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSettingVerificationId(registrationId);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      const response = await fetch(`${baseUrl}/admin/set-verification-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, verificationId })
      });

      if (!response.ok) throw new Error('Failed to set verification ID');
      
      setMessage(`✅ Verification ID set successfully!`);
      setMessageType('success');
      setVerificationIdInput({ ...verificationIdInput, [registrationId]: '' });
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Failed to set verification ID');
      setMessageType('error');
      console.error(err);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSettingVerificationId(null);
    }
  };

  const handleVerifyEntry = async () => {
    const verificationId = entryVerificationId.trim();
    
    if (!verificationId) {
      setMessage('❌ Please enter a verification ID to verify');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setVerifyingEntry(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      const response = await fetch(`${baseUrl}/admin/verify-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_id: verificationId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }
      
      const result = await response.json();
      setMessage(`✅ Entry Verified! ${result.participant.full_name} from ${result.participant.college_name}`);
      setMessageType('success');
      setEntryVerificationId('');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(`❌ ${err.message || 'Failed to verify entry'}`);
      setMessageType('error');
      console.error(err);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setVerifyingEntry(false);
    }
  };

  const generateWhatsAppMessage = (reg: Registration): string => {
    const lines = [
      'ARTIX 2026 - REGISTRATION APPROVED',
      '',
      'Your registration has been approved!',
      '',
      'Verification Details:',
      `Verification ID: ${reg.verification_id}`,
      '',
      'Participant Information:',
      `Name: ${reg.full_name}`,
      `College: ${reg.college_name || 'N/A'}`,
      `Branch: ${reg.branch}`,
      `Year: ${reg.year_of_study}`,
      `Phone: ${reg.phone}`,
      ''
    ];

    // Add team members if they exist
    if (reg.team_members && reg.team_members.length > 0) {
      lines.push('Team Members:');
      reg.team_members.forEach((member) => {
        lines.push(`${member.member_name} - ${member.member_branch} - ${member.member_phone}`);
      });
      lines.push('');
    }

    lines.push('Event Details:');
    lines.push(`Events: ${reg.selected_events.join(', ')}`);
    lines.push(`Total Amount: Rs ${reg.total_amount}`);
    lines.push(`Registration ID: ${reg.registration_id}`);
    lines.push('');
    lines.push('Verification Instructions:');
    lines.push('Use your Verification ID at the event registration desk for quick entry verification.');
    lines.push('');
    lines.push('For assistance, contact ARTIX Admin Team');
    
    return lines.join('\n');
  };

  const handleSendNotification = async (registrationId: string, method: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      const response = await fetch(`${baseUrl}/admin/confirm-and-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, method })
      });

      if (response.ok) {
        console.log(`✅ Notification marked as sent for ${registrationId}`);
        setTimeout(loadData, 1000); // Reload data to update notification status
      }
    } catch (err) {
      console.error('Failed to mark notification as sent:', err);
    }
  };

  const handleSendWhatsAppDirect = async (reg: Registration) => {
    try {
      setSendingNotification(reg.registration_id);
      
      const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
      console.log(`📱 Sending WhatsApp to ${reg.phone} via API: ${baseUrl}/admin/send-whatsapp-to-participant`);
      
      const response = await fetch(`${baseUrl}/admin/send-whatsapp-to-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: reg.registration_id })
      });

      const data = await response.json();
      console.log('📱 WhatsApp API Response:', data);

      if (response.ok && data.success) {
        // New free WhatsApp Web approach - provide wa.me link
        if (data.details && data.details.waLink) {
          const waLink = data.details.waLink;
          const participantName = data.details.participantName || 'participant';
          const confirmOpen = window.confirm(
            `✅ WhatsApp ready!\n\nParticipant: ${participantName}\nPhone: ${reg.phone}\n\nClick OK to open WhatsApp Web to send the message.`
          );
          
          if (confirmOpen) {
            // Open WhatsApp Web in new tab
            window.open(waLink, '_blank');
            alert('✅ WhatsApp opened! Please send the message to ' + participantName);
          }
        } else {
          alert('✅ ' + (data.message || 'Message ready to send'));
        }
        // Reload data to update notification status
        setTimeout(loadData, 1500);
      } else {
        const errorMsg = data.error || data.message || 'Unknown error occurred';
        console.error('❌ WhatsApp Error:', errorMsg);
        alert('❌ Failed to prepare WhatsApp message:\n\n' + errorMsg);
      }
    } catch (err) {
      console.error('❌ Error sending WhatsApp:', err);
      alert('❌ Error: ' + (err instanceof Error ? err.message : 'Failed to send WhatsApp message'));
    } finally {
      setSendingNotification(null);
    }
  };

  const handleExportToExcel = () => {
    try {
      // Transform registrations data for export
      const exportData = registrations.map(reg => ({
        registration_id: reg.registration_id,
        verification_id: reg.verification_id || '',
        full_name: reg.full_name,
        email: reg.email,
        phone: reg.phone,
        college: reg.college_name,
        branch: reg.branch,
        year: reg.year_of_study,
        selected_events: reg.selected_events,
        total_amount: reg.total_amount,
        transaction_id: reg.transaction_id,
        utr_id: reg.utr_id,
        approval_status: reg.approval_status,
        entry_status: reg.selected_for_event,
        team_members: reg.team_members.map(m => ({
          name: m.member_name,
          email: '',
          phone: m.member_phone,
          branch: m.member_branch,
          year: ''
        })),
        created_at: reg.created_at,
        notification_sent: reg.notification_sent
      }));

      const result = exportToExcel(exportData, 'ARTIX-AdminDashboard');
      if (result.success) {
        setMessage('✅ Excel file exported successfully');
        setMessageType('success');
      } else {
        setMessage(`❌ Export failed: ${result.error}`);
        setMessageType('error');
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setMessage('❌ Failed to export to Excel');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Auto-load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const filteredRegistrations = registrations.filter(reg =>
    reg.registration_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className={`h-screen transition-colors duration-300 flex items-center justify-center p-4 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        <div className={`max-w-md w-full backdrop-blur-md rounded-2xl p-8 border transition-all ${
          darkMode
            ? 'bg-gray-800/40 border-gray-700/50'
            : 'bg-white/40 border-gray-300/50'
        }`}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Access
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ARTIX 2K26 Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`block font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none transition border-2 ${
                    darkMode
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white/60 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 transition ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition"
            >
              Login
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center font-semibold border transition-all ${
              messageType === 'error' 
                ? darkMode 
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-red-100 text-red-700 border-red-300'
                : darkMode
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-green-100 text-green-700 border-green-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-y-auto transition-colors duration-300 p-4 md:p-8 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Dashboard
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ARTIX 2K26 Registration Management</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-lg transition font-semibold border ${
                darkMode
                  ? 'bg-gray-700/40 border-gray-600/50 text-yellow-300 hover:bg-gray-600/40'
                  : 'bg-gray-200/40 border-gray-300/50 text-gray-800 hover:bg-gray-300/40'
              }`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                onLogout();
              }}
              className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 px-4 md:px-6 py-3 rounded-lg hover:bg-red-500/30 transition font-semibold"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg font-semibold animate-slide-in border transition-all ${
            messageType === 'error' 
              ? darkMode
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-red-100 text-red-700 border-red-300'
              : darkMode
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-green-100 text-green-700 border-green-300'
          }`}>
            {message}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className={`rounded-xl p-6 border transition-all ${
              darkMode
                ? 'bg-gray-800/40 border-gray-700/50'
                : 'bg-white/40 border-gray-300/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Registered</p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalRegistrations}</p>
                </div>
                <BarChart3 className={`w-12 h-12 opacity-30 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>

            <div className={`rounded-xl p-6 border transition-all ${
              darkMode
                ? 'bg-gray-800/40 border-gray-700/50'
                : 'bg-white/40 border-gray-300/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.approvedEntries}</p>
                </div>
                <CheckCircle2 className={`w-12 h-12 opacity-30 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>

            <div className={`rounded-xl p-6 border transition-all ${
              darkMode
                ? 'bg-gray-800/40 border-gray-700/50'
                : 'bg-white/40 border-gray-300/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rejected</p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.rejectedEntries}</p>
                </div>
                <XCircle className={`w-12 h-12 opacity-30 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
            </div>

            <div className={`rounded-xl p-6 border transition-all ${
              darkMode
                ? 'bg-gray-800/40 border-gray-700/50'
                : 'bg-white/40 border-gray-300/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.pendingEntries}</p>
                </div>
                <Clock className={`w-12 h-12 opacity-30 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
            </div>

            <div className={`rounded-xl p-6 border transition-all ${
              darkMode
                ? 'bg-gray-800/40 border-gray-700/50'
                : 'bg-white/40 border-gray-300/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Entry Verified</p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{stats.verifiedEntries}</p>
                </div>
                <CheckCircle2 className={`w-12 h-12 opacity-30 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
            </div>

            <div className={`rounded-xl p-6 border transition-all ${
              darkMode
                ? 'bg-gray-800/40 border-gray-700/50'
                : 'bg-white/40 border-gray-300/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved Revenue</p>
                  <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>₹{stats.approvedRevenue?.toLocaleString()}</p>
                </div>
                <Mail className={`w-12 h-12 opacity-30 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 border ${
              darkMode
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                : 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={async () => {
              if (!window.confirm('⚠️ WARNING: This will DELETE ALL registrations, payments, and team members!\n\nAre you absolutely sure? This cannot be undone.')) {
                return;
              }

              if (!window.confirm('🗑️ FINAL CONFIRMATION: Delete all data?')) {
                return;
              }

              try {
                const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
                const response = await fetch(`${baseUrl}/admin/clear-database`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ adminPassword: '23J41A69A3' })
                });

                if (!response.ok) throw new Error('Failed to clear database');

                setMessage('✅ Database cleared successfully! All data has been removed.');
                setMessageType('success');
                setTimeout(() => {
                  loadData();
                  setMessage('');
                }, 1000);
              } catch (err) {
                setMessage('❌ Failed to clear database');
                setMessageType('error');
                setTimeout(() => setMessage(''), 3000);
              }
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 border ${
              darkMode
                ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30'
                : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
            }`}
          >
            🗑️ Clear Database
          </button>
        </div>

        {/* Event Entry Verification Section */}
        <div className={`mb-6 rounded-xl p-6 border ${
          darkMode
            ? 'bg-indigo-500/10 border-indigo-500/30'
            : 'bg-indigo-50 border-indigo-300'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Event Entry Verification</h3>
          </div>
          <p className={`text-sm mb-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Verify participant entry at the event by scanning or entering their verification ID</p>
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-72">
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enter Verification ID</label>
              <input
                type="text"
                value={entryVerificationId}
                onChange={(e) => setEntryVerificationId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerifyEntry()}
                placeholder="Scan or type verification ID here..."
                autoFocus
                className={`w-full px-4 py-3 rounded-lg focus:outline-none transition border-2 font-mono text-lg ${
                  darkMode
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500'
                    : 'bg-white/60 border-indigo-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
                }`}
              />
            </div>
            <button
              onClick={handleVerifyEntry}
              disabled={verifyingEntry}
              className={`px-8 py-3 font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap hover:scale-105 ${
                darkMode
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {verifyingEntry ? 'Verifying...' : 'Verify Entry'}
            </button>
          </div>
        </div>

        {/* Search & Export */}
        <div className="mb-6 flex gap-4 flex-col md:flex-row">
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-3 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or registration ID..."
              className={`w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none transition border-2 ${
                darkMode
                  ? 'bg-gray-800/40 border-gray-700/50 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-white/40 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              }`}
            />
          </div>
          <button
            onClick={handleExportToExcel}
            className={`px-6 py-3 font-bold rounded-lg transition flex items-center gap-2 whitespace-nowrap hover:scale-105 ${
              darkMode
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            }`}
          >
            <Download className="w-5 h-5" />
            Export Excel
          </button>

        </div>

        {/* Registrations Table */}
        <div className={`rounded-xl overflow-hidden border-2 ${
          darkMode
            ? 'bg-gray-800/40 border-gray-700/50'
            : 'bg-white/40 border-gray-300'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${
                  darkMode
                    ? 'border-gray-700/50 bg-gray-900/50'
                    : 'border-gray-300 bg-gray-100'
                }`}>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Name</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Phone</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Status</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Amount</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg._id} className={`border-b transition ${
                    darkMode
                      ? 'border-gray-700/30 hover:bg-gray-800/30'
                      : 'border-gray-300 hover:bg-gray-200/30'
                  }`}>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      <div className="font-semibold">{reg.full_name}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{reg.registration_id}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{reg.email}</td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{reg.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reg.approval_status === 'pending'
                          ? darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          : reg.selected_for_event
                          ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                          : darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {reg.approval_status === 'pending' ? 'Pending' : reg.selected_for_event ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${
                      darkMode ? 'text-purple-400' : 'text-purple-700'
                    }`}>₹{reg.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setExpandedId(expandedId === reg._id ? null : reg._id)}
                        className={`px-3 py-1 rounded text-xs transition hover:scale-105 ${
                          darkMode
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {expandedId === reg._id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No registrations found
            </div>
          )}
        </div>

        {/* Expanded Row Details */}
        {expandedId && (
          <div className={`mt-6 rounded-xl p-6 border-2 ${
            darkMode
              ? 'bg-gray-800/40 border-gray-700/50'
              : 'bg-white/40 border-gray-300'
          }`}>
            {(() => {
              const reg = filteredRegistrations.find(r => r._id === expandedId);
              if (!reg) return null;

              const totalHeadCount = (reg.team_members?.length || 0) + 1;

              return (
                <div className="space-y-6">
                  {/* Personal Details */}
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Personal Details</h3>
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg ${
                      darkMode
                        ? 'bg-gray-900/30'
                        : 'bg-gray-100/50'
                    }`}>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{reg.full_name}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>College</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{reg.college_name}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Branch / Year</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{reg.branch} ({reg.year_of_study})</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Payment Details</h3>
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg ${
                      darkMode
                        ? 'bg-gray-900/30'
                        : 'bg-gray-100/50'
                    }`}>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transaction ID</p>
                        <p className={`font-mono text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{reg.transaction_id}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>UTR ID</p>
                        <p className={`font-mono text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{reg.utr_id}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount</p>
                        <p className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>₹{reg.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Events & Team</h3>
                    <div className={`p-4 rounded-lg space-y-4 ${
                      darkMode
                        ? 'bg-gray-900/30'
                        : 'bg-gray-100/50'
                    }`}>
                      <div>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selected Events</p>
                        <div className="flex flex-wrap gap-2">
                          {reg.selected_events?.map((event, i) => (
                            <span key={i} className={`px-3 py-1 rounded-full text-xs border ${
                              darkMode
                                ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                                : 'bg-blue-100 text-blue-700 border-blue-300'
                            }`}>
                              {event.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {reg.team_members && reg.team_members.length > 0 && (
                        <div>
                          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Team Members ({totalHeadCount} head count)</p>
                          <div className="space-y-2">
                            <div className={`px-3 py-2 rounded text-sm border ${
                              darkMode
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            }`}>
                              👑 Team Leader: {reg.full_name}
                            </div>
                            {reg.team_members.map((member, i) => (
                              <div key={i} className={`px-3 py-2 rounded text-sm border ${
                                darkMode
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                              }`}>
                                👤 {member.member_name} - {member.member_branch} - {member.member_phone}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval Section */}
                  {reg.approval_status === 'pending' && (
                    <div>
                      <h3 className={`text-lg font-bold mb-4 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Approval Actions</h3>
                      <div className="flex gap-4 flex-wrap">
                        <button
                          onClick={() => handleApprove(reg.registration_id)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-semibold hover:scale-105 border ${
                            darkMode
                              ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                              : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(reg.registration_id)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-semibold hover:scale-105 border ${
                            darkMode
                              ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                              : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Entry Verification Section - Set Verification ID */}
                  {reg.approval_status === 'approved' && !reg.verification_id && (
                    <div>
                      <h3 className={`text-lg font-bold mb-4 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Entry Verification Details</h3>
                      <div className={`rounded-lg p-4 mb-4 border ${
                        darkMode
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-yellow-100 border-yellow-300'
                      }`}>
                        <p className={`text-sm ${
                          darkMode ? 'text-yellow-300' : 'text-yellow-800'
                        }`}>⚠️ Enter the Verification ID that the participant will use at event entry</p>
                      </div>
                      <div className="flex gap-4 flex-wrap items-end">
                        <div className="flex-1 min-w-64">
                          <label className={`block text-sm font-semibold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Verification ID</label>
                          <input
                            type="text"
                            value={verificationIdInput[reg.registration_id] || ''}
                            onChange={(e) => setVerificationIdInput({ ...verificationIdInput, [reg.registration_id]: e.target.value })}
                            placeholder="e.g., VER001, ARTIX-12345, etc."
                            className={`w-full px-4 py-2 rounded-lg focus:outline-none transition border-2 ${
                              darkMode
                                ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-500'
                                : 'bg-white/60 border-yellow-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500'
                            }`}
                          />
                        </div>
                        <button
                          onClick={() => handleSetVerificationId(reg.registration_id)}
                          disabled={settingVerificationId === reg.registration_id}
                          className={`px-6 py-2 rounded-lg transition font-semibold disabled:opacity-50 hover:scale-105 border ${
                            darkMode
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
                          }`}
                        >
                          {settingVerificationId === reg.registration_id ? 'Setting...' : 'Set ID'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notification Section */}
                  {reg.approval_status === 'approved' && reg.verification_id && (
                    <div>
                      <h3 className={`text-lg font-bold mb-4 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>Send via WhatsApp</h3>
                      <div className={`rounded-lg p-4 mb-4 border ${
                        darkMode
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-green-100 border-green-300'
                      }`}>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>Verification ID: <span className={`font-mono font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{reg.verification_id}</span></p>
                        <p className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-800'}`}>📱 Sending to: +91 {reg.phone}</p>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>Message includes verification ID, participant details, team members (if any), and event information</p>
                      </div>
                      <div className="flex gap-4 flex-wrap items-center">
                        <button
                          onClick={() => handleSendWhatsAppDirect(reg)}
                          disabled={sendingNotification === reg.registration_id}
                          className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-semibold disabled:opacity-50 hover:scale-105 ${
                            darkMode
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          }`}
                        >
                          <MessageCircle className="w-5 h-5" />
                          Send to Participant WhatsApp
                        </button>
                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                          reg.notification_sent 
                            ? darkMode ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300'
                            : darkMode ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          📤 Notification: {reg.notification_sent ? '✅ Sent' : '⏳ Not Sent'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}


      </div>
    </div>
  );
}
