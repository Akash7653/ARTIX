const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  register: async (formData: any) => {
    const form = new FormData();
    form.append('fullName', formData.fullName);
    form.append('email', formData.email);
    form.append('phone', formData.phone);
    form.append('collegeName', formData.collegeName);
    form.append('yearOfStudy', formData.yearOfStudy);
    form.append('branch', formData.branch);
    form.append('rollNumber', formData.rollNumber);
    form.append('selectedIndividualEvents', formData.selectedIndividualEvents.join(','));
    form.append('selectedCombo', formData.selectedCombo);
    form.append('teamMembers', JSON.stringify(formData.teamMembers));
    form.append('totalAmount', formData.totalAmount.toString());
    
    if (formData.paymentScreenshot) {
      form.append('paymentScreenshot', formData.paymentScreenshot);
    }

    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await response.json();
  },

  verifyQR: async (qrData: any) => {
    const response = await fetch(`${API_BASE_URL}/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'QR verification failed');
    }

    return await response.json();
  },

  approveEntry: async (registrationId: string, adminPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/approve-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, adminPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Approval failed');
    }

    return await response.json();
  },

  getRegistration: async (registrationId: string) => {
    const response = await fetch(`${API_BASE_URL}/registration/${registrationId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch registration');
    }

    return await response.json();
  },

  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
