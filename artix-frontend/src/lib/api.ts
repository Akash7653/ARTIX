const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://artix-2yda.onrender.com/api';

// Add timeout to fetch requests
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 30000) => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - server took too long to respond. Please check your internet connection or try again.')), timeout)
    )
  ]);
};

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
    
    // Debug: Log selected events before sending
    const eventsArray = Array.isArray(formData.selectedIndividualEvents) ? formData.selectedIndividualEvents : [];
    const eventsString = eventsArray.join(',');
    console.log('🚀 API: Sending registration with events:', {
      eventsArray: eventsArray,
      eventsCount: eventsArray.length,
      eventsString: eventsString,
      totalAmount: formData.totalAmount,
      formDataType: typeof formData.selectedIndividualEvents
    });
    
    form.append('selectedIndividualEvents', eventsString);
    form.append('teamMembers', JSON.stringify(formData.teamMembers));
    form.append('totalAmount', formData.totalAmount.toString());
    form.append('transactionId', formData.transactionId || '');
    form.append('utrId', formData.utrId || '');
    
    if (formData.paymentScreenshot) {
      form.append('paymentScreenshot', formData.paymentScreenshot);
    }

    try {
      console.log('📤 Registering at:', `${API_BASE_URL}/register`);
      const response = await fetchWithTimeout(`${API_BASE_URL}/register`, {
        method: 'POST',
        body: form,
      }, 30000);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      return await response.json();
    } catch (err) {
      console.error('❌ Registration API error:', err);
      
      // Provide more helpful error messages
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          throw new Error(err.message);
        }
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          throw new Error('Failed to connect to server. This could be a temporary network issue. Please try again.');
        }
      }
      throw err;
    }
  },

  verifyQR: async (qrData: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/verify-qr`, {
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
  },

  getAdminStats: async () => {
    // Add timestamp to force fresh data (cache-busting)
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE_URL}/admin/stats?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return await response.json();
  },

  verifyEntry: async (registrationId: string, transactionId: string, utrId: string) => {
    const response = await fetch(`${API_BASE_URL}/registrations/${registrationId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, utrId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify entry');
    }

    return await response.json();
  }
};
