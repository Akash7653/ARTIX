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
  transactionId?: string;
  utrId?: string;
}

export const INDIVIDUAL_EVENTS: IndividualEvent[] = [
  { id: 'registration', name: 'Registration', price: 70 },
  { id: 'project_expo', name: 'Project Expo', price: 150 },
];

export const COMBO_OPTIONS: ComboOption[] = [];
