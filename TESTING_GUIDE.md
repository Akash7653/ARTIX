# ARTIX 2K26 - Testing & Troubleshooting Guide

## 🧪 Complete Testing Checklist

### Phase 1: Backend Setup Verification

```bash
# 1. Navigate to backend
cd artix-backend

# 2. Install dependencies
npm install

# 3. Verify environment
cat .env
# Should show all required variables

# 4. Initialize database
node initDb.js
# Expected output: ✅ Connected successfully
#                  ✅ Created: registrations
#                  ✅ Created: payments
#                  ✅ Created: team_members
#                  ✅ Database Initialization Complete!

# 5. Start backend
npm start
# Expected: 🚀 ARTIX Server running on http://localhost:5000
```

### Phase 2: API Endpoint Testing

```bash
# Run the automated API test suite
npm test

# Or manually test with curl:

# Test health check
curl http://localhost:5000/api/health

# Expected response:
# {
#   "status": "ok",
#   "message": "ARTIX Server is running"
# }
```

### Phase 3: Frontend Setup Verification

```bash
# 1. Navigate to frontend
cd artix-frontend

# 2. Install dependencies
npm install

# 3. Verify environment
cat .env.local
# Should show: VITE_API_URL=http://localhost:5000/api

# 4. Build check
npm run build
# Should complete without errors

# 5. Start dev server
npm run dev
# Expected: ➜  Local:   http://localhost:5173/
```

### Phase 4: Manual UI Testing

#### Registration Form Tests
- [ ] Page loads without console errors
- [ ] All form fields are visible
- [ ] Form validation works:
  - [ ] Full Name: Required
  - [ ] Email: Required, valid format
  - [ ] Phone: Required, 10 digits only
  - [ ] College Name: Required
  - [ ] Year of Study: Dropdown works
  - [ ] Branch: Required
  - [ ] Roll Number: Required

#### Event Selection Tests
- [ ] Individual Events section displays 4 events
- [ ] Can select multiple individual events
- [ ] Combo Options section displays 2 options
- [ ] Cannot select individual + combo simultaneously
- [ ] Individual selection disables combos
- [ ] Combo selection disables individual events
- [ ] Total calculation updates in real-time
- [ ] Selecting events shows payment section

#### Team Members Tests (Project Expo)
- [ ] Team members section only shows with Project Expo selected
- [ ] Team size dropdown shows 1, 2, 3 options
- [ ] Selecting team size generates input fields
- [ ] First member marked as "Team Leader"
- [ ] Other members show "Member 2", "Member 3"
- [ ] All member fields required (name, branch, phone)
- [ ] Phone validation (10 digits)
- [ ] Remove Project Expo hides team section

#### Payment Tests
- [ ] Payment section only shows when events selected
- [ ] UPI QR code displays
- [ ] Total amount shown correctly
- [ ] QR code updates when total changes
- [ ] Payment screenshot upload works
- [ ] Submit button disabled until screenshot uploaded
- [ ] Form submission shows loading state

#### Confirmation Page Tests
- [ ] Shows after successful registration
- [ ] Displays registration ID (ARTIX2026-XXXX format)
- [ ] Shows participant details correctly
- [ ] Entry QR code displayed
- [ ] Download QR button works
- [ ] All information matches submitted data

#### Mobile Responsiveness Tests
- [ ] Form stacks properly on mobile (320px+)
- [ ] Buttons are thumb-friendly (min 44px)
- [ ] Images scale appropriately
- [ ] No horizontal scroll
- [ ] All text is readable
- [ ] Team member forms display well on mobile
- [ ] QR codes display properly on mobile

### Phase 5: Admin Scanner Testing

Access: `http://localhost:5173/admin-scan`

#### Authentication Tests
- [ ] Password field shows
- [ ] Entering wrong password shows error
- [ ] Entering correct password (artix2026admin) logs in
- [ ] Login button functional

#### Scanner Tests
- [ ] Camera permission request appears
- [ ] QR scanner loads
- [ ] Can scan test QR codes
- [ ] Scanned participant details display
- [ ] All participant fields show correctly
- [ ] Team members display with team leader badge
- [ ] Entry status shows correctly

#### Approval Tests
- [ ] Approve Entry button visible for pending entries
- [ ] Click Approve changes status to "approved"
- [ ] Success message displays
- [ ] Cannot approve already-approved entries
- [ ] Shows "Entry Already Verified" alert
- [ ] Reject button works
- [ ] Logout button functional

### Phase 6: Browser Compatibility Testing

Test on each browser:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Test on devices:
- [ ] Desktop (1920px+)
- [ ] Laptop (1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px, 414px)

---

## 🔍 Detailed Test Scenarios

### Scenario 1: Complete Registration Flow

1. **User Registration**
   ```
   - Fill in participant details
   - Select 2 individual events
   - Upload payment screenshot
   - Submit registration
   ```

   Expected Result:
   ```
   - Registration ID generated
   - Entry QR code displays
   - Confirmation page shows
   - No console errors
   ```

2. **Admin Entry Verification**
   ```
   - Go to /admin-scan
   - Enter password (artix2026admin)
   - Scan the entry QR code
   - Click "Approve Entry"
   ```

   Expected Result:
   ```
   - Participant details load
   - Entry status changes to "approved"
   - Success message displays
   - Cannot re-approve same entry
   ```

### Scenario 2: Project Expo Registration

1. **Registration with Team**
   ```
   - Select "Project Expo" event
   - Fill participant details
   - Select "3 Members" team size
   - Fill all 3 team member details
   - Upload payment screenshot
   - Submit
   ```

   Expected Result:
   ```
   - Team leader marked correctly
   - All team members saved
   - Entry QR includes team data
   - Admin scanner shows team members
   ```

### Scenario 3: Combo Purchase

1. **Combo Registration**
   ```
   - Select Combo 1 (All Events - ₹300)
   - Fill participant details
   - Individual events section disabled
   - Upload payment screenshot
   - Submit
   ```

   Expected Result:
   ```
   - Total shows ₹300
   - Registration shows combo selection
   - No individual events in confirmation
   ```

### Scenario 4: Duplicate Email Prevention

1. **First Registration**
   ```
   - Register with email: test@example.com
   - Complete registration successfully
   ```

2. **Second Registration Attempt**
   ```
   - Try to register with same email
   - Submit form
   ```

   Expected Result:
   ```
   - Error message: "Email already registered"
   - Registration fails
   - Form stays filled for user to correct
   ```

---

## 🐛 Common Issues & Solutions

### Issue: Backend won't start

**Symptom**: `Error: connect ECONNREFUSED`

**Solutions**:
```bash
# Check if port 5000 is in use
lsof -i :5000
# Kill the process using port 5000
kill -9 <PID>

# Or use different port
PORT=5001 npm start
# Then update frontend .env.local
VITE_API_URL=http://localhost:5001/api
```

### Issue: MongoDB connection fails

**Symptom**: `MongoServerError: connect ECONNREFUSED`

**Solutions**:
```bash
# Verify connection string
cat .env | grep MONGODB_URI

# Test connection string manually
node -e "const {MongoClient} = require('mongodb'); \
const client = new MongoClient(process.env.MONGODB_URI); \
client.connect().then(() => console.log('Connected')).catch(e => console.error(e))"

# Check MongoDB Atlas:
# 1. Verify database user credentials
# 2. Check IP whitelist includes your IP
# 3. Ensure cluster is running
```

### Issue: Frontend can't connect to backend

**Symptom**: Network errors in console, form submission fails

**Solutions**:
```bash
# Verify VITE_API_URL is correct
cat artix-frontend/.env.local

# Test backend health
curl http://localhost:5000/api/health

# Check CORS configuration in backend
# server.js should have:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

# Clear browser cache
# CTRL+SHIFT+Delete (Chrome) or Cmd+Shift+Delete (Mac)

# Try hard refresh
# CTRL+F5 (Windows) or Cmd+Shift+R (Mac)
```

### Issue: Payment screenshot upload fails

**Symptom**: "Upload failed" error message

**Solutions**:
```bash
# Check uploads directory exists
ls -la artix-backend/uploads/
# Create if needed:
mkdir -p artix-backend/uploads

# Check file permissions
chmod 755 artix-backend/uploads

# Check file size limit in server.js
// Should be: express.json({ limit: '50mb' })

# Verify multer configuration
// storage should point to existing directory
```

### Issue: QR code not displaying

**Symptom**: QR code areas are blank

**Solutions**:
```bash
# Check QRCode library is installed
npm list qrcode

# Verify QR data isn't too large
# JSON stringified data should be < 2KB

# Check browser console for errors
# Usually indicates canvas rendering issue

# Try different browser
```

### Issue: Admin scanner doesn't scan

**Symptom**: Camera loads but no scanning

**Solutions**:
```bash
# Check camera permissions
# Browser should request camera access
# Grant permission if blocked

# Verify html5-qrcode is installed
npm list html5-qrcode

# Test with different QR code
# Generate test code: https://www.qr-code-generator.com/

# Check browser console for errors
```

### Issue: Validation errors not showing

**Symptom**: Form appears to submit but silently fails

**Solutions**:
```bash
# Check browser console for JavaScript errors
# Check Network tab for API response

# Verify error handling in components
// Check for try-catch blocks

# Enable logging in API calls
// Temporarily add console.log in FetchAPI
```

---

## 📊 Database Verification

### Check Collections

```bash
# Connect to MongoDB Atlas
mongosh "your_connection_string"

# List all collections
show collections

# Check registrations
db.registrations.find({}).pretty()

# Count documents
db.registrations.countDocuments()

# Find specific registration
db.registrations.findOne({ email: "test@example.com" })
```

### Verify Indexes

```bash
# List all indexes
db.registrations.getIndexes()

# Should see:
# [
#   { "v": 2, "key": { "_id": 1 } },
#   { "v": 2, "key": { "email": 1 }, "unique": true },
#   { "v": 2, "key": { "registration_id": 1 }, "unique": true }
# ]
```

### Sample Data for Testing

```javascript
// Insert test registration
db.registrations.insertOne({
  registration_id: "ARTIX2026-0001",
  full_name: "Test User",
  email: "test@example.com",
  phone: "9876543210",
  college_name: "Malla Reddy Engineering College",
  year_of_study: "3rd Year",
  branch: "IoT",
  roll_number: "IOT001",
  selected_events: ["registration", "mini_canvas"],
  event_type: "individual",
  total_amount: 250,
  payment_screenshot_path: "/uploads/test.jpg",
  entry_status: "pending",
  created_at: new Date()
});
```

---

## 📈 Performance Testing

### Load Testing with ApacheBench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/api/health

# Expected: < 100ms response time for health check
```

### Check Memory Usage

```bash
# Start terminal monitoring
watch -n 1 'ps aux | grep node'

# Or use Node's built-in profiler
node --prof server.js

# Process results
node --prof-process isolate-*.log > results.txt
cat results.txt
```

---

## 🚀 Performance Optimization Checks

- [ ] API responses < 200ms
- [ ] Frontend build size < 500KB
- [ ] Images optimized (use WebP)
- [ ] Database indexes created
- [ ] API caching implemented (if needed)
- [ ] Gzip compression enabled

---

## 📝 Test Report Template

```markdown
## ARTIX 2K26 - Test Report
**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Production]

### Results Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX

### Backend Tests
- [ ] Health Check: PASS/FAIL
- [ ] Registration: PASS/FAIL
- [ ] QR Verification: PASS/FAIL
- [ ] Admin Approval: PASS/FAIL
- [ ] Statistics: PASS/FAIL

### Frontend Tests
- [ ] Registration Form: PASS/FAIL
- [ ] Event Selection: PASS/FAIL
- [ ] Team Members: PASS/FAIL
- [ ] Payment: PASS/FAIL
- [ ] Confirmation: PASS/FAIL

### Issues Found
1. [Issue]: [Description] [Priority]
2. [Issue]: [Description] [Priority]

### Sign-off
- Tester: [Signature]
- Date: [Date]
```

---

**Last Updated**: March 1, 2026
**Version**: 1.0.0
