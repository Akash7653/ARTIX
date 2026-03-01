import { useState } from 'react';
import { CheckCircle2, XCircle, LogOut, Search, Clock, Users } from 'lucide-react';

interface ParticipantDetails {
  registration_id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  year_of_study: string;
  branch: string;
  selected_events: string[];
  team_members?: Array<{ member_name: string; member_branch: string; member_phone: string }>;
  entry_verified_at?: string;
}

export function EventEntryVerification({ onLogout }: { onLogout: () => void }) {
  const [verificationId, setVerificationId] = useState('');
  const [participantDetails, setParticipantDetails] = useState<ParticipantDetails | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<ParticipantDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleVerifyEntry = async () => {
    if (!verificationId.trim()) {
      setMessage('❌ Please enter a Verification ID');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/admin/verify-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_id: verificationId.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Verification failed');
      }

      const result = await response.json();
      const details = result.participant;
      
      setParticipantDetails(details);
      setVerificationHistory([details, ...verificationHistory]);
      setMessage(`✅ ${details.full_name} - Entry Verified Successfully!`);
      setMessageType('success');
      setVerificationId('');
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? `❌ ${err.message}` : '❌ Verification failed');
      setMessageType('error');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const totalVerified = verificationHistory.length;
  const totalHeadCount = verificationHistory.reduce((sum, p) => {
    return sum + ((p.team_members?.length || 0) + 1);
  }, 0);

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
              Event Entry Verification
            </h1>
            <p className="text-gray-400">Verify participant entry using Verification ID</p>
          </div>
          <button
            onClick={onLogout}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Verified</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{totalVerified}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-400 opacity-30" />
            </div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Head Count</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{totalHeadCount}</p>
              </div>
              <Users className="w-12 h-12 text-blue-400 opacity-30" />
            </div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Team Size</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">
                  {totalVerified > 0 ? (totalHeadCount / totalVerified).toFixed(1) : '0'}
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-400 opacity-30" />
            </div>
          </div>
        </div>

        {/* Verification Input */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-gray-200">Verify Participant Entry</h2>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={verificationId}
              onChange={(e) => setVerificationId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyEntry()}
              placeholder="Enter Verification ID (e.g., VER-XXXX-XXXX-XXXX)..."
              className="w-full px-4 py-4 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition text-lg"
              autoFocus
            />
            
            <button
              onClick={handleVerifyEntry}
              disabled={loading || !verificationId.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition disabled:opacity-50 text-lg"
            >
              {loading ? '⏳ Verifying...' : '✓ Verify Entry'}
            </button>
          </div>
        </div>

        {/* Current Participant Details */}
        {participantDetails && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold text-green-400">✓ Entry Verified</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-gray-400 text-sm">Participant Name</p>
                <p className="text-2xl font-bold text-white mt-2">{participantDetails.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Contact</p>
                <p className="text-white font-semibold mt-2">{participantDetails.email}</p>
                <p className="text-gray-300 text-sm">{participantDetails.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">College & Branch</p>
                <p className="text-white font-semibold mt-2">{participantDetails.college_name}</p>
                <p className="text-gray-300 text-sm">{participantDetails.branch} - {participantDetails.year_of_study}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Events</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {participantDetails.selected_events?.map((event, i) => (
                    <span key={i} className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-xs border border-green-500/50">
                      {event.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Members */}
            {participantDetails.team_members && participantDetails.team_members.length > 0 && (
              <div className="border-t border-green-500/30 pt-6">
                <h4 className="text-lg font-bold text-gray-200 mb-4">
                  👥 Team Members ({(participantDetails.team_members?.length || 0) + 1} head count)
                </h4>
                <div className="space-y-3">
                  <div className="px-4 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 font-semibold">
                    👑 Team Leader: {participantDetails.full_name}
                  </div>
                  {participantDetails.team_members.map((member, i) => (
                    <div key={i} className="px-4 py-3 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                      <p className="font-semibold">👤 {member.member_name}</p>
                      <p className="text-xs text-blue-200 mt-1">{member.member_branch} • {member.member_phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setParticipantDetails(null);
                setVerificationId('');
              }}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
            >
              ← Verify Another
            </button>
          </div>
        )}

        {/* Verification History */}
        {verificationHistory.length > 0 && (
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-200 mb-6">Verified Entries ({verificationHistory.length})</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {verificationHistory.map((participant, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-900/70 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-200 text-lg">{participant.full_name}</p>
                      <p className="text-gray-400 text-sm">{participant.college_name} • {participant.branch}</p>
                      <p className="text-gray-500 text-xs mt-1">{participant.registration_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        Head Count: <span className="text-green-400 font-bold">
                          {(participant.team_members?.length || 0) + 1}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {participant.entry_verified_at 
                          ? new Date(participant.entry_verified_at).toLocaleTimeString()
                          : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {verificationHistory.length === 0 && !participantDetails && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No participants verified yet</p>
            <p className="text-gray-500 text-sm mt-2">Enter a Verification ID to verify participant entry</p>
          </div>
        )}
      </div>
    </div>
  );
}
