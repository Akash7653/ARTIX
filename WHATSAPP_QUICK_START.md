# WhatsApp Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Twilio account with WhatsApp enabled
- Node.js backend running
- React frontend updated
- Environment variables configured

### Step 1: Get Twilio Credentials
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Copy your **Account SID** and **Auth Token**
3. Get your **WhatsApp Number** (allocated by Twilio)

### Step 2: Configure Environment
```bash
# In artix-backend/.env (or Vercel settings)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
ADMIN_PHONE_NUMBER=+918919068236
```

### Step 3: Verify Setup
```bash
# Test endpoint to verify configuration
curl http://localhost:5000/api/admin/twilio-status

# Expected response:
{
  "twilio_configured": true,
  "all_credentials_valid": true,
  "message": "✅ Twilio WhatsApp is configured and ready!"
}
```

### Step 4: Test Individual Message
```bash
curl -X POST http://localhost:5000/api/admin/send-whatsapp-to-participant \
  -H "Content-Type: application/json" \
  -d '{"registrationId": "ARTIX2026-1234"}'
```

### Step 5: Test Bulk Message
```bash
curl -X POST http://localhost:5000/api/admin/bulk-send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi {name}, your verification ID is {verification_id}. Contact {admin_phone}",
    "approvalStatus": "approved",
    "adminPhone": "+918919068236"
  }'
```

---

## 📱 Code Examples

### Send to Single Participant (Frontend)
```typescript
const response = await fetch(`${baseUrl}/admin/send-whatsapp-to-participant`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ registrationId: reg.registration_id })
});

const data = await response.json();
if (data.success) {
  alert('✅ Message sent!');
}
```

### Send Bulk Message (Frontend)
```typescript
const response = await fetch(`${baseUrl}/admin/bulk-send-whatsapp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: "Hi {name}, your ID is {verification_id}",
    approvalStatus: 'approved',
    adminPhone: '+918919068236'
  })
});

const data = await response.json();
console.log(`Success: ${data.results.successful.length}`);
console.log(`Failed: ${data.results.failed.length}`);
```

### Check Configuration (Frontend)
```typescript
const response = await fetch(`${baseUrl}/admin/config`);
const config = await response.json();

console.log('Admin Phone:', config.admin_phone_number);
console.log('Twilio Ready:', config.twilio_configured);
```

---

## 🔍 Debugging

### Debug Individual Send
```javascript
// In browser console
fetch('/admin/send-whatsapp-to-participant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ registrationId: 'ARTIX2026-1234' })
})
.then(r => r.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Debug Status
```javascript
// Check if Twilio is configured
fetch('/admin/twilio-status')
  .then(r => r.json())
  .then(data => console.log('Twilio Status:', data));
```

### Check Logs (Backend)
```bash
# Terminal where backend is running
# Should see logs like:
# 💬 === WHATSAPP SENDING START ===
# 📱 Formatted Phone: whatsapp:+919876543210
# ✅ WhatsApp sent successfully!
# 💬 === WHATSAPP SENDING END ===
```

---

## 🎯 Key Files

### Backend
- **Main:** `artix-backend/server.js`
  - Line ~130: Admin phone config
  - Line ~1365: bulk-send-whatsapp endpoint
  - Line ~1465: config endpoint
  - Line ~1138: sendWhatsAppNotification function

### Frontend
- **Main:** `artix-frontend/src/components/AdminDashboard.tsx`
  - Line ~2: Import Send icon
  - Line ~74: State variables for bulk messaging
  - Line ~370: handleSendBulkWhatsApp function
  - Line ~760: Bulk WhatsApp button
  - Line ~1100: Modal component for bulk messages

### Config
- **Environment:** `artix-backend/.env.example`
- **Documentation:** `WHATSAPP_MESSAGING_GUIDE.md`

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| 403 Unauthorized | Check Twilio credentials in `.env` |
| Invalid phone | Format: +country_code_number (e.g., +919876543210) |
| Message not sent | Twilio might be in sandbox mode - add recipient to approved list |
| Rate limit error | Space out bulk sends or upgrade Twilio account |
| Message too long | Keep under 1,000 characters |

---

## 📊 Database Fields Added

```javascript
// New fields in registrations collection
{
  bulk_notification_sent: boolean,        // Flag for bulk sends
  bulk_notification_sent_at: Date,       // When bulk message sent
  last_message_sid: string,              // Twilio message ID
  whatsapp_sent: boolean,                // Individual send flag
  whatsapp_message_sid: string          // Twilio message ID
}
```

---

## 🔐 Security Notes

1. **Never expose TWILIO_AUTH_TOKEN** in frontend code
2. **Use environment variables** for all secrets
3. **Validate phone numbers** before sending
4. **Implement rate limiting** for bulk sends
5. **Log all message attempts** for audit trail

---

## 📈 Performance Tips

1. **Bulk sends:** Sequential by design (prevents rate limiting)
2. **Expected speed:** ~1-2 messages per second
3. **Large campaigns:** 500 messages = ~5-10 minutes
4. **Monitor Twilio logs** for delivery reports

---

## ✅ Testing Checklist

```
[ ] Twilio account created
[ ] WhatsApp integration enabled
[ ] Credentials copied to .env
[ ] Backend restarted with new .env
[ ] GET /admin/twilio-status returns true
[ ] Test participant created with phone
[ ] Individual message sends successfully
[ ] Message includes verification ID
[ ] Bulk message modal opens
[ ] Message preview displays
[ ] Bulk message sends without errors
[ ] Database updated with delivery info
[ ] Success rate calculated correctly
[ ] Failed sends captured in results
```

---

## 🎓 Learning Resources

- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **API Reference:** `/admin/twilio-status` endpoint
- **Message Templates:** See WHATSAPP_QUICK_REFERENCE.md

---

## 📞 Getting Help

### Check Status First
```bash
# Terminal
curl http://localhost:5000/api/admin/twilio-status

# Browser console
fetch('/api/admin/twilio-status').then(r => r.json()).then(console.log)
```

### Review Logs
- Backend: Check terminal where `npm start` is running
- Frontend: Check browser DevTools Console
- Twilio: Check Twilio Console > Logs

### Common Solutions
1. Restart backend after .env changes
2. Clear browser cache (Ctrl+Shift+Delete)
3. Verify phone format: +country_code_number
4. Check Twilio account hasn't run out of credits

---

## 🚀 Deployment

### Vercel (Frontend)
1. Redeploy to pick up updated code
2. No environment variables needed (API calls go to backend)

### Backend (Any Platform)
1. Update environment variables:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_WHATSAPP_NUMBER
   - ADMIN_PHONE_NUMBER

2. Redeploy backend
3. Test with `/admin/twilio-status` endpoint

---

## 📋 API Request/Response Examples

### Bulk Send Request
```json
{
  "message": "Hi {name}, ARTIX 2026 is starting! Your ID: {verification_id}\nFor help: {admin_phone}",
  "approvalStatus": "approved",
  "adminPhone": "+918919068236"
}
```

### Bulk Send Response
```json
{
  "success": true,
  "message": "WhatsApp campaign sent to 45 participants",
  "results": {
    "successful": [
      {
        "registration_id": "ARTIX2026-1234",
        "phone": "+919876543210",
        "name": "Raj Kumar",
        "messageId": "SM123456789..."
      }
    ],
    "failed": [],
    "total": 45
  },
  "summary": {
    "total_participants": 45,
    "successful_count": 45,
    "failed_count": 0,
    "success_rate": "100.00%"
  }
}
```

---

## 🎉 Success Indicators

- ✅ `/admin/twilio-status` returns `true` for all fields
- ✅ Individual messages send with Twilio message ID
- ✅ Bulk messages show success/failure counts
- ✅ Database updates with delivery status
- ✅ Admin dashboard shows message status
- ✅ Twilio Console shows message logs

---

**Ready to go! Start sending messages! 🚀**

Questions? Check WHATSAPP_MESSAGING_GUIDE.md for detailed documentation.
