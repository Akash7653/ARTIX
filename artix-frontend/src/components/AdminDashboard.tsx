import { useState, useEffect, useRef } from 'react';
import { LogOut, Download, CheckCircle2, XCircle, BarChart3, Clock, Eye, EyeOff, Mail, MessageCircle, Search, RefreshCw, Send, ChevronUp, Sun, Moon, RotateCcw } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { PerformanceMonitoring } from './PerformanceMonitoring';
import { ErrorViewer } from './ErrorViewer';
import { Toast, type ToastMessage } from './Toast';
import { Popup, type PopupMessage } from './Popup';

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
  payment_screenshot_base64?: string | null;
  payment_screenshot_mimetype?: string;
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
  onDarkModeToggle?: () => void;
}

export function AdminDashboard({ onLogout, darkMode = true, onDarkModeToggle }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [pendingWhatsAppSend, setPendingWhatsAppSend] = useState<Set<string>>(new Set());
  const [verificationIdInput, setVerificationIdInput] = useState<{ [key: string]: string }>({});
  const [settingVerificationId, setSettingVerificationId] = useState<string | null>(null);
  const [entryVerificationId, setEntryVerificationId] = useState('');
  const [verifyingEntry, setVerifyingEntry] = useState(false);
  const [fullRegistrationData, setFullRegistrationData] = useState<Record<string, Registration>>({});
  const [workflowInProgress, setWorkflowInProgress] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: 'approve' | 'reject' | 'generate-id' | 'mark-sent' | null;
    registrationId: string | null;
    participantName: string | null;
  }>({
    action: null,
    registrationId: null,
    participantName: null,
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expandedDetailsRef = useRef<HTMLDivElement>(null);

  // Toast notification helpers
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 5000, autoRefresh: boolean = false) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration, autoRefresh }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Popup notification helpers
  const addPopup = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration?: number) => {
    const id = Date.now().toString();
    setPopups(prev => [...prev, { id, title, message, type, duration, autoClose: !!duration }]);
  };

  const removePopup = (id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  // Fetch full registration details including payment screenshot
  const fetchFullRegistrationDetails = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${baseUrl}/admin/registration/${registrationId}`, { headers });
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch full registration: ${response.status}`);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Store the full registration data
        setFullRegistrationData(prev => ({
          ...prev,
          [registrationId]: result.data
        }));
      }
    } catch (err) {
      console.error('❌ Error fetching registration details:', err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      loadData();
    } else {
      addToast('Invalid password', 'error', 3000);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Use environment variable for API URL (works across all environments)
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [statsRes, regsRes] = await Promise.all([
        fetch(`${baseUrl}/admin/stats`, { headers }),
        fetch(`${baseUrl}/admin/registrations`, { headers })
      ]);
      
      const statsData = await statsRes.json();
      const regsData = await regsRes.json();
      
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
      } else if (Array.isArray(regsData)) {
        registrationsArray = regsData;
      } else if (regsData?.registrations && Array.isArray(regsData.registrations)) {
        registrationsArray = regsData.registrations;
      }
      
      // Ensure proper state update with new array reference
      setRegistrations([...registrationsArray]);
      
      // Clear full registration data cache on refresh
      setFullRegistrationData({});
      
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      addToast('Failed to load data: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error', 5000);
    }
    setLoading(false);
  };

  // Show confirmation before approving
  const showApproveConfirm = (registrationId: string, participantName: string) => {
    setConfirmAction({
      action: 'approve',
      registrationId,
      participantName
    });
  };

  const executeApprove = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`👤 Approving registration: ${registrationId}`);
      setWorkflowInProgress(registrationId);
      
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ approved: true })
      });

      const data = await response.json();
      
      // REFRESH IMMEDIATELY - don't wait, start loading right away
      setFullRegistrationData({});
      loadData();
      
      if (!response.ok) {
        const currentStatus = data.current_status || 'unknown';
        console.error('❌ Approval failed:', data);
        
        if (data.error === 'This entry has already been reviewed' || currentStatus !== 'pending') {
          addPopup('⚠️ Cannot Approve', `This registration is already ${currentStatus}.`, 'warning', 3000);
          addToast(`Status: ${currentStatus}. Refreshing...`, 'info', 2000);
        } else {
          addPopup('❌ Approval Failed', data.error || 'Unknown error', 'error', 3000);
          addToast(data.error || 'Failed to approve', 'error', 2000);
        }
        return;
      }

      console.log(`✅ Approval successful:`, data);
      addPopup('✅ Approved!', 'Next: Assign Verification ID', 'success', 2000);
      addToast('✅ Approved! Assign Verification ID next', 'success', 2000);
      
      // Fetch updated details
      setTimeout(() => {
        fetchFullRegistrationDetails(registrationId);
      }, 500);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Approval error:', msg);
      addPopup('❌ Error', msg, 'error', 3000);
      addToast(`Error: ${msg}`, 'error', 3000);
    } finally {
      setWorkflowInProgress(null);
      setConfirmAction({ action: null, registrationId: null, participantName: null });
    }
  };

  const handleApprove = (registrationId: string, participantName: string) => {
    setConfirmAction({ action: 'approve', registrationId, participantName });
  };

  const handleReject = (registrationId: string, participantName: string) => {
    setConfirmAction({ action: 'reject', registrationId, participantName });
  };

  const executeReject = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`❌ Rejecting registration: ${registrationId}`);
      setWorkflowInProgress(registrationId);
      
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ approved: false })
      });

      const data = await response.json();
      
      // REFRESH IMMEDIATELY - don't wait, start loading right away
      setFullRegistrationData({});
      loadData();
      
      if (!response.ok) {
        const currentStatus = data.current_status || 'unknown';
        console.error('❌ Rejection error:', data);
        
        if (data.error === 'This entry has already been reviewed' || currentStatus !== 'pending') {
          addPopup('⚠️ Cannot Reject', `This registration is already ${currentStatus}.`, 'warning', 3000);
          addToast(`Status: ${currentStatus}. Refreshing...`, 'info', 2000);
        } else {
          addPopup('❌ Rejection Failed', data.error || 'Unknown error', 'error', 3000);
          addToast(data.error || 'Failed to reject', 'error', 2000);
        }
        return;
      }

      console.log(`✅ Rejection successful:`, data);
      setExpandedId(null);
      addPopup('❌ Rejected', 'Participant rejected', 'warning', 2000);
      addToast('Participant Rejected', 'success', 2000);
      
      // Fetch updated details
      setTimeout(() => {
        fetchFullRegistrationDetails(registrationId);
      }, 500);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to reject:', errorMsg);
      addPopup('❌ Rejection Failed', errorMsg, 'error', 3000);
      addToast(`Failed to reject: ${errorMsg}`, 'error', 3000);
    } finally {
      setWorkflowInProgress(null);
      setConfirmAction({ action: null, registrationId: null, participantName: null });
    }
  };

  // Reset workflow for stuck registrations
  const executeResetRegistration = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`🔄 Resetting registration: ${registrationId}`);
      setWorkflowInProgress(registrationId);
      
      const response = await fetch(`${baseUrl}/admin/reset-registration/${registrationId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMsg = data.error || `Server error: ${response.status}`;
        console.error('❌ Reset failed:', errorMsg);
        addPopup('❌ Reset Failed', errorMsg, 'error', 3000);
        addToast(`Reset failed: ${errorMsg}`, 'error', 3000);
        // Still refresh to show actual status
        setTimeout(loadData, 500);
        return;
      }
      
      console.log(`✅ Registration reset:`, data);
      addPopup('✅ Reset Complete', 'Reset to pending state. You can approve again.', 'success', 2000);
      addToast('Registration reset to pending', 'success', 2000);
      
      setTimeout(() => {
        setFullRegistrationData({});
        loadData();
      }, 500);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Reset error:', msg);
      addPopup('❌ Error', msg, 'error', 3000);
      addToast(`Error: ${msg}`, 'error', 3000);
    } finally {
      setWorkflowInProgress(null);
    }
  };

  // Step 2: Execute MANUAL verification ID assignment (no auto-generation)
  const executeGenerateVerificationId = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      // Get the manually entered verification ID
      const manualVerificationId = verificationIdInput[registrationId]?.trim();
      
      if (!manualVerificationId) {
        addPopup('❌ Missing ID', 'Please enter a Verification ID', 'error', 3000);
        return;
      }
      
      console.log(`🔐 Setting verification ID for: ${registrationId} -> ${manualVerificationId}`);
      
      setWorkflowInProgress(registrationId);
      
      // Call the set-verification-id endpoint instead of generate
      const response = await fetch(`${baseUrl}/admin/set-verification-id`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          registrationId,
          verificationId: manualVerificationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to set ID:', errorData);
        throw new Error(errorData.error || 'Failed to set verification ID');
      }
      
      const result = await response.json();
      console.log(`✅ Verification ID assigned:`, result);
      
      addPopup('✅ ID Assigned!', `Verification ID: ${manualVerificationId}`, 'success', 3000);
      addToast(`✅ ID Assigned! Ready to send WhatsApp`, 'success', 5000);
      
      // Clear the input field
      setVerificationIdInput(prev => {
        const updated = { ...prev };
        delete updated[registrationId];
        return updated;
      });
      
      setTimeout(() => {
        setFullRegistrationData({});
        loadData();
        // Refetch full registration details to show new verification_id
        setTimeout(() => {
          fetchFullRegistrationDetails(registrationId);
        }, 500);
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to set ID:', errorMsg);
      addPopup('❌ Failed to Assign ID', errorMsg, 'error', 4000);
      addToast(`Failed to assign ID: ${errorMsg}`, 'error', 5000);
    } finally {
      setWorkflowInProgress(null);
      setConfirmAction({ action: null, registrationId: null, participantName: null });
    }
  };

  // Step 2: Generate sequential verification ID
  const handleGenerateVerificationId = (registrationId: string, participantName: string) => {
    setConfirmAction({
      action: 'generate-id',
      registrationId,
      participantName
    });
  };

  // Step 3a: Open WhatsApp with message
  const handleSendWhatsAppMessage = async (reg: Registration) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`📱 Preparing WhatsApp message for: ${reg.registration_id}`);
      
      // Check if verification ID already exists
      if (!reg.verification_id) {
        addToast('❌ Verification ID not generated yet. Click "Generate Verification ID" first.', 'error', 4000);
        return;
      }
      
      setWorkflowInProgress(reg.registration_id);
      
      // Build WhatsApp message manually if we already have verification ID
      const eventsList = Array.isArray(reg.selected_events) 
        ? reg.selected_events.map(e => `• ${e.toUpperCase()}`).join('\n') 
        : '• REGISTRATION';
      
      // Build team members list if any
      const teamMembersList = reg.team_members && reg.team_members.length > 0
        ? '\n\n👥 *Team Members:*\n' + reg.team_members.map(m => `• ${m.member_name} - ${m.member_branch}`).join('\n')
        : '';
      
      const message = `✅ *ARTIX 2026 - REGISTRATION APPROVED* ✅

🎉 Your registration has been approved!

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 *VERIFICATION DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 Verification ID: *${reg.verification_id}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *PARTICIPANT INFORMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${reg.full_name}
📚 Branch: ${reg.branch}
📖 Year: ${reg.year_of_study}${teamMembersList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *EVENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎪 Events:
${eventsList}
💰 Total Amount: ₹${reg.total_amount}
📝 Reg ID: ${reg.registration_id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *GATE ENTRY INSTRUCTIONS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Show your Verification ID at event desk
✓ Keep this message for reference
✓ Arrive 15 mins before event time

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *NEED ASSISTANCE?*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact ARTIX Admin Team:
📱 +918919068236`;
      
      const encodedMessage = encodeURIComponent(message);
      const waLink = `https://wa.me/${reg.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
      
      // Open WhatsApp with pre-filled message
      window.open(waLink, '_blank');
      
      // Show pending state
      setExpandedId(reg.registration_id);
      setPendingWhatsAppSend(prev => new Set(prev).add(reg.registration_id));
      addToast('📱 WhatsApp opened - Please send the message and then click "Mark as Sent"', 'info', 5000);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error opening WhatsApp:', errorMsg);
      addToast(`Error: ${errorMsg}`, 'error', 4000);
    } finally {
      setWorkflowInProgress(null);
    }
  };

  // Step 3b: Confirm WhatsApp was sent
  const handleMarkWhatsAppSent = (registrationId: string, participantName: string) => {
    setConfirmAction({
      action: 'mark-sent',
      registrationId,
      participantName
    });
  };

  // Step 3c: Execute marking WhatsApp as sent
  const executeMarkWhatsAppSent = async (registrationId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      
      console.log(`📱 Marking WhatsApp as sent for: ${registrationId}`);
      
      setWorkflowInProgress(registrationId);
      
      const response = await fetch(`${baseUrl}/admin/mark-whatsapp-sent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ registrationId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to mark as sent:', errorData);
        throw new Error(errorData.error || 'Failed to mark WhatsApp as sent');
      }
      
      const result = await response.json();
      console.log(`✅ Marked as sent:`, result);
      
      addPopup('✅ Confirmed!', 'WhatsApp message recorded as sent', 'success', 3000);
      addToast('✅ WhatsApp message confirmed as sent', 'success', 5000);
      
      // Clear pending state and reload
      setPendingWhatsAppSend(prev => {
        const newSet = new Set(prev);
        newSet.delete(registrationId);
        return newSet;
      });
      
      setTimeout(() => {
        setFullRegistrationData({});
        loadData();
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to mark as sent:', errorMsg);
      addPopup('❌ Failed to Confirm', errorMsg, 'error', 4000);
      addToast(`Failed to mark as sent: ${errorMsg}`, 'error', 5000);
    } finally {
      setWorkflowInProgress(null);
      setConfirmAction({ action: null, registrationId: null, participantName: null });
    }
  };

  const handleSetVerificationId = async (registrationId: string) => {
    const verificationId = verificationIdInput[registrationId]?.trim();
    
    if (!verificationId) {
      addToast('Please enter a verification ID', 'error', 3000);
      return;
    }

    setSettingVerificationId(registrationId);
    setWorkflowInProgress(registrationId);
    setExpandedId(registrationId);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      console.log(`🔐 Setting verification ID for: ${registrationId}`);
      
      const response = await fetch(`${baseUrl}/admin/set-verification-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, verificationId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set verification ID');
      }
      
      const result = await response.json();
      console.log(`✅ Verification ID set`);
      
      addToast('✅ Verification ID set! Ready to send WhatsApp', 'success', 4000);
      
      setVerificationIdInput({ ...verificationIdInput, [registrationId]: '' });
      setTimeout(() => {
        loadData();
        setTimeout(() => fetchFullRegistrationDetails(registrationId), 600);
      }, 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to set verification ID:', errorMsg);
      addToast(`Failed: ${errorMsg}`, 'error', 4000);
    } finally {
      setSettingVerificationId(null);
      setWorkflowInProgress(null);
    }
  };

  const handleVerifyEntry = async () => {
    const verificationId = entryVerificationId.trim();
    
    if (!verificationId) {
      addToast('Please enter a verification ID to verify', 'error', 3000);
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
      
      addPopup(
        '✅ Entry Verified',
        `${participantName}${branch} verified for entry!${eventInfo ? ` Events: ${eventInfo}` : ''}`,
        'success',
        3000
      );
      addToast(`✅ Entry Verified! ${participantName}${branch}${eventInfo}`, 'success', 4000, true);
      
      setEntryVerificationId('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to verify entry:', errorMsg);
      addToast(errorMsg, 'error', 4000);
    } finally {
      setVerifyingEntry(false);
    }
  };

  const handleDeleteUser = async (registrationId: string) => {
    try {
      if (!window.confirm('⚠️ WARNING: This will permanently delete this participant and all their data!\n\nAre you absolutely sure? This cannot be undone.')) {
        return;
      }

      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      
      console.log(`🗑️ Deleting participant: ${registrationId}`);
      
      const response = await fetch(`${baseUrl}/admin/registrations/${registrationId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addPopup('✅ Deleted', `${data.data.name} deleted from system`, 'success', 3000);
        addToast(`✅ Participant deleted: ${data.data.name}`, 'success', 3000, true);
        
        // Remove from local state immediately
        setRegistrations(prev => prev.filter(reg => reg.registration_id !== registrationId));
        
        // Close expanded view if this registration was expanded
        if (expandedId === registrationId) {
          setExpandedId(null);
        }
      } else {
        const errorMsg = data.error || data.message || 'Unknown error occurred';
        addToast(`Failed to delete: ${errorMsg}`, 'error', 4000);
      }
    } catch (err) {
      console.error('❌ Error deleting participant:', err);
      addToast('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error', 4000);
    }
  };

  const handleExportToExcel = async () => {
    try {
      addToast('⏳ Fetching all registrations for export...');
      

      // Fetch ALL registrations from backend (not just current page)
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${baseUrl}/admin/export`, { headers });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Export failed');
      }

      console.log(`📊 Fetched ${data.totalCount} registrations from backend`);

      // The backend returns already formatted data, we just need to transform it slightly if needed
      const exportData = (data.data || []).map(item => ({
        registration_id: item['Registration ID'],
        verification_id: item['Verification ID'],
        full_name: item['Full Name'],
        email: item['Email'],
        phone: item['Phone'],
        college: item['College Name'],
        branch: item['Branch'],
        year: item['Year of Study'],
        selected_events: item['Selected Events'],
        total_amount: item['Total Amount'],
        transaction_id: item['Transaction ID'],
        utr_id: item['UTR ID'],
        approval_status: item['Approval Status'],
        entry_status: item['Selected For Event'],
        team_members: item['Team Members'] ? item['Team Members'].split('; ').map(name => ({ name })) : [],
        created_at: item['Registration Date'],
        notification_sent: item['Notification Sent'] || false
      }));

      console.log(`✅ Processing ${exportData.length} registrations for Excel export`);

      const result = exportToExcel(exportData, 'ARTIX-AllRegistrations');
      if (result.success) {
        addPopup('✅ Exported', `${exportData.length} registrations exported!`, 'success', 3000);
        addToast(`✅ Excel exported: ${exportData.length} registrations`, 'success', 4000);
      } else {
        addToast(`Export failed: ${result.error}`, 'error', 4000);
      }
    } catch (err) {
      console.error('Export error:', err);
      addToast(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error', 4000);
    }
  };

  // Auto-load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh data every 5 seconds when authenticated (but NOT when something is expanded or workflow is in progress)
  useEffect(() => {
    if (!isAuthenticated || expandedId || workflowInProgress) return; // Skip refresh if anything is expanded or action in progress
    
    const autoRefreshInterval = setInterval(() => {
      loadData();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(autoRefreshInterval);
  }, [isAuthenticated, expandedId, workflowInProgress]);

  // Manual auto-refresh every 2 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) {
      // Clear interval if auto-refresh is disabled
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      return;
    }

    // Set up interval for 2-second refresh
    autoRefreshIntervalRef.current = setInterval(() => {
      loadData();
    }, 2000);

    // Cleanup interval on unmount or when auto-refresh is disabled
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh]);

  // Auto-scroll to expanded details
  useEffect(() => {
    if (expandedId && expandedDetailsRef.current) {
      setTimeout(() => {
        expandedDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [expandedId]);

  // Fetch full registration details when expanding
  useEffect(() => {
    if (expandedId) {
      // Find the registration ID from expandedId (which is _id)
      const reg = registrations.find(r => r._id === expandedId);
      if (reg && !fullRegistrationData[reg.registration_id]) {
        // Only fetch if we don't already have the full data
        fetchFullRegistrationDetails(reg.registration_id);
      }
    }
  }, [expandedId, registrations, fullRegistrationData]);

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
              {autoRefresh && (
                <span className={`ml-3 text-lg font-semibold animate-pulse ${
                  darkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  🔄 Auto-Refresh 2s
                </span>
              )}
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>IoT esSENCE 2K26 Registration Management</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => {
                setFullRegistrationData({});
                loadData();
                // Scroll to top after refresh
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 200);
              }}
              disabled={loading}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all transform hover:scale-110 ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/50'
                    : 'bg-blue-500/20 border border-blue-500/30 text-blue-700 hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/30'
              }`}
              title="🔄 Refresh all data"
            >
              <RefreshCw className={`w-5 h-5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all transform hover:scale-110 ${
                autoRefresh
                  ? darkMode
                    ? 'bg-green-500/40 border border-green-500/50 text-green-200 hover:bg-green-500/50 hover:shadow-lg hover:shadow-green-500/50 animate-pulse'
                    : 'bg-green-500/40 border border-green-500/50 text-green-700 hover:bg-green-500/50 hover:shadow-lg hover:shadow-green-500/30 animate-pulse'
                  : darkMode
                    ? 'bg-gray-600 border border-gray-500/30 text-gray-400 hover:bg-gray-500 hover:shadow-lg hover:shadow-gray-500/30'
                    : 'bg-gray-300 border border-gray-400/30 text-gray-600 hover:bg-gray-400 hover:shadow-lg hover:shadow-gray-400/30'
              }`}
              title={autoRefresh ? '⏸️ Auto-Refresh: ON (2s)' : '▶️ Auto-Refresh: OFF'}
            >
              <RefreshCw className={`w-5 h-5 transition-transform ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onDarkModeToggle}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition hover:scale-110 ${
                darkMode
                  ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/30'
                  : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/30'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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

        {/* Toast Notifications */}
        <Toast 
          toasts={toasts} 
          onRemove={removeToast}
          onRefresh={loadData}
        />

        {/* Popup Notifications */}
        <Popup
          popups={popups}
          onRemove={removePopup}
        />

        {/* Loading State */}
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
            onClick={() => {
              loadData();
              // Scroll to top after refresh
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 300);
            }}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 border transform hover:shadow-lg ${
              darkMode
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:shadow-purple-500/50'
                : 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200 hover:shadow-purple-500/30'
            }`}
          >
            <RefreshCw className={`w-5 h-5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
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

                addToast('✅ Database cleared successfully! All data removed.', 'success', 4000, true);
              } catch (err) {
                addToast('Failed to clear database', 'error', 4000);
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
                          reg.whatsapp_sent || reg.notification_sent
                            ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                            : darkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-200 text-gray-800'
                        }`}>
                          {reg.whatsapp_sent || reg.notification_sent ? '✅ Sent' : '⏳ Pending'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (expandedId === reg._id) {
                              setExpandedId(null);
                            } else {
                              setExpandedId(reg._id);
                              // Fetch fresh data when viewing
                              fetchFullRegistrationDetails(reg.registration_id);
                            }
                          }}
                          className={`px-3 py-1 rounded text-xs transition hover:scale-105 ${
                            darkMode
                              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {expandedId === reg._id ? 'Hide' : 'View'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(reg.registration_id)}
                          className={`px-3 py-1 rounded text-xs transition hover:scale-105 ${
                            darkMode
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title="Delete this participant"
                        >
                          🗑️ Delete
                        </button>
                      </div>
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

              // Expanded detail view for registration

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
                      {(() => {
                        // Use full registration data if available, otherwise use regular reg data
                        const fullReg = fullRegistrationData[reg.registration_id] || reg;
                        return fullReg.payment_screenshot_base64 && (
                          <div>
                            <p className={`text-sm mb-2 font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Screenshot</p>
                            <img
                              src={`data:${fullReg.payment_screenshot_mimetype || 'image/jpeg'};base64,${fullReg.payment_screenshot_base64}`}
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
                                  link.href = canvas.toDataURL(fullReg.payment_screenshot_mimetype || 'image/jpeg');
                                  link.download = `payment-${reg.registration_id}.jpg`;
                                  link.click();
                                };
                                img.src = `data:${fullReg.payment_screenshot_mimetype || 'image/jpeg'};base64,${fullReg.payment_screenshot_base64}`;
                              }}
                            />
                          </div>
                        );
                      })()}
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
                          const validEvents = events
                            .filter(e => e && String(e).trim() !== '' && String(e) !== 'undefined')
                            .map(e => String(e).trim());
                          
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
                      }`}>Approve or reject this registration. After approval, you'll generate a sequential verification ID and send WhatsApp message.</p>
                      <div className="flex gap-4 flex-wrap">
                        <button
                          onClick={() => handleApprove(reg.registration_id, reg.full_name)}
                          disabled={workflowInProgress === reg.registration_id}
                          className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold border-2 ${
                            workflowInProgress === reg.registration_id
                              ? (darkMode
                                  ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed opacity-60'
                                  : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed opacity-60')
                              : (darkMode
                                  ? 'bg-green-600/40 text-green-200 border-green-500 hover:bg-green-600/50 hover:scale-105 active:scale-95'
                                  : 'bg-green-500 text-white border-green-600 hover:bg-green-600 hover:scale-105 active:scale-95')
                          }`}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                          {workflowInProgress === reg.registration_id ? '⏳ Processing...' : '✅ Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(reg.registration_id, reg.full_name)}
                          disabled={workflowInProgress === reg.registration_id}
                          className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold border-2 ${
                            workflowInProgress === reg.registration_id
                              ? (darkMode
                                  ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                                  : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed')
                              : (darkMode
                                  ? 'bg-red-600/40 text-red-200 border-red-500 hover:bg-red-600/50 hover:scale-105'
                                  : 'bg-red-500 text-white border-red-600 hover:bg-red-600 hover:scale-105')
                          }`}
                        >
                          <XCircle className="w-6 h-6" />
                          Reject
                        </button>
                        <button
                          onClick={() => executeResetRegistration(reg.registration_id)}
                          disabled={workflowInProgress === reg.registration_id}
                          title="Reset this registration back to pending state (for troubleshooting)"
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition font-bold border-2 text-xs ${
                            workflowInProgress === reg.registration_id
                              ? (darkMode
                                  ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                                  : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed')
                              : (darkMode
                                  ? 'bg-orange-600/40 text-orange-200 border-orange-500 hover:bg-orange-600/50'
                                  : 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600')
                          }`}
                        >
                          <RotateCcw className="w-5 h-5" />
                          Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset button for stuck approvals */}
                  {(reg.approval_status === 'approved' || reg.approval_status === 'rejected') && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => executeResetRegistration(reg.registration_id)}
                        disabled={workflowInProgress === reg.registration_id}
                        title="Reset to pending if workflow is stuck"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-sm border ${
                          workflowInProgress === reg.registration_id
                            ? (darkMode
                                ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed')
                            : (darkMode
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30'
                                : 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200')
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Workflow
                      </button>
                    </div>
                  )}

                  {/* Step 2: Generate Verification ID */}
                  {reg.approval_status === 'approved' && !reg.verification_id && (
                    <div className={`rounded-lg p-5 border-2 ${
                      darkMode
                        ? 'bg-blue-500/5 border-blue-500/40'
                        : 'bg-blue-50 border-blue-300'
                    }`}>
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        🔐 Step 2: Assign Verification ID
                      </h3>
                      <p className={`text-sm mb-4 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Manually enter a verification ID (e.g., ARTIX2026-001, ARTIX2026-A1B2C, etc.). You'll be able to send the WhatsApp message in Step 3.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter Verification ID"
                          value={verificationIdInput[reg.registration_id] || ''}
                          onChange={(e) => setVerificationIdInput({
                            ...verificationIdInput,
                            [reg.registration_id]: e.target.value.toUpperCase()
                          })}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 font-bold transition focus:outline-none ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                          }`}
                        />
                        <button
                          onClick={() => handleGenerateVerificationId(reg.registration_id, reg.full_name)}
                          disabled={workflowInProgress === reg.registration_id || !verificationIdInput[reg.registration_id]?.trim()}
                          className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold border-2 ${
                            workflowInProgress === reg.registration_id || !verificationIdInput[reg.registration_id]?.trim()
                              ? (darkMode
                                  ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                                  : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed')
                              : (darkMode
                                  ? 'bg-blue-600/40 text-blue-200 border-blue-500 hover:bg-blue-600/50 hover:scale-105'
                                  : 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 hover:scale-105')
                          }`}
                        >
                          {workflowInProgress === reg.registration_id ? '⏳ Assigning...' : '✓ Assign'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Send WhatsApp Message */}
                  {reg.approval_status === 'approved' && reg.verification_id && !reg.whatsapp_sent && (
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
                            ✅ Message includes: Verification ID, participant details, and event information
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 flex-wrap items-center">
                        {!pendingWhatsAppSend.has(reg.registration_id) ? (
                          <button
                            onClick={() => handleSendWhatsAppMessage(reg)}
                            disabled={workflowInProgress === reg.registration_id}
                            className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold disabled:opacity-50 hover:scale-105 border-2 ${
                              workflowInProgress === reg.registration_id
                                ? (darkMode
                                    ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                                    : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed')
                                : (darkMode
                                    ? 'bg-green-600/40 text-green-200 border-green-500 hover:bg-green-600/50'
                                    : 'bg-green-500 text-white border-green-600 hover:bg-green-600')
                            }`}
                          >
                            <MessageCircle className="w-6 h-6" />
                            {workflowInProgress === reg.registration_id ? '⏳ Opening...' : '📱 Send WhatsApp'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMarkWhatsAppSent(reg.registration_id, reg.full_name)}
                              disabled={workflowInProgress === reg.registration_id}
                              className={`flex items-center gap-2 px-8 py-3 rounded-lg transition font-bold disabled:opacity-50 hover:scale-105 border-2 ${
                                workflowInProgress === reg.registration_id
                                  ? (darkMode
                                      ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                                      : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed')
                                  : (darkMode
                                      ? 'bg-green-600/40 text-green-200 border-green-500 hover:bg-green-600/50'
                                      : 'bg-green-500 text-white border-green-600 hover:bg-green-600')
                              }`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                              {workflowInProgress === reg.registration_id ? '⏳ Confirming...' : '✅ Mark as Sent'}
                            </button>
                            <div className={`px-4 py-3 rounded-lg text-sm font-bold border-2 ${
                              darkMode ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' : 'bg-yellow-100 text-yellow-800 border-yellow-400'
                            }`}>
                              ⏳ Awaiting Confirmation
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completion Status */}
                  {reg.approval_status === 'approved' && reg.verification_id && reg.whatsapp_sent && (
                    <div className={`rounded-lg p-5 border-2 ${
                      darkMode
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-green-100 border-green-400'
                    }`}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-700'}`} />
                        <div>
                          <p className={`font-bold text-lg ${darkMode ? 'text-green-400' : 'text-green-700'}`}>✅ Workflow Complete</p>
                          <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                            Verification ID: <span className="font-mono font-bold">{reg.verification_id}</span> | WhatsApp sent to {reg.phone}
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

      {/* Confirmation Modal */}
      {confirmAction.action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className={`mx-4 rounded-2xl p-8 shadow-2xl max-w-sm w-full ${
            darkMode ? 'bg-gray-900 border-2 border-gray-700' : 'bg-white border-2 border-gray-300'
          }`}>
            <div className="text-center">
              {/* Action Icon */}
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmAction.action === 'approve' ? (darkMode ? 'bg-green-500/30' : 'bg-green-100') :
                confirmAction.action === 'reject' ? (darkMode ? 'bg-red-500/30' : 'bg-red-100') :
                confirmAction.action === 'generate-id' ? (darkMode ? 'bg-blue-500/30' : 'bg-blue-100') :
                (darkMode ? 'bg-green-500/30' : 'bg-green-100')
              }">
                <span className="text-4xl">{
                  confirmAction.action === 'approve' ? '✅' :
                  confirmAction.action === 'reject' ? '❌' :
                  confirmAction.action === 'generate-id' ? '🔐' :
                  '📱'
                }</span>
              </div>

              {/* Title */}
              <h3 className={`text-2xl font-bold mb-2 ${
                confirmAction.action === 'approve' ? (darkMode ? 'text-green-400' : 'text-green-700') :
                confirmAction.action === 'reject' ? (darkMode ? 'text-red-400' : 'text-red-700') :
                confirmAction.action === 'generate-id' ? (darkMode ? 'text-blue-400' : 'text-blue-700') :
                (darkMode ? 'text-green-400' : 'text-green-700')
              }`}>
                {confirmAction.action === 'approve' && 'Approve Registration?'}
                {confirmAction.action === 'reject' && 'Reject Registration?'}
                {confirmAction.action === 'generate-id' && 'Generate Verification ID?'}
                {confirmAction.action === 'mark-sent' && 'Confirm WhatsApp Sent?'}
              </h3>

              {/* Participant Info */}
              <div className={`py-4 px-4 rounded-lg mb-6 ${
                darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100 border border-gray-300'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Participant</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {confirmAction.participantName}
                </p>
              </div>

              {/* Description */}
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {confirmAction.action === 'approve' && 'This will mark the registration as approved. You\'ll then enter a Verification ID and send WhatsApp.'}
                {confirmAction.action === 'reject' && 'This will mark the registration as rejected. No further action needed.'}
                {confirmAction.action === 'generate-id' && 'Enter a unique Verification ID (e.g., ARTIX2026-001, ARTIX2026-A1B2C, etc.). You\'ll then send it via WhatsApp.'}
                {confirmAction.action === 'mark-sent' && 'This will confirm the WhatsApp message has been sent to the participant.'}
              </p>

              {/* Manual Verification ID Input */}
              {confirmAction.action === 'generate-id' && (
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Enter Verification ID (e.g., ARTIX2026-001)"
                    value={verificationIdInput[confirmAction.registrationId || ''] || ''}
                    onChange={(e) => setVerificationIdInput({
                      ...verificationIdInput,
                      [confirmAction.registrationId || '']: e.target.value.toUpperCase()
                    })}
                    className={`w-full px-4 py-3 rounded-lg border-2 font-bold transition focus:outline-none ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    }`}
                  />
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Manually assigned - admin created ID
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction({ action: null, registrationId: null, participantName: null })}
                  disabled={workflowInProgress === confirmAction.registrationId}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold transition ${
                    workflowInProgress === confirmAction.registrationId
                      ? (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed')
                      : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900')
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.action === 'approve') executeApprove(confirmAction.registrationId!);
                    else if (confirmAction.action === 'reject') executeReject(confirmAction.registrationId!);
                    else if (confirmAction.action === 'generate-id') executeGenerateVerificationId(confirmAction.registrationId!);
                    else if (confirmAction.action === 'mark-sent') executeMarkWhatsAppSent(confirmAction.registrationId!);
                  }}
                  disabled={workflowInProgress === confirmAction.registrationId}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold transition ${
                    confirmAction.action === 'approve' || confirmAction.action === 'generate-id' || confirmAction.action === 'mark-sent'
                      ? (workflowInProgress === confirmAction.registrationId
                          ? (darkMode ? 'bg-green-700 text-green-300 cursor-not-allowed' : 'bg-green-400 text-green-100 cursor-not-allowed')
                          : (darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'))
                      : (workflowInProgress === confirmAction.registrationId
                          ? (darkMode ? 'bg-red-700 text-red-300 cursor-not-allowed' : 'bg-red-400 text-red-100 cursor-not-allowed')
                          : (darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'))
                  }`}
                >
                  {workflowInProgress === confirmAction.registrationId ? '⏳ Processing...' : (
                    confirmAction.action === 'approve' ? 'Approve' :
                    confirmAction.action === 'reject' ? 'Reject' :
                    confirmAction.action === 'generate-id' ? 'Assign ID' :
                    'Confirm Sent'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
