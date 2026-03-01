import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, CheckCircle, XCircle, Lock, LogOut, Mail, Key } from 'lucide-react';
import { api } from '../lib/api';

interface ScannedData {
  registrationId: string;
  name: string;
  phone: string;
  selectedEvents: string[];
  teamMembers?: Array<{ name: string; branch: string; phone: string }>;
  status: string;
}

interface RegistrationDetails {
  id: string;
  registration_id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  year_of_study: string;
  branch: string;
  selected_events: string[];
  total_amount: number;
  entry_status: string;
  entry_approved_at: string | null;
  teamMembers?: Array<{
    member_name: string;
    member_branch: string;
    member_phone: string;
    is_team_leader: boolean;
  }>;
}

const ADMIN_EMAIL = 'thrinadhgujjarlapudi@gmail.com';
const ADMIN_PASSWORD = '23J41A69A3';

export function AdminScanner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isAuthenticated && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          handleScan(decodedText);
        },
        (error) => {
          console.log(error);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setMessage('');
      setEmail('');
      setPassword('');
    } else {
      setMessage('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    setScannedData(null);
    setRegistrationDetails(null);
  };

  const handleScan = async (decodedText: string) => {
    try {
      const data: ScannedData = JSON.parse(decodedText);
      setScannedData(data);

      const response = await api.verifyQR(data);

      if (response.success) {
        const regDetails = response.registration;
        setRegistrationDetails({
          id: regDetails.registration_id,
          registration_id: regDetails.registration_id,
          full_name: regDetails.full_name,
          email: regDetails.email,
          phone: regDetails.phone,
          college_name: regDetails.college_name,
          year_of_study: regDetails.year_of_study,
          branch: regDetails.branch,
          selected_events: regDetails.selected_events,
          total_amount: regDetails.total_amount,
          entry_status: regDetails.entry_status,
          entry_approved_at: null,
          teamMembers: regDetails.team_members || [],
        });

        if (regDetails.entry_status === 'approved') {
          setMessage('Entry Already Verified');
        } else {
          setMessage('');
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setMessage('Invalid QR code');
    }
  };

  const handleApprove = async () => {
    if (!registrationDetails) return;

    setIsProcessing(true);
    try {
      const response = await api.approveEntry(registrationDetails.registration_id, ADMIN_PASSWORD);

      if (response.success) {
        setMessage('Entry Approved Successfully!');
        setRegistrationDetails({
          ...registrationDetails,
          entry_status: 'approved',
          entry_approved_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Approval error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to approve entry');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setScannedData(null);
    setRegistrationDetails(null);
    setMessage('Entry Rejected');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Login Card */}
        <div className="max-w-md w-full relative z-10">
          <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 rounded-full mb-4 shadow-xl shadow-purple-500/50">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                Admin Access
              </h1>
              <p className="text-gray-400">Entry Verification System</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                  required
                />
              </div>

              {/* Error Message */}
              {message && (
                <div className="p-4 bg-red-500/15 border border-red-500/50 rounded-lg text-red-400 text-sm font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Access Admin Panel
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-700/50 text-center">
              <p className="text-xs text-gray-500">
                🔒 Secure Authentication for Authorized Staff Only
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-lg p-4 text-center text-sm text-gray-400">
            <p>📱 Use your admin credentials to access the entry verification system</p>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(5deg); }
          }
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-blue-500/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-purple-500/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Entry Scanner
            </h1>
            <p className="text-gray-400 mt-1">Manage Real-time Entry Verification</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="w-6 h-6 text-blue-400 animate-pulse" />
              <h2 className="text-xl font-bold text-blue-400">Scan QR Code</h2>
            </div>
            <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
            <p className="text-xs text-gray-400 mt-4 text-center">Position QR code in frame to scan</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Participant Details</h2>

            {message && (
              <div className={`p-4 rounded-lg mb-4 backdrop-blur-md ${
                message.includes('Already') || message.includes('Approved')
                  ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                  : message.includes('Success')
                  ? 'bg-green-500/20 border border-green-500 text-green-400'
                  : 'bg-red-500/20 border border-red-500 text-red-400'
              }`}>
                {message}
              </div>
            )}

            {registrationDetails ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 space-y-3 border border-blue-500/30">
                  <div>
                    <p className="text-gray-400 text-sm">Registration ID</p>
                    <p className="text-blue-400 font-bold text-lg">{registrationDetails.registration_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-gray-200 font-semibold">{registrationDetails.full_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-gray-200">{registrationDetails.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-gray-200 text-sm">{registrationDetails.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">College</p>
                      <p className="text-gray-200">{registrationDetails.college_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Year</p>
                      <p className="text-gray-200">{registrationDetails.year_of_study}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Amount Paid</p>
                    <p className="text-green-400 font-bold">₹{registrationDetails.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Selected Events</p>
                    <div className="flex flex-wrap gap-2">
                      {registrationDetails.selected_events.map((event: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs border border-blue-500/50 animate-pulse">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  {registrationDetails.teamMembers && registrationDetails.teamMembers.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Team Members</p>
                      <div className="space-y-2">
                        {registrationDetails.teamMembers.map((member, i) => (
                          <div key={i} className="bg-gray-700/50 rounded p-2 text-sm border-l-2 border-yellow-500">
                            <p className="text-gray-200">
                              {member.is_team_leader && '👑 '}
                              {member.member_name} - {member.member_branch}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`font-bold text-lg ${
                      registrationDetails.entry_status === 'approved' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {registrationDetails.entry_status.toUpperCase()}
                    </p>
                  </div>
                </div>

                {registrationDetails.entry_status !== 'approved' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 transform hover:scale-105"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Entry
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 transform hover:scale-105"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <ScanLine className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Scan a QR code to view participant details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
