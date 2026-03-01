export interface IndividualEvent {
  id: string;
  name: string;
  price: number;
}

export interface ComboOption {
  id: string;
  name: string;
  price: number;
}

export interface TeamMember {
  name: string;
  branch: string;
  phone: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  collegeName: string;
  yearOfStudy: string;
  branch: string;
  rollNumber: string;
  section: string;
  selectedIndividualEvents: string[];
  selectedCombo: string;
  teamSize: number;
  teamMembers: TeamMember[];
  paymentScreenshot: File | null;
}

export const INDIVIDUAL_EVENTS: IndividualEvent[] = [
  { id: 'registration', name: 'Registration', price: 100 },
  { id: 'project_expo', name: 'Project Expo', price: 150 },
  { id: 'mini_canvas', name: 'Mini Canvas', price: 150 },
  { id: 'tech_game', name: 'Tech Game', price: 50 },
];

export const COMBO_OPTIONS: ComboOption[] = [
  { id: 'combo1', name: 'Combo 1: All Events', price: 300 },
  { id: 'combo2', name: 'Combo 2: Registration + Mini Canvas + Tech Game', price: 250 },
];
