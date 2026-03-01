import { Crown } from 'lucide-react';
import type { RegistrationFormData, TeamMember } from '../types/registration';

interface Props {
  formData: RegistrationFormData;
  updateFormData: (updates: Partial<RegistrationFormData>) => void;
}

export function TeamMembersSection({ formData, updateFormData }: Props) {
  const handleTeamSizeChange = (size: number) => {
    const newMembers: TeamMember[] = Array(size)
      .fill(null)
      .map((_, i) => formData.teamMembers[i] || { name: '', branch: '', phone: '' });

    updateFormData({
      teamSize: size,
      teamMembers: newMembers,
    });
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...formData.teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    updateFormData({ teamMembers: newMembers });
  };

  return (
    <div className="glass-card p-4 md:p-8 rounded-2xl animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-400 mb-6 md:mb-8">Project Expo Team Details</h2>

      <div className="mb-6 md:mb-6 md:mb-8">
        <label className="block text-gray-300 mb-2 md:mb-3 text-base md:text-lg font-semibold">Team Size *</label>
        <select
          required
          value={formData.teamSize}
          onChange={(e) => handleTeamSizeChange(Number(e.target.value))}
          className="input-field text-base md:text-lg p-2 md:p-3"
        >
          <option value={0}>Select team size</option>
          <option value={1}>1 Member</option>
          <option value={2}>2 Members</option>
          <option value={3}>3 Members</option>
        </select>
      </div>

      {formData.teamSize > 0 && (
        <div className="space-y-6 md:space-y-8">
          {formData.teamMembers.map((member, index) => (
            <div
              key={index}
              className="border-2 border-gray-700 rounded-xl p-4 md:p-6 bg-gray-800/30"
            >
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                {index === 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                    <Crown className="w-5 h-5 text-white" />
                    <span className="text-base font-bold text-white">Team Leader</span>
                  </div>
                )}
                {index > 0 && (
                  <span className="text-gray-400 font-semibold text-base">Member {index + 1}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                <div>
                  <label className="block text-gray-300 mb-1 md:mb-2 text-base md:text-lg font-semibold">Name *</label>
                  <input
                    type="text"
                    required
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                    className="input-field text-base md:text-lg p-2 md:p-3"
                    placeholder="Member name"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 md:mb-2 text-base md:text-lg font-semibold">Branch *</label>
                  <input
                    type="text"
                    required
                    value={member.branch}
                    onChange={(e) => updateTeamMember(index, 'branch', e.target.value)}
                    className="input-field text-base md:text-lg p-2 md:p-3"
                    placeholder="Branch"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 md:mb-2 text-base md:text-lg font-semibold">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={member.phone}
                    onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                    className="input-field text-base md:text-lg p-2 md:p-3"
                    placeholder="10-digit number"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
