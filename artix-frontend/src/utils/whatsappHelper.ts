import { RegistrationFormData } from '../types/registration';

const ADMIN_PHONE = '+919398176430';

/**
 * Generates a WhatsApp-formatted message from registration data
 * Follows the template format with proper spacing and emojis
 */
export function generateWhatsAppMessage(
  participantName: string,
  collegeName: string,
  branch: string,
  year: string,
  phone: string,
  selectedEvents: string[],
  totalAmount: number,
  registrationId: string,
  verificationId?: string,
  teamMembers?: Array<{ member_name: string; member_branch: string; member_phone: string }>
): string {
  // Format event names (replace underscores with spaces and capitalize)
  const formattedEvents = selectedEvents
    .map(event => event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ');

  // Build the base message
  const lines: string[] = [
    '🎉 *ARTIX 2026 - REGISTRATION APPROVED* 🎉',
    '',
    '✅ Your registration has been approved!',
    '',
    '🔎 *Verification Details:*',
    verificationId
      ? `Verification ID: *${verificationId}*`
      : 'Verification ID: *Pending Admin Approval*',
    '',
    '👤 *Participant Information:*',
    `Name: ${participantName}`,
    `College: ${collegeName}`,
    `Branch: ${branch}`,
    `Year: ${year}`,
    `Phone: ${phone}`,
    ''
  ];

  // Add team details only if team exists (team size > 1)
  if (teamMembers && teamMembers.length > 0) {
    lines.push('👥 *Team Details:*');
    lines.push(`Team Leader: ${participantName}`);
    
    teamMembers.forEach((member, index) => {
      lines.push(`Member ${index + 1}: ${member.member_name} (${member.member_branch})`);
    });
    
    lines.push('');
  }

  // Add event and amount details
  lines.push('📅 *Event Details:*');
  lines.push(`Events: ${formattedEvents}`);
  lines.push(`Total Amount: ₹${totalAmount}`);
  lines.push(`Registration ID: ${registrationId}`);
  lines.push('');
  
  // Add instructions
  lines.push('📌 *Verification Instructions:*');
  lines.push('Use your Verification ID at the event registration desk for quick entry verification.');
  lines.push('');
  lines.push('---');
  lines.push('For assistance, contact ARTIX Admin Team');
  lines.push(`Admin Contact: ${ADMIN_PHONE}`);

  return lines.join('\n');
}

/**
 * Opens WhatsApp Web in a new tab with pre-filled message
 * Uses the wa.me endpoint which is the official free WhatsApp method
 * 
 * Requirements:
 * - Phone number must be without "+" sign
 * - Phone number must include country code (91 for India)
 * - Message must be URL encoded
 * - Works on both mobile and desktop
 */
export function openWhatsAppWeb(phoneNumber: string, message: string): void {
  try {
    // Sanitize phone number: remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Ensure country code 91 is included (for India)
    let finalPhone = cleanPhone;
    if (!cleanPhone.startsWith('91')) {
      // If starts with 0 (Indian domestic format), remove it and add 91
      if (cleanPhone.startsWith('0')) {
        finalPhone = '91' + cleanPhone.substring(1);
      } else if (cleanPhone.length === 10) {
        // If it's 10 digits, prepend 91
        finalPhone = '91' + cleanPhone;
      }
    }
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Construct the WhatsApp URL
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;
    
    console.log('📱 Opening WhatsApp Web...');
    console.log(`Phone: ${finalPhone}`);
    console.log(`Message length: ${message.length} characters`);
    
    // Open in a new tab
    // Using "_blank" to open in new tab
    // window.open handles both mobile (redirects to app) and desktop (opens web)
    const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    // Verify the window was opened
    if (!whatsappWindow) {
      console.warn('⚠️ Pop-up blocked. Try opening WhatsApp manually.');
      // Fallback: Show the URL so user can copy it
      console.log('WhatsApp URL:', whatsappUrl);
      notifyUserOfWhatsAppFailure(finalPhone, message);
    } else {
      console.log('✅ WhatsApp Web opened successfully');
    }
  } catch (error) {
    console.error('❌ Error opening WhatsApp:', error);
    throw new Error('Failed to open WhatsApp. Please check your internet connection.');
  }
}

/**
 * Notify user if WhatsApp opening failed (for popup blockers)
 */
function notifyUserOfWhatsAppFailure(phone: string, message: string): void {
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  
  const fallbackText = `WhatsApp couldn't open. Click here to continue: ${whatsappUrl}`;
  console.log(fallbackText);
  
  // You could also show a toast notification or alert to the user
  // This is optional and can be integrated with your toast notification system
}

/**
 * Format phone number for display purposes
 * Converts from 9876543210 or 919876543210 format to +91 98765 43210
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.substring(0, 5)} ${cleanPhone.substring(5)}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 7)} ${cleanPhone.substring(7)}`;
  }
  
  return phone;
}

/**
 * Check if WhatsApp is available on the device
 * Returns true if we can open WhatsApp (browser supports window.open)
 */
export function isWhatsAppAvailable(): boolean {
  // WhatsApp Web and wa.me work on all modern browsers
  // So we just need to ensure we can use window.open
  return typeof window !== 'undefined';
}

/**
 * Generate a test message to verify format
 */
export function generateTestMessage(): string {
  return generateWhatsAppMessage(
    'Test User',
    'Malla Reddy Engineering College',
    'Computer Science',
    '2nd Year',
    '9876543210',
    ['web_development', 'iot_demo'],
    500,
    'ARTIX2026-1234',
    'VER001234',
    [
      { member_name: 'Team Member 1', member_branch: 'CSE', member_phone: '9876543211' },
      { member_name: 'Team Member 2', member_branch: 'CSE', member_phone: '9876543212' }
    ]
  );
}
