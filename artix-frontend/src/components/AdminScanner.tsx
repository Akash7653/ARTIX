import { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { EventEntryVerification } from './EventEntryVerification';
import ApprovedParticipants from './ApprovedParticipants';

export function AdminScanner() {
  const [mode, setMode] = useState<'menu' | 'dashboard' | 'entry-verify' | 'approved-participants'>('menu');

  const handleLogout = () => {
    setMode('menu');
  };

  if (mode === 'dashboard') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (mode === 'entry-verify') {
    return <EventEntryVerification onLogout={handleLogout} />;
  }

  if (mode === 'approved-participants') {
    return <ApprovedParticipants onLogout={handleLogout} />;
  }

  // Menu Screen
  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">📋</span>
          </div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            ARTIX Admin
          </h1>
          <p className="text-gray-400 text-lg">Event Management System</p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Admin Dashboard Button */}
          <button
            onClick={() => setMode('dashboard')}
            className="w-full group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse" />
            <div className="relative">
              <p className="text-white text-2xl font-bold mb-2">📊 Admin Dashboard</p>
              <p className="text-blue-100 text-sm">Manage registrations & approvals</p>
            </div>
          </button>

          {/* Event Entry Verification Button */}
          <button
            onClick={() => setMode('entry-verify')}
            className="w-full group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse" />
            <div className="relative">
              <p className="text-white text-2xl font-bold mb-2">✓ Event Entry Verification</p>
              <p className="text-green-100 text-sm">Verify participant entry at event</p>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-700" />
            <p className="text-gray-400">Or continue with</p>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Approved Participants List Button */}
          <button
            onClick={() => setMode('approved-participants')}
            className="w-full group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 transition transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse" />
            <div className="relative">
              <p className="text-white text-2xl font-bold mb-2">👥 Approved Participants</p>
              <p className="text-pink-100 text-sm">View event participants list</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p className="mb-2">🎉 ARTIX 2K26 Event Management</p>
          <p className="text-xs text-gray-500">Secure Admin Portal</p>
        </div>
      </div>
    </div>
  );
}

