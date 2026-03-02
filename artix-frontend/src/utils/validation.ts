/**
 * Input validation utilities for form fields
 * Validates email, phone, name, and other inputs
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (10 digits for India)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned);
};

// Name validation (letters and spaces only, min 2 chars)
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name.trim());
};

// College name validation
export const isValidCollege = (college: string): boolean => {
  return college.trim().length >= 3;
};

// Transaction ID validation (typically alphanumeric, min 5 chars)
export const isValidTransactionId = (id: string): boolean => {
  return id.trim().length >= 5 && id.trim().length <= 50;
};

// UTR ID validation
export const isValidUTRId = (id: string): boolean => {
  return id.trim().length >= 5 && id.trim().length <= 50;
};

// Roll number validation
export const isValidRollNumber = (rollNumber: string): boolean => {
  if (!rollNumber || rollNumber.trim().length === 0) return true; // Optional field
  return rollNumber.trim().length >= 2 && rollNumber.trim().length <= 20;
};

// Amount validation (must be positive number)
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount < 100000; // Max 100k
};

// Sanitize input - remove dangerous characters
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};

// Validate form data object
export interface FormValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  collegeName?: string;
  branch?: string;
  rollNumber?: string;
  transactionId?: string;
  utrId?: string;
  totalAmount?: string;
}

export const validateRegistrationForm = (formData: any): FormValidationErrors => {
  const errors: FormValidationErrors = {};

  // Full Name validation
  if (!formData.fullName || !isValidName(formData.fullName)) {
    errors.fullName = 'Name must contain only letters and spaces (min 2 characters)';
  }

  // Email validation
  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address (e.g., user@example.com)';
  }

  // Phone validation
  if (!formData.phone || !isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid 10-digit WhatsApp number';
  }

  // College validation
  if (!formData.collegeName || !isValidCollege(formData.collegeName)) {
    errors.collegeName = 'College name must be at least 3 characters long';
  }

  // Branch validation
  if (!formData.branch || formData.branch.trim().length === 0) {
    errors.branch = 'Please select a branch';
  }

  // Roll number validation (optional but if provided, must be valid)
  if (formData.rollNumber && !isValidRollNumber(formData.rollNumber)) {
    errors.rollNumber = 'Roll number must be 2-20 characters';
  }

  // Year of study validation
  if (!formData.yearOfStudy || formData.yearOfStudy === '') {
    errors.branch = 'Please select your year of study';
  }

  // Transaction ID validation
  if (!formData.transactionId || !isValidTransactionId(formData.transactionId)) {
    errors.transactionId = 'Transaction ID must be 5-50 characters long';
  }

  // UTR ID validation
  if (!formData.utrId || !isValidUTRId(formData.utrId)) {
    errors.utrId = 'UTR ID must be 5-50 characters long';
  }

  // Amount validation
  if (!formData.totalAmount || !isValidAmount(formData.totalAmount)) {
    errors.totalAmount = 'Invalid amount. Please check your events selection';
  }

  return errors;
};

// Get user-friendly error message
export const getErrorMessage = (field: string, value: any): string => {
  switch (field) {
    case 'email':
      return 'Please enter a valid email address';
    case 'phone':
      return 'Please enter a valid 10-digit number';
    case 'fullName':
      return 'Name should contain only letters and spaces';
    case 'collegeName':
      return 'College name is too short';
    case 'transactionId':
      return 'Transaction ID is invalid';
    case 'utrId':
      return 'UTR ID is invalid';
    default:
      return 'Invalid input';
  }
};
