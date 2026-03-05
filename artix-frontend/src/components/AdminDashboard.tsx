import { useState, useEffect, useRef } from 'react';
import { LogOut, Download, CheckCircle2, XCircle, BarChart3, Clock, Eye, EyeOff, Mail, MessageCircle, Search, RefreshCw, Send, ChevronUp } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { PerformanceMonitoring } from './PerformanceMonitoring';
import { ErrorViewer } from './ErrorViewer';

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
  whatsapp_sent?: boolean;
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
  darkMode?: boolean;
}

export function AdminDashboard({ onLogout, darkMode = true }: Props) {
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
  const [pendingWhatsAppSend, setPendingWhatsAppSend] = useState<Set<string>>(new Set());
  const [verificationIdInput, setVerificationIdInput] = useState<{ [key: string]: string }>({});
  const [settingVerificationId, setSettingVerificationId] = useState<string | null>(null);
  const [entryVerificationId, setEntryVerificationId] = useState('');
  const [verifyingEntry, setVerifyingEntry] = useState(false);
  const expandedDetailsRef = useRef<HTMLDivElement>(null);


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
      // Use environment variable for API URL (works across all environments)
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      
      console.log('📊 Loading admin data from:', baseUrl);
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
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
      if (registrationsArray.length > 0) {
        console.log('📋 First registration details:', {
          registration_id: registrationsArray[0].registration_id,
          created_at: registrationsArray[0].created_at,
          created_at_type: typeof registrationsArray[0].created_at,
          selected_events: registrationsArray[0].selected_events,
          selected_events_type: Array.isArray(registrationsArray[0].selected_events) ? 'array' : typeof registrationsArray[0].selected_events
        });
        // Log all registrations' created_at values
        registrationsArray.forEach((reg, i) => {
          console.log(`📋 Registration ${i} (${reg.registration_id}): created_at="${reg.created_at}", events=${JSON.stringify(reg.selected_events)}`);
        });
      }
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
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`👤 Approving registration: ${registrationId}`);
      console.log(`🔗 Endpoint: ${baseUrl}/admin/registrations/${registrationId}/approve`);
      
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ approved: true })
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Approval error:', errorData);
        throw new Error(errorData.error || 'Approval failed');
      }
      
      const result = await response.json();
      console.log(`✅ Approval response:`, result);
      
      // Keep expanded ID to prevent collapse
      setExpandedId(registrationId);
      setMessage(`✅ Approved! Now enter the Verification ID.`);
      setMessageType('success');
      
      // Reload data but keep expanded view
      setTimeout(() => {
        loadData();
        // Scroll to expanded element after data loads
        setTimeout(() => {
          const expandedElement = document.querySelector(`[data-registration-id="${registrationId}"]`);
          if (expandedElement) {
            expandedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 600);
      }, 500);
      
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to approve:', errorMsg);
      setMessage(`❌ Failed to approve: ${errorMsg}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleReject = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`❌ Rejecting registration: ${registrationId}`);
      console.log(`🔗 Endpoint: ${baseUrl}/admin/registrations/${registrationId}/approve`);
      
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ approved: false })
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Rejection error:', errorData);
        throw new Error(errorData.error || 'Rejection failed');
      }
      
      const result = await response.json();
      console.log(`✅ Rejection response:`, result);
      
      // Collapse view and reload - registration is now rejected
      setExpandedId(null);
      setMessage('❌ Participant Rejected');
      setMessageType('success');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to reject:', errorMsg);
      setMessage(`❌ Failed to reject: ${errorMsg}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
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
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      
      console.log(`🔐 Setting verification ID for: ${registrationId}`);
      console.log(`🔐 Verification ID: ${verificationId}`);
      
      const response = await fetch(`${baseUrl}/admin/set-verification-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, verificationId })
      });

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Failed to set verification ID');
      }
      
      const result = await response.json();
      console.log(`✅ Verification ID set:`, result);
      
      // FIXED: Do NOT open WhatsApp automatically
      // Users should click "Send WhatsApp Message" button in Step 3 instead
      
      // Keep expanded view throughout the workflow
      setExpandedId(registrationId);
      setMessage(`✅ Verification ID set! Now click "Send WhatsApp Message" in Step 3 to send the message.`);
      setMessageType('success');
      setVerificationIdInput({ ...verificationIdInput, [registrationId]: '' });
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to set verification ID:', errorMsg);
      setMessage(`❌ Failed: ${errorMsg}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
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
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      
      console.log(`✅ Verifying entry with ID: ${verificationId}`);
      
      const response = await fetch(`${baseUrl}/admin/verify-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_id: verificationId })
      });

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Verification error:', error);
        throw new Error(error.error || 'Verification failed');
      }
      
      const result = await response.json();
      console.log(`✅ Entry verified:`, result);
      
      // Create a better message
      const participantName = result.participant?.full_name || 'Participant';
      const branch = result.participant?.branch ? ` (${result.participant.branch})` : '';
      const eventInfo = result.participant?.selected_events?.length > 0 
        ? ` | Events: ${result.participant.selected_events.join(', ').toUpperCase()}`
        : '';
      
      setMessage(`✅ Entry Verified! ${participantName}${branch}${eventInfo}`);
      setMessageType('success');
      setEntryVerificationId('');
      setTimeout(loadData, 500);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to verify entry:', errorMsg);
      setMessage(`❌ ${errorMsg}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
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
    // Fix: Check if selected_events exists and is an array before joining
    if (reg.selected_events && Array.isArray(reg.selected_events) && reg.selected_events.length > 0) {
      lines.push(`Events: ${reg.selected_events.join(', ')}`);
    } else {
      lines.push('Events: No specific events selected');
    }
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
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
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

  const handleConfirmWhatsAppSent = async (reg: Registration) => {
    try {
      setSendingNotification(reg.registration_id);
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      console.log(`📱 Marking WhatsApp as sent for ${reg.registration_id}`);
      
      const response = await fetch(`${baseUrl}/admin/mark-whatsapp-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ registrationId: reg.registration_id })
      });

      const data = await response.json();
      console.log('📱 WhatsApp marked as sent:', data);

      if (response.ok) {
        setMessage('✅ WhatsApp message marked as sent!');
        setMessageType('success');
        
        // Keep expanded view throughout the workflow
        setExpandedId(reg.registration_id);
        
        // Remove from pending set
        setPendingWhatsAppSend(prev => {
          const newSet = new Set(prev);
          newSet.delete(reg.registration_id);
          return newSet;
        });
        
        setTimeout(loadData, 1000);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorMsg = data.error || data.message || 'Unknown error';
        console.error('❌ Error marking WhatsApp sent:', errorMsg);
        setMessage('❌ ' + errorMsg);
        setMessageType('error');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setMessage('❌ ' + (err instanceof Error ? err.message : 'Error marking WhatsApp sent'));
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSendingNotification(null);
    }
  };

  const handleSendWhatsAppDirect = async (reg: Registration) => {
    try {
      setSendingNotification(reg.registration_id);
      
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
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
            `✅ WhatsApp ready!\n\nParticipant: ${participantName}\nPhone: ${reg.phone}\n\nClick OK to open WhatsApp Web to send the message.\n\nAfter sending, click the 'Confirm Sent' button below.`
          );
          
          if (confirmOpen) {
            // Open WhatsApp Web in new tab
            window.open(waLink, '_blank');
            
            // Add to pending set - show the confirmation button
            // Keep expanded view and show the pending state
            setExpandedId(reg.registration_id);
            setPendingWhatsAppSend(prev => new Set(prev).add(reg.registration_id));
            setMessage('📱 WhatsApp opened - Please send the message and then click "Confirm Sent" button');
            setMessageType('info');
            setTimeout(() => setMessage(''), 5000);
          }
        } else {
          // Add to pending set for manual confirmation
          setExpandedId(reg.registration_id);
          setPendingWhatsAppSend(prev => new Set(prev).add(reg.registration_id));
          setMessage('📱 Message prepared - Please send manually and click "Confirm Sent"');
          setMessageType('info');
          setTimeout(() => setMessage(''), 3000);
        }
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

  // Auto-scroll to expanded details
  useEffect(() => {
    if (expandedId && expandedDetailsRef.current) {
      setTimeout(() => {
        expandedDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [expandedId]);

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
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img src="/artix logo.jpeg" alt="ARTIX Logo" className="h-24 object-contain drop-shadow-lg rounded-lg" />
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Access
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>IoT esSENCE 2K26 Dashboard</p>
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
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-950'
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0 opacity-40">
        {darkMode && (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl"></div>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Admin Dashboard
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>IoT esSENCE 2K26 Registration Management</p>
          </div>
          <div className="flex gap-3 items-center">
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

        {/* Loading State */}
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

        {/* Performance Monitoring Panel */}
        <div className={`mb-8 rounded-xl p-6 border ${
          darkMode
            ? 'bg-gray-800/40 border-gray-700/50'
            : 'bg-white/40 border-gray-300/50'
        }`}>
          <PerformanceMonitoring darkMode={darkMode} />
        </div>

        {/* Error Tracking Panel */}
        <div className={`mb-8 rounded-xl p-6 border ${
          darkMode
            ? 'bg-gray-800/40 border-gray-700/50'
            : 'bg-white/40 border-gray-300/50'
        }`}>
          <ErrorViewer darkMode={darkMode} />
        </div>

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
                const baseUrl = import.meta.env.VITE_API_URL || '/api';
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
                  }`}>Events</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Status</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Amount</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>WhatsApp</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg._id} data-registration-id={reg.registration_id} className={`border-b transition ${
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
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const events = Array.isArray(reg.selected_events) ? reg.selected_events : [];
                          const validEvents = events
                            .filter(event => event && String(event).trim() !== '' && String(event) !== 'undefined')
                            .map(event => String(event).trim().replace(/_/g, ' ').toUpperCase())
                            .filter(Boolean);
                          
                          return validEvents.length > 0 ? (
                            validEvents.map((event, i) => (
                              <span key={i} className={`px-2 py-1 rounded text-xs font-semibold border ${
                                darkMode
                                  ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                              }`}>
                                {event}
                              </span>
                            ))
                          ) : (
                            <span className={`text-xs italic ${
                              darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>No events</span>
                          );
                        })()}
                      </div>
                    </td>
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
                      {reg.approval_status === 'rejected' ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 w-fit ${
                          darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          ❌ Not Sent
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 w-fit ${
                          reg.notification_sent
                            ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                            : darkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {reg.notification_sent ? '✅ Sent' : '⏳ Pending'}
                        </span>
                      )}
                    </td>
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
          <div ref={expandedDetailsRef} className={`mt-6 rounded-xl p-6 border-2 ${
            darkMode
              ? 'bg-gray-800/40 border-gray-700/50'
              : 'bg-white/40 border-gray-300'
          }`}>
            {(() => {
              // Search through ALL registrations (not just filtered) so detail view stays open during workflow
              const reg = registrations.find(r => r._id === expandedId || r.registration_id === expandedId);
              if (!reg) return null;

              // Log the registration data for debugging
              console.log('📊 [DETAIL VIEW] Registration data received:', {
                registration_id: reg.registration_id,
                created_at: reg.created_at,
                created_at_type: typeof reg.created_at,
                selected_events: reg.selected_events,
                selected_events_type: Array.isArray(reg.selected_events) ? 'array' : typeof reg.selected_events,
                selected_events_length: Array.isArray(reg.selected_events) ? reg.selected_events.length : 0,
                selected_events_raw: JSON.stringify(reg.selected_events)
              });

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
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Branch / Year</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{reg.branch} ({reg.year_of_study})</p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Registration Date</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {(() => {
                            try {
                              if (!reg.created_at) return 'N/A';
                              let date;
                              // Try parsing different date formats
                              if (typeof reg.created_at === 'string') {
                                date = new Date(reg.created_at);
                                // Check if it's a valid date
                                if (isNaN(date.getTime())) {
                                  // Try parsing Unix timestamp if it's a number string
                                  const timestamp = parseInt(reg.created_at);
                                  if (!isNaN(timestamp)) {
                                    date = new Date(timestamp);
                                  } else {
                                    return 'N/A';
                                  }
                                }
                              } else if (typeof reg.created_at === 'number') {
                                date = new Date(reg.created_at);
                              } else {
                                return 'N/A';
                              }
                              
                              if (isNaN(date.getTime())) return 'N/A';
                              return date.toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              console.error('Date parsing error:', e, reg.created_at);
                              return 'N/A';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Payment Details</h3>
                    <div className={`p-4 rounded-lg space-y-4 ${
                      darkMode
                        ? 'bg-gray-900/30'
                        : 'bg-gray-100/50'
                    }`}>
                      {/* Payment Screenshot */}
                      {reg.payment_screenshot_base64 && (
                        <div>
                          <p className={`text-sm mb-2 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Screenshot</p>
                          <img
                            src={`data:${reg.payment_screenshot_mimetype || 'image/jpeg'};base64,${reg.payment_screenshot_base64}`}
                            alt="Payment screenshot"
                            className={`rounded-lg max-w-sm border-2 cursor-pointer transition hover:scale-105 ${darkMode ? 'border-gray-600' : 'border-gray-400'}`}
                            onClick={() => {
                              // Allow fullscreen view by opening in new tab
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const img = new Image();
                              img.onload = function() {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                                const link = document.createElement('a');
                                link.href = canvas.toDataURL(reg.payment_screenshot_mimetype || 'image/jpeg');
                                link.download = `payment-${reg.registration_id}.jpg`;
                                link.click();
                              };
                              img.src = `data:${reg.payment_screenshot_mimetype || 'image/jpeg'};base64,${reg.payment_screenshot_base64}`;
                            }}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {(() => {
                          const events = Array.isArray(reg.selected_events) ? reg.selected_events : [];
                          console.log('📋 [EVENTS RENDER] Processing events:', {
                            registration_id: reg.registration_id,
                            events_input: events,
                            is_array: Array.isArray(events),
                            count: events.length
                          });
                          
                          const validEvents = events
                            .filter(e => e && String(e).trim() !== '' && String(e) !== 'undefined')
                            .map(e => String(e).trim());
                          
                          console.log('📋 [EVENTS RENDER] After filtering:', {
                            valid_count: validEvents.length,
                            valid_events: validEvents
                          });
                          
                          if (validEvents.length === 0) {
                            return (
                              <span className={`text-xs px-3 py-1 rounded-full italic inline-block ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                ℹ️ No events selected
                              </span>
                            );
                          }
                          
                          return (
                            <div className="flex flex-wrap gap-2">
                              {validEvents.map((event, i) => (
                                <span key={i} className={`px-3 py-1 rounded-full text-xs border font-semibold ${
                                  darkMode
                                    ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                                    : 'bg-blue-100 text-blue-700 border-blue-300'
                                }`}>
                                  🎯 {event.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
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
                    <div className={`rounded-lg p-5 border-2 ${
                      darkMode
                        ? 'bg-gray-800/40 border-purple-500/40'
                        : 'bg-purple-50 border-purple-300'
                    }`}>
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-purple-400' : 'text-purple-700'
                      }`}>
                        ✅ Step 1: Review & Approve
                      </h3>
                      <p className={`text-sm mb-4 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Approve or reject this registration. After approval, you'll set a verification ID.</p>
                      <div className="flex gap-4 flex-wrap">
                        <button
                          onClick={() => handleApprove(reg.registration_id)}
                          className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold hover:scale-105 border-2 ${
                            darkMode
                              ? 'bg-green-600/40 text-green-200 border-green-500 hover:bg-green-600/50'
                              : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                          }`}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(reg.registration_id)}
                          className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold hover:scale-105 border-2 ${
                            darkMode
                              ? 'bg-red-600/40 text-red-200 border-red-500 hover:bg-red-600/50'
                              : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                          }`}
                        >
                          <XCircle className="w-6 h-6" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Entry Verification Section - Set Verification ID */}
                  {reg.approval_status === 'approved' && !reg.verification_id && (
                    <div className={`rounded-lg p-5 border-2 ${
                      darkMode
                        ? 'bg-yellow-500/5 border-yellow-500/40'
                        : 'bg-yellow-50 border-yellow-300'
                    }`}>
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-yellow-300' : 'text-yellow-700'
                      }`}>
                        🔐 Step 2: Set Verification ID
                      </h3>
                      <p className={`text-sm mb-4 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Create a unique verification ID for this participant. They will use this ID at event entry.</p>
                      <div className="flex gap-3 items-end flex-wrap">
                        <div className="flex-1 min-w-xs">
                          <label className={`block text-sm font-semibold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Enter Verification ID</label>
                          <input
                            type="text"
                            value={verificationIdInput[reg.registration_id] || ''}
                            onChange={(e) => setVerificationIdInput({ ...verificationIdInput, [reg.registration_id]: e.target.value })}
                            placeholder="e.g., ARTIX-8026, VER001, etc."
                            className={`w-full px-4 py-2 rounded-lg font-mono font-bold focus:outline-none transition border-2 ${
                              darkMode
                                ? 'bg-gray-900/70 border-yellow-500/40 text-yellow-300 placeholder-gray-600 focus:border-yellow-400'
                                : 'bg-white border-yellow-400 text-yellow-700 placeholder-gray-500 focus:border-yellow-500'
                            }`}
                          />
                        </div>
                        <button
                          onClick={() => handleSetVerificationId(reg.registration_id)}
                          disabled={settingVerificationId === reg.registration_id}
                          className={`px-6 py-2 rounded-lg transition font-semibold disabled:opacity-50 hover:scale-105 border-2 ${
                            darkMode
                              ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400 hover:bg-yellow-500/40'
                              : 'bg-yellow-200 text-yellow-800 border-yellow-400 hover:bg-yellow-300'
                          }`}
                        >
                          {settingVerificationId === reg.registration_id ? '⏳ Setting...' : '✅ Set ID'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notification Section - Send WhatsApp */}
                  {reg.approval_status === 'approved' && reg.verification_id && !reg.notification_sent && (
                    <div className={`rounded-lg p-5 border-2 ${
                      darkMode
                        ? 'bg-green-500/5 border-green-500/40'
                        : 'bg-green-50 border-green-300'
                    }`}>
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-green-400' : 'text-green-700'
                      }`}>
                        📱 Step 3: Send WhatsApp Message
                      </h3>
                      
                      <div className={`rounded-lg p-4 mb-4 border ${
                        darkMode
                          ? 'bg-gray-800/50 border-green-500/30'
                          : 'bg-green-100/50 border-green-400'
                      }`}>
                        <div className="space-y-2">
                          <p className={`flex items-center gap-2 text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                            🔐 Verification ID: <span className={`font-mono px-2 py-1 rounded ${darkMode ? 'bg-gray-900 text-green-300' : 'bg-white text-green-700 border'}`}>{reg.verification_id}</span>
                          </p>
                          <p className={`flex items-center gap-2 text-sm ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                            📱 Sending to: <span className="font-semibold">+91 {reg.phone}</span>
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                            ✅ Formatted message includes: Verification ID, participant details, event information
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 flex-wrap items-center">
                        {!pendingWhatsAppSend.has(reg.registration_id) ? (
                          <>
                            <button
                              onClick={() => handleSendWhatsAppDirect(reg)}
                              disabled={sendingNotification === reg.registration_id}
                              className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold disabled:opacity-50 hover:scale-105 border-2 ${
                                darkMode
                                  ? 'bg-green-600/40 text-green-200 border-green-500 hover:bg-green-600/50'
                                  : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                              }`}
                            >
                              <MessageCircle className="w-6 h-6" />
                              {sendingNotification === reg.registration_id ? 'Sending...' : 'Send WhatsApp Message'}
                            </button>

                            <div className={`px-4 py-3 rounded-lg text-sm font-bold border-2 ${
                              darkMode ? 'bg-gray-500/20 text-gray-300 border-gray-500' : 'bg-gray-200 text-gray-700 border-gray-400'
                            }`}>
                              ⏳ Pending
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleConfirmWhatsAppSent(reg)}
                              disabled={sendingNotification === reg.registration_id}
                              className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold disabled:opacity-50 hover:scale-105 border-2 ${
                                darkMode
                                  ? 'bg-blue-600/40 text-blue-200 border-blue-500 hover:bg-blue-600/50'
                                  : 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                              }`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                              {sendingNotification === reg.registration_id ? 'Confirming...' : 'Confirm Sent'}
                            </button>

                            <div className={`px-4 py-3 rounded-lg text-sm font-bold border-2 ${
                              darkMode ? 'bg-blue-500/20 text-blue-300 border-blue-500' : 'bg-blue-100 text-blue-700 border-blue-300'
                            }`}>
                              📱 Ready to Send - Click 'Confirm Sent' after sending on WhatsApp
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success message after WhatsApp sent */}
                  {reg.approval_status === 'approved' && reg.verification_id && reg.notification_sent && (
                    <div className={`rounded-lg p-5 border-2 ${
                      darkMode
                        ? 'bg-green-500/10 border-green-500/40'
                        : 'bg-green-100 border-green-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-700'}`} />
                        <div>
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                            ✅ All Done!
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                            Participant {reg.full_name} has been approved and notified via WhatsApp.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hide Button - Scroll back to registrations */}
                  <div className="flex justify-center pt-6 mt-8 border-t-2" style={{
                    borderColor: darkMode ? 'rgba(107, 114, 128, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                  }}>
                    <button
                      onClick={() => setExpandedId(null)}
                      className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold hover:scale-105 border-2 ${
                        darkMode
                          ? 'bg-gray-700/40 text-gray-200 border-gray-600 hover:bg-gray-700/60'
                          : 'bg-gray-400/30 text-gray-700 border-gray-400 hover:bg-gray-400/50'
                      }`}
                    >
                      <ChevronUp className="w-5 h-5" />
                      Hide Details &amp; Return to Registrations
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}


      </div>
    </div>
  );
}
