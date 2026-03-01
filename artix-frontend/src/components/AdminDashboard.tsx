import { useState, useEffect } from 'react';
import { LogOut, Download, CheckCircle2, XCircle, BarChart3, Clock, Eye, EyeOff, Mail, MessageCircle, Search, RefreshCw } from 'lucide-react';

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
      const baseUrl = import.meta.env.VITE_API_URL;
      const [statsRes, regsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/stats`).then(r => r.json()),
        fetch(`${baseUrl}/admin/registrations`).then(r => r.json())
      ]);
      
      setStats(statsRes);
      setRegistrations(regsRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setMessage('⚠️ Failed to load data');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleApprove = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });

      if (!response.ok) throw new Error('Approval failed');
      
      const result = await response.json();
      setMessage(`✅ Approved! Verification ID: ${result.registration?.verification_id}`);
      setMessageType('success');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ Failed to approve');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReject = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/registrations/${registrationId}/approve`, {
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

  const handleSendNotification = async (registrationId: string, method: 'email' | 'whatsapp' | 'both') => {
    setSendingNotification(registrationId);
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/admin/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, method })
      });

      if (!response.ok) throw new Error('Notification failed');
      
      const methodName = method === 'both' ? 'Email & WhatsApp' : method === 'email' ? 'Email' : 'WhatsApp';
      setMessage(`✅ ${methodName} notification sent!`);
      setMessageType('success');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Failed to send ${method} notification`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSendingNotification(null);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Access
            </h1>
            <p className="text-gray-400">ARTIX 2K26 Dashboard</p>
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
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">ARTIX 2K26 Registration Management</p>
          </div>
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
                  <p className="text-gray-400 text-sm">Total Registered</p>
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
                  <p className="text-3xl font-bold text-purple-400 mt-2">₹{stats.approvedRevenue?.toLocaleString()}</p>
                </div>
                <Mail className="w-12 h-12 text-purple-400 opacity-30" />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or registration ID..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-900/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg._id} className="border-b border-gray-700/30 hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4 text-sm text-gray-200">
                      <div className="font-semibold">{reg.full_name}</div>
                      <div className="text-xs text-gray-500">{reg.registration_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{reg.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{reg.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reg.approval_status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : reg.selected_for_event
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {reg.approval_status === 'pending' ? 'Pending' : reg.selected_for_event ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-purple-400">₹{reg.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setExpandedId(expandedId === reg._id ? null : reg._id)}
                        className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded text-xs hover:bg-blue-500/30 transition"
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
            <div className="p-8 text-center text-gray-400">
              No registrations found
            </div>
          )}
        </div>

        {/* Expanded Row Details */}
        {expandedId && (
          <div className="mt-6 bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
            {(() => {
              const reg = filteredRegistrations.find(r => r._id === expandedId);
              if (!reg) return null;

              const totalHeadCount = (reg.team_members?.length || 0) + 1;

              return (
                <div className="space-y-6">
                  {/* Personal Details */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900/30 p-4 rounded-lg">
                      <div>
                        <p className="text-gray-400 text-sm">Full Name</p>
                        <p className="text-gray-200 font-semibold">{reg.full_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">College</p>
                        <p className="text-gray-200 font-semibold">{reg.college_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Branch / Year</p>
                        <p className="text-gray-200 font-semibold">{reg.branch} ({reg.year_of_study})</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Payment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900/30 p-4 rounded-lg">
                      <div>
                        <p className="text-gray-400 text-sm">Transaction ID</p>
                        <p className="text-gray-200 font-mono text-sm">{reg.transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">UTR ID</p>
                        <p className="text-gray-200 font-mono text-sm">{reg.utr_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p className="text-green-400 text-lg font-bold">₹{reg.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Events & Team</h3>
                    <div className="bg-gray-900/30 p-4 rounded-lg space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Selected Events</p>
                        <div className="flex flex-wrap gap-2">
                          {reg.selected_events?.map((event, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs border border-blue-500/50">
                              {event.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {reg.team_members && reg.team_members.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-sm mb-2">Team Members ({totalHeadCount} head count)</p>
                          <div className="space-y-2">
                            <div className="px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded text-sm border border-yellow-500/30">
                              👑 Team Leader: {reg.full_name}
                            </div>
                            {reg.team_members.map((member, i) => (
                              <div key={i} className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded text-sm border border-blue-500/30">
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
                      <h3 className="text-lg font-bold text-gray-200 mb-4">Approval Actions</h3>
                      <div className="flex gap-4 flex-wrap">
                        <button
                          onClick={() => handleApprove(reg.registration_id)}
                          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition font-semibold"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(reg.registration_id)}
                          className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition font-semibold"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notification Section */}
                  {reg.approval_status === 'approved' && reg.verification_id && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-200 mb-4">Send Notification</h3>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                        <p className="text-blue-300 text-sm mb-2">Verification ID: <span className="font-mono font-bold text-blue-400">{reg.verification_id}</span></p>
                        <p className="text-blue-300 text-xs">Notification sent: {reg.notification_sent ? '✅ Yes' : '❌ No'}</p>
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <button
                          onClick={() => handleSendNotification(reg.registration_id, 'email')}
                          disabled={sendingNotification === reg.registration_id}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition font-semibold disabled:opacity-50"
                        >
                          <Mail className="w-5 h-5" />
                          Send Email
                        </button>
                        <button
                          onClick={() => handleSendNotification(reg.registration_id, 'whatsapp')}
                          disabled={sendingNotification === reg.registration_id}
                          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition font-semibold disabled:opacity-50"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Send WhatsApp
                        </button>
                        <button
                          onClick={() => handleSendNotification(reg.registration_id, 'both')}
                          disabled={sendingNotification === reg.registration_id}
                          className="flex items-center gap-2 px-6 py-3 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition font-semibold disabled:opacity-50"
                        >
                          <Mail className="w-4 h-4" />
                          <MessageCircle className="w-4 h-4" />
                          Send Both
                        </button>
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
