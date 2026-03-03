import * as XLSX from 'xlsx';

interface RegistrationData {
  registration_id: string;
  verification_id?: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  selected_events?: string[];
  total_amount?: number;
  transaction_id?: string;
  utr_id?: string;
  approval_status?: string;
  entry_status?: string;
  team_members?: Array<{
    name: string;
    email: string;
    phone: string;
    branch: string;
    year: string;
  }>;
  created_at?: string;
  notification_sent?: boolean;
}

export const exportToExcel = (data: RegistrationData[], fileName = 'ARTIX-Registrations') => {
  try {
    // Create workbooks
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Registration Summary
    const registrationSummary = data.map(reg => ({
      'Registration ID': reg.registration_id,
      'Verification ID': reg.verification_id || 'N/A',
      'Name': reg.full_name,
      'Email': reg.email,
      'Phone': reg.phone,
      'Branch': reg.branch,
      'Year': reg.year,
      'Events': (reg.selected_events || []).join(', ') || 'N/A',
      'Amount (₹)': reg.total_amount || 0,
      'Transaction ID': reg.transaction_id || 'N/A',
      'UTR ID': reg.utr_id || 'N/A',
      'Approval Status': reg.approval_status || 'N/A',
      'Entry Status': reg.entry_status || 'N/A',
      'Team Size': (reg.team_members?.length || 0) + 1,
      'Notification Sent': reg.notification_sent ? 'Yes' : 'No',
      'Registration Date': reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-IN') : 'N/A'
    }));

    const ws1 = XLSX.utils.json_to_sheet(registrationSummary);
    
    // Auto-fit column widths
    const colWidths = [
      { wch: 15 }, // Registration ID
      { wch: 15 }, // Verification ID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 12 }, // Phone
      { wch: 12 }, // Branch
      { wch: 6 },  // Year
      { wch: 30 }, // Events
      { wch: 12 }, // Amount
      { wch: 15 }, // Transaction ID
      { wch: 15 }, // UTR ID
      { wch: 15 }, // Approval Status
      { wch: 12 }, // Entry Status
      { wch: 10 }, // Team Size
      { wch: 15 }, // Notification Sent
      { wch: 15 }  // Registration Date
    ];
    ws1['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, ws1, 'Registrations');

    // Sheet 2: Team Details
    const teamDetails: any[] = [];
    data.forEach(reg => {
      // Add team leader
      teamDetails.push({
        'Registration ID': reg.registration_id,
        'Team Lead': reg.full_name,
        'Email': reg.email,
        'Phone': reg.phone,
        'Branch': reg.branch,
        'Year': reg.year,
        'Role': 'Team Leader'
      });

      // Add team members
      if (reg.team_members && reg.team_members.length > 0) {
        reg.team_members.forEach(member => {
          teamDetails.push({
            'Registration ID': reg.registration_id,
            'Team Lead': reg.full_name,
            'Email': member.email,
            'Phone': member.phone,
            'Branch': member.branch,
            'Year': member.year,
            'Role': 'Team Member'
          });
        });
      }
    });

    const ws2 = XLSX.utils.json_to_sheet(teamDetails);
    ws2['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 6 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, ws2, 'Team Details');

    // Sheet 3: Event-wise Registration
    const events = new Set<string>();
    data.forEach(reg => {
      (reg.selected_events || []).forEach(event => events.add(event));
    });

    const eventData: any[] = [];
    events.forEach(event => {
      const registeredCount = data.filter(reg => 
        (reg.selected_events || []).includes(event)
      ).length;
      
      let totalParticipants = 0;
      data.forEach(reg => {
        if ((reg.selected_events || []).includes(event)) {
          totalParticipants += (reg.team_members?.length || 0) + 1;
        }
      });

      eventData.push({
        'Event': event.replace(/_/g, ' ').toUpperCase(),
        'Registrations': registeredCount,
        'Total Participants': totalParticipants,
        'Revenue (₹)': registeredCount * 500 // Assuming standard registration fee
      });
    });

    const ws3 = XLSX.utils.json_to_sheet(eventData);
    ws3['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, ws3, 'Event Summary');

    // Sheet 4: Statistics & Summary
    const totalParticipants = data.reduce((sum, reg) => sum + ((reg.team_members?.length || 0) + 1), 0);
    const totalRevenue = data.reduce((sum, reg) => sum + (reg.total_amount || 0), 0);
    const approvedCount = data.filter(r => r.approval_status === 'approved').length;
    const pendingCount = data.filter(r => r.approval_status === 'pending').length;
    const verifiedCount = data.filter(r => r.entry_status === 'verified').length;

    const statsData = [
      { 'Metric': 'Total Registrations', 'Count': data.length },
      { 'Metric': 'Total Participants (incl. teams)', 'Count': totalParticipants },
      { 'Metric': 'Approved Registrations', 'Count': approvedCount },
      { 'Metric': 'Pending Registrations', 'Count': pendingCount },
      { 'Metric': 'Verified Entries', 'Count': verifiedCount },
      { 'Metric': 'Total Revenue (₹)', 'Count': totalRevenue },
      { 'Metric': 'Team Registrations', 'Count': data.filter(r => (r.team_members?.length || 0) > 0).length },
      { 'Metric': 'Average Team Size', 'Count': (totalParticipants / data.length).toFixed(2) },
      { 'Metric': 'Export Date', 'Count': new Date().toLocaleDateString() },
    ];

    const ws4 = XLSX.utils.json_to_sheet(statsData);
    ws4['!cols'] = [
      { wch: 35 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, ws4, 'Summary');

    // Write to file
    XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, message: 'Excel file exported successfully' };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export default exportToExcel;
