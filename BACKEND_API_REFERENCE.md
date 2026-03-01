# ARTIX Backend API Reference

**Base URL**: `https://artix-backend.onrender.com`

## Authentication

Currently uses admin credentials for admin endpoints:
- Username: Email from environment variable
- Password: Password from environment variable

## Endpoints

### 1. Register Participant

**POST** `/api/register`

Register a new participant and create an event entry.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "collegeName": "ABC College",
  "yearOfStudy": "2nd Year",
  "branch": "CSE",
  "rollNumber": "12345",
  "section": "A",
  "selectedIndividualEvents": ["coding_contest"],
  "selectedCombo": "",
  "teamMembers": [],
  "teamSize": 0,
  "paymentScreenshot": "data:image/png;base64,...",
  "transactionId": "TXN123456789",
  "utrId": "UTR123456789"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "registrationId": "ARTIX2026-4567",
  "verificationId": "VER-ABCD-EFGH-IJKL",
  "message": "Registration successful"
}
```

**Response (Duplicate Email - 400):**
```json
{
  "error": "Email already registered"
}
```

---

### 2. Get Registration Details

**GET** `/api/registration/:registrationId`

Retrieve registration details using either registration ID or verification ID.

**Query Parameters:**
- `registrationId` or `verificationId` (path parameter)

**Response (Success - 200):**
```json
{
  "_id": "ObjectId",
  "registration_id": "ARTIX2026-4567",
  "verification_id": "VER-ABCD-EFGH-IJKL",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "collegeName": "ABC College",
  "yearOfStudy": "2nd Year",
  "branch": "CSE",
  "rollNumber": "12345",
  "section": "A",
  "selectedIndividualEvents": ["coding_contest"],
  "selectedCombo": "",
  "teamSize": 0,
  "teamMembers": [],
  "paymentScreenshotUrl": "",
  "transactionId": "TXN123456789",
  "utrId": "UTR123456789",
  "verified": false,
  "createdAt": "2026-03-01T10:00:00Z",
  "updatedAt": "2026-03-01T10:00:00Z"
}
```

**Response (Not Found - 404):**
```json
{
  "error": "Registration not found"
}
```

---

### 3. Verify Entry (Admin)

**POST** `/api/registrations/:registrationId/verify`

Admin verifies a participant by checking payment details.

**Request Body:**
```json
{
  "verificationId": "VER-ABCD-EFGH-IJKL",
  "transactionIdFromScreenshot": "TXN123456789",
  "utrIdFromScreenshot": "UTR123456789",
  "adminPassword": "admin_password_here"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Entry verified successfully",
  "registration": {
    "registration_id": "ARTIX2026-4567",
    "verification_id": "VER-ABCD-EFGH-IJKL",
    "verified": true
  }
}
```

**Response (Invalid IDs - 400):**
```json
{
  "error": "Transaction or UTR ID mismatch"
}
```

**Response (Wrong Password - 401):**
```json
{
  "error": "Invalid admin password"
}
```

---

### 4. Update Payment Details

**POST** `/api/registrations/:registrationId/payment`

Update or add payment information for a registration.

**Request Body:**
```json
{
  "transactionId": "TXN987654321",
  "utrId": "UTR987654321",
  "paymentScreenshot": "data:image/png;base64,..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Payment updated successfully"
}
```

---

### 5. Search Registration (Admin)

**GET** `/api/search`

Search for registrations using verification ID or registration ID.

**Query Parameters:**
- `searchId` - Can be either verification ID or registration ID

**Example:**
```
GET /api/search?searchId=VER-ABCD-EFGH-IJKL
```

**Response (Success - 200):**
```json
{
  "found": true,
  "registration": {
    "registration_id": "ARTIX2026-4567",
    "verification_id": "VER-ABCD-EFGH-IJKL",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    ...
  }
}
```

**Response (Not Found - 404):**
```json
{
  "found": false,
  "message": "No registration found"
}
```

---

## Testing with cURL

### Register a Participant
```bash
curl -X POST https://artix-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "9999999999",
    "collegeName": "Test College",
    "yearOfStudy": "2nd Year",
    "branch": "CSE",
    "rollNumber": "12345",
    "section": "A",
    "selectedIndividualEvents": ["coding_contest"],
    "selectedCombo": "",
    "teamMembers": [],
    "teamSize": 0,
    "transactionId": "TXN123456789",
    "utrId": "UTR123456789"
  }'
```

### Get Registration Details
```bash
curl https://artix-backend.onrender.com/api/registration/ARTIX2026-4567
```

### Search with Verification ID
```bash
curl "https://artix-backend.onrender.com/api/search?searchId=VER-ABCD-EFGH-IJKL"
```

### Verify Entry (Admin)
```bash
curl -X POST https://artix-backend.onrender.com/api/registrations/ARTIX2026-4567/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "VER-ABCD-EFGH-IJKL",
    "transactionIdFromScreenshot": "TXN123456789",
    "utrIdFromScreenshot": "UTR123456789",
    "adminPassword": "your_admin_password"
  }'
```

---

## Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 400 | Bad Request | Missing required fields or invalid format |
| 401 | Unauthorized | Missing/wrong admin password |
| 404 | Not Found | Registration ID/Verification ID doesn't exist |
| 409 | Conflict | Email already registered or duplicate |
| 500 | Server Error | MongoDB connection or server issue |

---

## Database Schema

### Registrations Collection
```json
{
  "_id": ObjectId,
  "registration_id": "ARTIX2026-XXXX",
  "verification_id": "VER-XXXX-XXXX-XXXX",
  "fullName": "String",
  "email": "String (unique)",
  "phone": "String",
  "collegeName": "String",
  "yearOfStudy": "String",
  "branch": "String",
  "rollNumber": "String",
  "section": "String",
  "selectedIndividualEvents": ["String"],
  "selectedCombo": "String",
  "teamSize": Number,
  "teamMembers": [Array],
  "paymentScreenshotUrl": "String",
  "transactionId": "String",
  "utrId": "String",
  "verified": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

---

**Last Updated**: March 1, 2026  
**API Version**: 1.0  
**Status**: Production Ready
