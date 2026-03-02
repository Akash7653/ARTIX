# WhatsApp Messaging - Quick Reference for Admin Dashboard

## 🚀 Quick Start

### Individual Messages (Per Registration)

1. **Login** → Password: `23J41A69A3`
2. **Find participant** in the table (search by name/email/ID)
3. **Expand** the row (click anywhere on it)
4. **Set Verification ID** - Enter unique ID (e.g., ARTIX-001, VER001)
5. **Send WhatsApp** - Click "Send to Participant WhatsApp" button
6. ✅ **Done!** - Message sent with verification details

**What's in the message:**
- Verification ID
- Participant name, college, branch, year
- Team members (if any)
- Event details and registration amount
- Instructions for event entry

---

## 📢 Bulk Message Campaign

### Step-by-Step

1. **Click** "Bulk WhatsApp" button (top right, blue button)
2. **Write your message** in the text box
3. **Use placeholders** for personalization:
   - `{name}` → Will show actual participant name
   - `{verification_id}` → Will show their verification ID
   - `{registration_id}` → Will show their registration ID
   - `{admin_phone}` → Will show +918919068236

4. **Check preview** - See how message looks
5. **Click "Send to All"** - Sends to all approved participants
6. **View results** - See success/failure count

### Example Messages

**Simple:**
```
Hi {name}, your ARTIX 2026 verification ID is {verification_id}. 
For help, WhatsApp +918919068236
```

**Professional:**
```
Dear {name},

Congratulations! Your registration for ARTIX 2026 has been approved.

Verification ID: {verification_id}
Registration ID: {registration_id}

This ID is required for event entry. Keep it safe!

Questions? Contact us at {admin_phone}

See you at ARTIX 2026!
```

**Reminder:**
```
Hi {name}, just a reminder that ARTIX 2026 is starting soon!

Your verification ID: {verification_id}

Don't forget to bring this ID for registration.

Contact: {admin_phone} for any questions.
```

---

## ✅ Requirements Before Sending

### ✓ Individual Messages
- [ ] Participant registration is **Approved**
- [ ] **Verification ID is set** (not empty)
- [ ] Participant has **phone number**

### ✓ Bulk Messages
- [ ] At least **one approved registration** exists
- [ ] Message content is **not empty**
- [ ] Twilio is **configured** (check status endpoint if unsure)

---

## 📊 Message Status

### Status Indicators in Dashboard

| Status | Meaning |
|--------|---------|
| ✅ Sent | Message delivered successfully |
| ⏳ Not Sent | Message not sent yet |
| ❌ Failed | Error during sending |

### Checking Delivery
- Green checkmark = Successfully sent
- Gray icon = Not yet sent
- Red X = Failed (check phone number format)

---

## 🎯 Admin Phone Number

**Current:** +918919068236

This number is:
- Shared in bulk messages for participant support
- Used as point of contact
- Should be your WhatsApp number
- Can be updated in environment variables

---

## ⚙️ Configuration Check

### Verify Twilio Setup

1. Navigate to: `http://your-api/api/admin/twilio-status`
2. Look for:
   ```json
   {
     "twilio_configured": true,
     "all_credentials_valid": true
   }
   ```
3. If **not configured**, contact administrator

---

## 📱 Placeholder Cheat Sheet

| Placeholder | Example | When Used |
|------------|---------|-----------|
| {name} | Raj Kumar | Bulk messages |
| {verification_id} | ARTIX-12345 | Bulk & Individual |
| {registration_id} | ARTIX2026-4567 | Bulk messages |
| {admin_phone} | +918919068236 | Bulk messages |

---

## 🔐 Important Notes

- **Verification IDs** must be unique
- **Phone numbers** must be in +91XXXXXXXXXX format (for India)
- **Messages** can't be edited after sending, only view history in database
- **Bulk sends** to all approved participants - no selections possible
- **Admin phone** number stored securely in environment variables

---

## ❌ Common Issues

### "Twilio credentials not configured"
→ Admin needs to set environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`

### "Verification ID must be set first"
→ Set a verification ID in "Entry Verification Details" section before sending

### "No phone number found"
→ Participant's phone field is empty - need valid phone number

### "Failed to send WhatsApp"
→ Check phone number format: should be +91XXXXXXXXXX

### Message shows "Not Sent" after clicking
→ Check if Twilio is configured properly (see admin/twilio-status)

---

## 📈 Success Tips

1. **Set Verification IDs early** - Before bulk sending campaigns
2. **Use friendly tone** - Add emojis and encourage registration
3. **Include contact info** - Always mention admin phone for support
4. **Test individually first** - Before large bulk campaigns
5. **Verify phone numbers** - Ensure all are in correct format
6. **Group sends by approval status** - Only approved participants receive messages

---

## 📞 Support

For technical issues:
1. Check environment variables are set
2. Verify Twilio account has credits
3. Check phone numbers are valid format
4. Review Twilio logs in console
5. Contact system administrator

---

**Last Updated:** March 2026
**Version:** 1.0
**For:** ARTIX 2K26 Admin Dashboard
