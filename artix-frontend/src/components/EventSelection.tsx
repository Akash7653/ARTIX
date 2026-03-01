import { INDIVIDUAL_EVENTS, COMBO_OPTIONS, type RegistrationFormData } from '../types/registration';

interface Props {
  formData: RegistrationFormData;
  updateFormData: (updates: Partial<RegistrationFormData>) => void;
  darkMode?: boolean;
}

export function EventSelection({ formData, updateFormData, darkMode = true }: Props) {
  const handleIndividualEventToggle = (eventId: string) => {
    const newEvents = formData.selectedIndividualEvents.includes(eventId)
      ? formData.selectedIndividualEvents.filter(id => id !== eventId)
      : [...formData.selectedIndividualEvents, eventId];

    updateFormData({
      selectedIndividualEvents: newEvents,
      selectedCombo: '',
      teamSize: newEvents.includes('project_expo') ? formData.teamSize : 0,
      teamMembers: newEvents.includes('project_expo') ? formData.teamMembers : [],
    });
  };

  const handleComboSelection = (comboId: string) => {
    const newComboId = formData.selectedCombo === comboId ? '' : comboId;
    updateFormData({
      selectedCombo: newComboId,
      selectedIndividualEvents: [],
      teamSize: 0,
      teamMembers: [],
    });
  };

  const calculateTotal = (): number => {
    if (formData.selectedCombo) {
      const combo = COMBO_OPTIONS.find(c => c.id === formData.selectedCombo);
      return combo?.price || 0;
    }

    return formData.selectedIndividualEvents.reduce((total, eventId) => {
      const event = INDIVIDUAL_EVENTS.find(e => e.id === eventId);
      return total + (event?.price || 0);
    }, 0);
  };

  const total = calculateTotal();
  const hasIndividualSelection = formData.selectedIndividualEvents.length > 0;
  const hasComboSelection = formData.selectedCombo !== '';

  return (
    <div className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
      darkMode
        ? 'bg-gradient-to-br from-gray-800/40 via-gray-800/30 to-gray-900/40 border-gray-700/50'
        : 'bg-gradient-to-br from-white/40 via-purple-50/40 to-white/40 border-gray-300/50'
    }`}>
      <h2 className={`text-2xl md:text-3xl font-bold mb-6 md:mb-8 ${
        darkMode ? 'text-purple-400' : 'text-purple-600'
      }`}>Event Selection</h2>

      <div className="space-y-6 md:space-y-8">
        <div>
          <h3 className={`text-lg md:text-xl lg:text-2xl font-semibold mb-3 md:mb-4 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>Individual Events</h3>
          <div className="space-y-3 md:space-y-4">
            {INDIVIDUAL_EVENTS.map(event => (
              <label
                key={event.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 md:p-5 rounded-lg border-2 transition-all cursor-pointer gap-3 sm:gap-0 ${
                  formData.selectedIndividualEvents.includes(event.id)
                    ? darkMode
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-blue-400 bg-blue-400/10'
                    : darkMode
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-300 bg-white/30 hover:border-gray-400'
                } ${hasComboSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedIndividualEvents.includes(event.id)}
                    onChange={() => handleIndividualEventToggle(event.id)}
                    disabled={hasComboSelection}
                    className="w-5 h-5 sm:w-6 sm:h-6 accent-blue-500"
                  />
                  <span className={`ml-3 sm:ml-4 text-base md:text-lg font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>{event.name}</span>
                </div>
                <span className={`font-bold text-lg md:text-xl ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>₹{event.price}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={`border-t pt-6 md:pt-8 ${
          darkMode ? 'border-gray-700' : 'border-gray-300'
        }`}>
          <h3 className={`text-lg md:text-xl lg:text-2xl font-semibold mb-3 md:mb-4 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>Combo Options</h3>
          <div className="space-y-3 md:space-y-4">
            {COMBO_OPTIONS.map(combo => (
              <label
                key={combo.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 md:p-5 rounded-lg border-2 transition-all cursor-pointer gap-3 sm:gap-0 ${
                  formData.selectedCombo === combo.id
                    ? darkMode
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-purple-400 bg-purple-400/10'
                    : darkMode
                    ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    : 'border-gray-300 bg-white/30 hover:border-gray-400'
                } ${hasIndividualSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="combo"
                    checked={formData.selectedCombo === combo.id}
                    onChange={() => handleComboSelection(combo.id)}
                    disabled={hasIndividualSelection}
                    className="w-5 h-5 sm:w-6 sm:h-6 accent-purple-500"
                  />
                  <span className={`ml-3 sm:ml-4 text-base md:text-lg font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>{combo.name}</span>
                </div>
                <span className={`font-bold text-lg md:text-xl ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>₹{combo.price}</span>
              </label>
            ))}
          </div>
        </div>

        {total > 0 && (
          <div className={`border-t pt-6 md:pt-8 ${
            darkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-2xl md:text-3xl lg:text-4xl font-bold gap-2 sm:gap-4">
              <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>Total:</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                ₹{total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
