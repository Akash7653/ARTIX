# ARTIX 2K26 - Event Registration System

A professional, fully-featured event registration web application for ARTIX 2026 (Department of Internet of Things, Malla Reddy Engineering College).

## 🌟 Features

### Frontend

- **Responsive Design**: Mobile-first responsive layout with stunning glassmorphism UI
- **Dark Tech Theme**: Black + Neon Blue + Electric Purple color scheme
- **Smooth Animations**: Professional fade-in and bounce animations
- **Participant Registration**: Comprehensive form with validation
- **Event Selection**: Individual events or combo packages with smart toggling
- **Project Expo Teams**: Dynamic team member management (1-3 members)
- **Payment Integration**: UPI QR code generation with real-time total calculation
- **Confirmation Page**: Registration ID display with entry QR code download
- **Admin Scanner**: Password-protected QR code scanning for entry verification

### Backend

- **MongoDB Integration**: Secure database with connection to your IOT cluster
- **RESTful APIs**: Complete API endpoints for all operations
- **File Upload**: Payment screenshot storage with local disk management
- **QR Code Generation**: Dynamic QR codes for UPI and entry verification
- **Admin Authentication**: Secure password-protected admin panel
- **Email Validation**: Prevent duplicate registrations
- **Entry Status Tracking**: Approve/reject participant entry

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas Account** (or local MongoDB instance)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory**:
```bash
cd artix-backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
Create a `.env` file with your settings (already created with defaults):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase
FRONTEND_URL=http://localhost:5173
ADMIN_PASSWORD=artix2026admin
```

4. **Start the server**:
```bash
npm start
# or for development with auto-reload
npx nodemon server.js
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd artix-frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
The `.env.local` file is already configured:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start development server**:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📚 API Documentation

### Endpoints

#### 1. Register User
```
POST /api/register
Content-Type: multipart/form-data

Form Data:
- fullName: string
- email: string (unique)
- phone: string (10 digits)
- collegeName: string
- yearOfStudy: string
- branch: string
- rollNumber: string
- selectedIndividualEvents: comma-separated string
- selectedCombo: string (optional)
- teamMembers: JSON string
- totalAmount: number
- paymentScreenshot: File

Response:
{
  "success": true,
  "registrationId": "ARTIX2026-XXXX",
  "entryQRCode": "data:image/png;base64,...",
  "message": "Registration successful"
}
```

#### 2. Verify QR Code
```
POST /api/verify-qr
Content-Type: application/json

Body:
{
  "qrData": { /* QR data object */ }
}

Response:
{
  "success": true,
  "registration": {
    "registration_id": "ARTIX2026-XXXX",
    "full_name": "...",
    "phone": "...",
    "selected_events": [...],
    "entry_status": "pending|approved"
  }
}
```

#### 3. Admin Approve Entry
```
POST /api/admin/approve-entry
Content-Type: application/json

Body:
{
  "registrationId": "ARTIX2026-XXXX",
  "adminPassword": "artix2026admin"
}

Response:
{
  "success": true,
  "message": "Entry approved",
  "registration": {
    "registration_id": "ARTIX2026-XXXX",
    "status": "approved"
  }
}
```

#### 4. Get Registration
```
GET /api/registration/:registrationId

Response:
{
  "registration": { /* registration object */ },
  "teamMembers": [ /* team member objects */ ],
  "entryQRCode": "data:image/png;base64,..."
}
```

#### 5. Get Payment Details
```
GET /api/payment/:registrationId

Response:
{
  "registration_id": "...",
  "amount": 300,
  "upi_id": "8919068236@ybl",
  "payee_name": "PUNDRU MEGHAN REDDY",
  "payment_status": "pending"
}
```

#### 6. Admin Statistics
```
GET /api/admin/stats

Response:
{
  "totalRegistrations": 150,
  "approvedEntries": 120,
  "pendingEntries": 30,
  "totalRevenue": 42000
}
```

#### 7. Health Check
```
GET /api/health

Response:
{
  "status": "ok",
  "message": "ARTIX Server is running"
}
```

## 🗄️ Database Schema

### Collections

#### registrations
```javascript
{
  _id: ObjectId,
  registration_id: String (unique),
  full_name: String,
  email: String (unique),
  phone: String,
  college_name: String,
  year_of_study: String,
  branch: String,
  roll_number: String,
  selected_events: [String],
  event_type: String ('combo' | 'individual'),
  total_amount: Number,
  payment_screenshot_path: String,
  payment_screenshot_filename: String,
  entry_status: String ('pending' | 'approved' | 'rejected'),
  entry_approved_at: Date,
  created_at: Date,
  team_members: [Object] // Only if Project Expo selected
}
```

#### payments
```javascript
{
  _id: ObjectId,
  registration_id: String,
  amount: Number,
  upi_id: String,
  payee_name: String,
  payment_status: String ('pending' | 'completed' | 'failed'),
  created_at: Date
}
```

#### team_members
```javascript
{
  _id: ObjectId,
  registration_id: String,
  member_name: String,
  member_branch: String,
  member_phone: String,
  is_team_leader: Boolean,
  member_order: Number
}
```

## 🎨 Frontend Routes

- **`/`** - Registration form (default page)
- **`/admin-scan`** - Admin QR scanner panel

## 🔐 Security Features

- ✅ Email validation to prevent duplicate registrations
- ✅ Admin password protection for entry verification
- ✅ Payment amount validation (must be > 0)
- ✅ Phone number validation (10 digits)
- ✅ Unique registration ID generation
- ✅ Secure file upload handling
- ✅ MongoDB unique indexes on email and registration_id

## 🎯 Events & Pricing

### Individual Events
- **Registration** - ₹100
- **Project Expo** - ₹150
- **Mini Canvas** - ₹150
- **Tech Game** - ₹50

### Combo Options
- **Combo 1: All Events** - ₹300
- **Combo 2: Registration + Mini Canvas + Tech Game** - ₹250

## 💳 Payment Details

- **UPI ID**: 8919068236@ybl
- **Payee Name**: PUNDRU MEGHAN REDDY
- **Payment Method**: Screenshot-based verification

## 📱 Admin Credentials

- **URL**: `http://localhost:5173/admin-scan`
- **Password**: `artix2026admin`

## 🎯 Project Expo Team Rules

- **Minimum**: 1 member (solo entry)
- **Maximum**: 3 members
- **Team Leader**: First member automatically marked as leader
- **Phone Validation**: Must be 10 digits

## 🛠️ Tech Stack

### Frontend
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Lucide Icons
- QRCode.js
- html5-qrcode (for QR scanning)

### Backend
- Node.js (Express.js 4.18.2)
- MongoDB (with MongoDB Driver 6.3.0)
- Multer (file uploads)
- CORS (cross-origin requests)
- dotenv (environment variables)
- QRCode (server-side generation)

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173
ADMIN_PASSWORD=artix2026admin
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment (Heroku/Railway/Render)
```bash
# Set environment variables in deployment platform
# Push code to deployment service
```

## 📊 Useful Admin Queries

### Get all registrations with stats
```javascript
// Use GET /api/admin/stats endpoint
```

### Find pending entries
```javascript
db.registrations.find({ entry_status: 'pending' }).pretty()
```

### Get total revenue
```javascript
db.registrations.aggregate([
  { $group: { _id: null, total: { $sum: '$total_amount' } } }
])
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify connection string in `.env`
- Ensure IP whitelist is configured in MongoDB Atlas
- Check network connectivity

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check VITE_API_URL in `.env.local`
- Ensure CORS is properly configured

### Payment Screenshot Not Uploading
- Verify `uploads/` directory exists
- Check file permissions
- Ensure file size is under 50MB limit

### QR Code Not Generating
- Verify QRCode library is installed
- Check for JavaScript errors in console
- Ensure registration data is valid

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify all environment variables are set

## 📄 License

ARTIX 2K26 - Event Registration System
Built for Malla Reddy Engineering College

---

**Version**: 1.0.0
**Last Updated**: March 1, 2026
**Status**: Production Ready
