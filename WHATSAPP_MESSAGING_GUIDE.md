# WhatsApp Messaging Feature - Admin Guide

## Overview

The ARTIX 2K26 registration system now includes comprehensive WhatsApp messaging capabilities to communicate with event participants. Messages are sent through Twilio's WhatsApp Business API.

## Features

### 1. **Individual Participant Messaging**
- Send WhatsApp messages to individual approved participants
- Messages include verification ID and participant details
- Automatic formatting with team member information (if applicable)
- Available in the admin dashboard for each registration

### 2. **Bulk WhatsApp Campaign**
- Send custom messages to all approved participants at once
- Support for message personalization using placeholders
- Real-time tracking of success/failure rates
- Results summary showing delivery statistics

### 3. **Admin Phone Number Configuration**
- Store admin's WhatsApp phone number (+918919068236)
- Include admin contact in bulk messages for participant support
- Accessible through admin configuration endpoint

## Setup Instructions

### Step 1: Configure Twilio

1. Create a Twilio account at [https://www.twilio.com](https://www.twilio.com)
2. Go to the Twilio Console
3. Get your **Account SID** and **Auth Token**
4. Set up WhatsApp integration:
   - Navigate to Messaging > WhatsApp
   - Get your **WhatsApp Number** (provided by Twilio)
5. Add your number to `.env` file:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
ADMIN_PHONE_NUMBER=+918919068236
```

### Step 2: Verify Phone Numbers

For development/testing:
- Add phone numbers to Twilio's sandbox in your account settings
- Format: +country_code_phone_number

For production:
- Use approved Twilio WhatsApp Business account
- Ensure all phone numbers are in correct format

### Step 3: Deploy Configuration

Update environment variables on your hosting platform:
- **Vercel**: Add to project settings
- **Local**: Add to `.env` file
- **Docker**: Pass as environment variables

## API Endpoints

### Send Message to Individual Participant

**Endpoint:** `POST /api/admin/send-whatsapp-to-participant`

**Parameters:**
```json
{
  "registrationId": "ARTIX2026-1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ WhatsApp message sent to participant successfully!",
  "details": {
    "phone": "+919876543210",
    "messageSid": "SM1234567890abcdef..."
  }
}
```

---

### Send Bulk WhatsApp Campaign

**Endpoint:** `POST /api/admin/bulk-send-whatsapp`

**Parameters:**
```json
{
  "message": "Hi {name}, your verification ID is {verification_id}. Contact us at {admin_phone}",
  "approvalStatus": "approved",
  "adminPhone": "+918919068236"
}
```

**Placeholder Variables:**
- `{name}` - Participant's full name
- `{verification_id}` - Verification ID for event entry
- `{registration_id}` - Registration ID
- `{admin_phone}` - Admin's phone number

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp campaign sent to 45 participants",
  "results": {
    "successful": [/* array of successful sends */],
    "failed": [/* array of failed sends */],
    "total": 50
  },
  "summary": {
    "total_participants": 50,
    "successful_count": 45,
    "failed_count": 5,
    "success_rate": "90.00%"
  }
}
```

---

### Get Admin Configuration

**Endpoint:** `GET /api/admin/config`

**Response:**
```json
{
  "admin_phone_number": "+918919068236",
  "twilio_configured": true,
  "features": {
    "individual_whatsapp": true,
    "bulk_whatsapp": true,
    "email_notifications": true
  }
}
```

---

### Check Twilio Status

**Endpoint:** `GET /api/admin/twilio-status`

**Response:**
```json
{
  "twilio_configured": true,
  "account_sid_set": true,
  "auth_token_set": true,
  "whatsapp_number_set": true,
  "all_credentials_valid": true,
  "message": "✅ Twilio WhatsApp is configured and ready!"
}
```

## Admin Dashboard Usage

### Individual Message Sending

1. **Login** to the admin dashboard with your password
2. **Find** the participant in the registrations table
3. **Expand** their row to see full details
4. **Wait** until their verification ID is set
5. **Click** "Send to Participant WhatsApp" button
6. **Confirm** the message was sent successfully

### Bulk Message Campaign

1. **Click** "Bulk WhatsApp" button in the dashboard header
2. **Enter** your message content:
   - Use placeholders like `{name}`, `{verification_id}`, etc.
   - Messages will be personalized for each participant
3. **Preview** your message before sending
4. **Click** "Send to All"
5. **Monitor** success/failure rates in real-time

## Message Format Examples

### Individual Message Example
```
ARTIX 2026 - REGISTRATION APPROVED

Your registration has been approved!

Verification Details:
Verification ID: VER001234
```

### Bulk Message Examples

**Example 1 - Basic:**
```
Hi {name}, your verification ID for ARTIX 2026 is: {verification_id}
Contact: {admin_phone}
```

**Example 2 - Detailed:**
```
Dear {name},

Congratulations! Your registration for ARTIX 2026 is approved.

Your Verification ID: {verification_id}
Registration ID: {registration_id}

Save this ID for event entry.

For support, WhatsApp us at {admin_phone}
```

**Example 3 - Reminder:**
```
Hi {name},

Event reminder: ARTIX 2026 is starting soon!
Verification ID: {verification_id}

See you there! 
Questions? Contact: {admin_phone}
```

## Troubleshooting

### Issue: Messages Not Sending

**Check Twilio Credentials:**
```bash
curl http://localhost:5000/api/admin/twilio-status
```

**Verify Response:**
- All credential checks should be `true`
- If false, update `.env` file with correct values

### Issue: Invalid Phone Number

**Format Check:**
- Must start with `+`
- Must include country code (e.g., +91 for India)
- Should not have spaces or dashes
- Example: `+919876543210` (correct)

### Issue: Participant Not Found

**Verify:**
1. Registration ID is correct
2. Participant is approved status
3. Phone number is not empty
4. Verification ID has been set

### Issue: Rate Limiting

**Solution:**
- Twilio has rate limits on message sending
- For bulk sends, the system sends messages sequentially
- If you hit limits, wait a few minutes before retrying

## Message Size Limits

- **WhatsApp/Twilio:** 160 characters per SMS unit
- **Recommended:** Keep messages under 1,000 characters
- **Long messages:** Will be split into multiple SMS units
- **Character encoding:** UTF-8 supported

## Security Considerations

1. **Keep TWILIO_AUTH_TOKEN Secret:**
   - Never commit to version control
   - Use environment variables
   - Rotate regularly

2. **Phone Number Validation:**
   - System validates international format
   - Supports country codes

3. **Rate Limiting:**
   - Implement backoffs for bulk sends
   - Monitor for suspicious activity

## Monitoring & Analytics

### Check Message Status

Messages are tracked in the database with:
- `whatsapp_sent` - Boolean flag
- `last_message_sid` - Twilio message ID for tracking
- `notification_sent_at` - Timestamp

### View Delivery Reports

1. Log into Twilio Console
2. Navigate to "Messaging" > "Logs"
3. Filter by phone number or date
4. View delivery status and error codes

## Cost Estimation

**Twilio WhatsApp Pricing (as of 2024):**
- India outbound: ~₹2-3 per message
- International rates vary by country
- Inbound messages: Usually cheaper than outbound

**Example for ARTIX 2026:**
- 500 participants × ₹2.50 = ₹1,250 (approx)

## Additional Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio Pricing](https://www.twilio.com/en-us/messaging/whatsapp/pricing)
- [International Phone Number Formats](https://en.wikipedia.org/wiki/E.164)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Twilio logs in the console
3. Contact your IT administrator
4. Check `/api/admin/twilio-status` endpoint for configuration validation

---

**Last Updated:** March 2026
**Version:** 1.0
**Feature:** WhatsApp Messaging System for ARTIX 2K26
