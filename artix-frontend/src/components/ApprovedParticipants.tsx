import React, { useState, useEffect } from 'react';
import { Search, Users, BarChart3, Download, LogOut, Eye, EyeOff, Moon, Sun, Filter, Phone, Mail, BookOpen, User } from 'lucide-react';

interface TeamMember {
  name: string;
  email: string;
  phone: string;
  branch: string;
  year: string;
}

interface Participant {
  _id: string;
  registration_id: string;
  verification_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  selected_events: string[];
  team_members?: TeamMember[];
  total_amount: number;
  approval_status: string;
  entry_status: string;
  created_at: string;
}

interface Stats {
  totalApproved: number;
  totalTeams: number;
  totalParticipants: number;
  totalRevenue: number;
}

interface Props {
  onLogout: () => void;
}

export default function ApprovedParticipants({ onLogout }: Props) {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalApproved: 0,
    totalTeams: 0,
    totalParticipants: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const baseStyles = {
    container: isDarkMode 
      ? 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white'
      : 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900',
    card: isDarkMode
      ? 'bg-slate-800/40 border border-slate-700/50'
      : 'bg-white border border-slate-200'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/approved-participants`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      if (data.success && data.data) {
        setParticipants(data.data);

        // Calculate statistics
        const uniqueTeams = new Set(data.data.map((p: Participant) => {
          // Find the team leader (first entry without a parent)
          return p.registration_id;
        })).size;

        let totalParticipants = 0;
        let totalRevenue = 0;

        data.data.forEach((p: Participant) => {
          totalParticipants += (p.team_members?.length || 0) + 1;
          totalRevenue += p.total_amount || 0;
        });

        setStats({
          totalApproved: data.data.length,
          totalTeams: uniqueTeams,
          totalParticipants,
          totalRevenue
        });

        setFilteredParticipants(data.data);
      }
    } catch (err) {
      console.error('Error loading approved participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterParticipants(value, filterBranch);
  };

  const handleFilterBranch = (branch: string) => {
    setFilterBranch(branch);
    filterParticipants(searchTerm, branch);
  };

  const filterParticipants = (search: string, branch: string) => {
    let filtered = participants;

    // Branch filter
    if (branch !== 'all') {
      filtered = filtered.filter(p => p.branch.toLowerCase() === branch.toLowerCase());
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.registration_id.toLowerCase().includes(searchLower) ||
        p.verification_id.toLowerCase().includes(searchLower)
      );
    }

    setFilteredParticipants(filtered);
  };

  const downloadAsCSV = () => {
    // Prepare CSV data
    const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'College', 'Branch', 'Events', 'Team Size', 'Amount', 'Status'];
    const rows = filteredParticipants.map(p => [
      p.registration_id,
      p.full_name,
      p.email,
      p.phone,
      p.college,
      p.branch,
      (p.selected_events || []).join('; '),
      (p.team_members?.length || 0) + 1,
      p.total_amount,
      p.entry_status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ARTIX-ApprovedParticipants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const uniqueBranches = Array.from(new Set(participants.map(p => p.branch.toUpperCase())));

  return (
    <div className={`h-screen overflow-y-auto ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-4xl md:text-5xl font-bold mb-2 md:mb-3 flex items-center gap-3 ${
              isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500' : 'text-emerald-700'
            }`}>
              <Users className="w-10 h-10 md:w-12 md:h-12" />
              Approved Participants
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              View all approved registrations with team details
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-xl transition-all ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`${baseStyles.card} rounded-2xl p-6 backdrop-blur-md`}>
              <p className={isDarkMode ? 'text-slate-400 text-sm' : 'text-slate-600 text-sm'}>Approved Registrations</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.totalApproved}</p>
            </div>
            <div className={`${baseStyles.card} rounded-2xl p-6 backdrop-blur-md`}>
              <p className={isDarkMode ? 'text-slate-400 text-sm' : 'text-slate-600 text-sm'}>Team Registrations</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.totalTeams}</p>
            </div>
            <div className={`${baseStyles.card} rounded-2xl p-6 backdrop-blur-md`}>
              <p className={isDarkMode ? 'text-slate-400 text-sm' : 'text-slate-600 text-sm'}>Total Participants</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.totalParticipants}</p>
            </div>
            <div className={`${baseStyles.card} rounded-2xl p-6 backdrop-blur-md`}>
              <p className={isDarkMode ? 'text-slate-400 text-sm' : 'text-slate-600 text-sm'}>Revenue</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>₹{stats.totalRevenue}</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className={`${baseStyles.card} rounded-2xl p-6 mb-8 backdrop-blur-md`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Search
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Name, Email, ID..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition ${
                    isDarkMode
                      ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Branch
              </label>
              <select
                value={filterBranch}
                onChange={(e) => handleFilterBranch(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border-2 transition ${
                  isDarkMode
                    ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map(branch => (
                  <option key={branch} value={branch.toLowerCase()}>{branch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                &nbsp;
              </label>
              <button
                onClick={downloadAsCSV}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Participants List */}
        {loading ? (
          <div className="text-center py-8">
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Loading approved participants...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className={`${baseStyles.card} rounded-2xl p-8 text-center backdrop-blur-md`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>No approved participants found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParticipants.map((participant) => (
              <div
                key={participant._id}
                className={`${baseStyles.card} rounded-2xl overflow-hidden backdrop-blur-md transition-all`}
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedId(expandedId === participant._id ? null : participant._id)}
                  className={`p-4 md:p-6 cursor-pointer flex items-center justify-between gap-4 hover:${
                    isDarkMode ? 'bg-slate-700/30' : 'bg-slate-100'
                  } transition`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                      }`}>
                        <User className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base md:text-lg truncate">{participant.full_name}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {participant.college}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className={isDarkMode ? 'text-slate-500' : 'text-slate-600'}>Branch</p>
                        <p className="font-semibold">{participant.branch.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className={isDarkMode ? 'text-slate-500' : 'text-slate-600'}>Team Size</p>
                        <p className="font-semibold text-blue-400">{(participant.team_members?.length || 0) + 1}</p>
                      </div>
                      <div>
                        <p className={isDarkMode ? 'text-slate-500' : 'text-slate-600'}>Events</p>
                        <p className="font-semibold">{participant.selected_events?.length || 0}</p>
                      </div>
                      <div>
                        <p className={isDarkMode ? 'text-slate-500' : 'text-slate-600'}>Status</p>
                        <p className={`font-semibold ${
                          participant.entry_status === 'verified'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}>
                          {participant.entry_status?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex-shrink-0 ${expandedId === participant._id ? 'text-blue-400' : ''}`}>
                    {expandedId === participant._id ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === participant._id && (
                  <div className={`border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'} p-4 md:p-6 space-y-6`}>
                    {/* Contact Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`${baseStyles.card} rounded-lg p-4`}>
                        <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          <Mail className="inline w-4 h-4 mr-2" />
                          Email
                        </p>
                        <p className="font-mono text-sm">{participant.email}</p>
                      </div>
                      <div className={`${baseStyles.card} rounded-lg p-4`}>
                        <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          <Phone className="inline w-4 h-4 mr-2" />
                          Phone
                        </p>
                        <p className="font-mono text-sm">{participant.phone}</p>
                      </div>
                    </div>

                    {/* Verification IDs */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-300'}`}>
                        <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          Verification ID
                        </p>
                        <p className={`font-mono font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
                          {participant.verification_id}
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-300'}`}>
                        <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                          Amount
                        </p>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                          ₹{participant.total_amount}
                        </p>
                      </div>
                    </div>

                    {/* Selected Events */}
                    {participant.selected_events && participant.selected_events.length > 0 && (
                      <div>
                        <p className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          🎯 Selected Events
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {participant.selected_events.map((event, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isDarkMode
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-blue-100 text-blue-700 border border-blue-300'
                              }`}
                            >
                              {event.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    {participant.team_members && participant.team_members.length > 0 && (
                      <div>
                        <p className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Users className="w-5 h-5" />
                          Team Members ({participant.team_members.length + 1} including leader)
                        </p>
                        <div className="space-y-2">
                          {/* Team Leader */}
                          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-300'}`}>
                            <p className={`font-semibold mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                              👑 Team Leader
                            </p>
                            <p className="font-bold">{participant.full_name}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {participant.branch.toUpperCase()} • {participant.phone}
                            </p>
                          </div>

                          {/* Team Members */}
                          {participant.team_members.map((member, i) => (
                            <div
                              key={i}
                              className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-300'}`}
                            >
                              <p className="font-semibold mb-2">👤 {member.name}</p>
                              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {member.branch.toUpperCase()} • Year {member.year}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {member.phone} • {member.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
