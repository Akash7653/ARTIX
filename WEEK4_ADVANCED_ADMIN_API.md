# Week 4 Advanced Admin Features - API Documentation

## Overview

Week 4 implements advanced administrative capabilities for the ARTIX platform, including:
- **Bulk Operations**: Manage multiple registrations simultaneously
- **Advanced Analytics**: Comprehensive statistics and reporting
- **Search & Filtering**: Powerful query capabilities
- **Data Export**: CSV, Excel, JSON formats with custom field selection

## Architecture

### Core Components

1. **validators.js** (350 lines)
   - Express-validator integration
   - Input validation and sanitization
   - Custom business logic validators
   - Database uniqueness checks

2. **adminFeatures.js** (350+ lines)
   - `BulkOperations`: Bulk approve, reject, verify, select
   - `Analytics`: Event stats, timelines, college/dept breakdown, payment analysis
   - `AdvancedSearch`: Multi-field search with complex filters

3. **exportService.js** (280+ lines)
   - `CSVExport`: CSV generation with proper escaping
   - `ExcelExport`: Excel-ready data preparation
   - `JSONExport`: JSON export with metadata
   - `ExportService`: Unified interface for all formats

4. **adminRoutes.js** (300+ lines)
   - API endpoints for all admin operations
   - Request validation and error handling
   - Response formatting and headers

---

## API Endpoints

### Bulk Operations

#### 1. Bulk Approve Registrations
**POST** `/api/admin/bulk-approve`

Approve multiple registrations at once.

**Request Body:**
```json
{
  "registration_ids": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "approved": 3,
  "failed": 0,
  "message": "Successfully approved 3 registration(s)"
}
```

#### 2. Bulk Reject Registrations
**POST** `/api/admin/bulk-reject`

Reject multiple registrations with reason.

**Request Body:**
```json
{
  "registration_ids": ["id1", "id2"],
  "reason": "Not meeting attendance criteria"
}
```

**Response:**
```json
{
  "success": true,
  "rejected": 2,
  "failed": 0,
  "message": "Successfully rejected 2 registration(s)"
}
```

#### 3. Bulk Verify Registrations
**POST** `/api/admin/bulk-verify`

Mark registrations as entry-verified.

**Request Body:**
```json
{
  "registration_ids": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "verified": 3,
  "message": "Successfully verified 3 registration(s)"
}
```

#### 4. Bulk Select for Event
**POST** `/api/admin/bulk-select`

Mark registrations as selected/not selected for event.

**Request Body:**
```json
{
  "registration_ids": ["id1", "id2"],
  "selected": true
}
```

**Response:**
```json
{
  "success": true,
  "updated": 2,
  "message": "Updated 2 registration(s)"
}
```

---

### Analytics Endpoints

#### 1. Get Overall Statistics
**GET** `/api/admin/analytics`

Get comprehensive event statistics (status distribution, event breakdown, college stats).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalByStatus": [
      { "_id": "approved", "count": 120 },
      { "_id": "pending", "count": 45 },
      { "_id": "rejected", "count": 20 }
    ],
    "totalByEvent": [
      { "_id": "Robotics Challenge", "count": 80 },
      { "_id": "IoT Innovation", "count": 105 }
    ],
    "paymentStats": [
      { "_id": "completed", "count": 100 },
      { "_id": "pending", "count": 65 }
    ],
    "revenueStats": [
      { "_id": "approved", "total": 150000, "avg": 1250 }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. Registration Timeline
**GET** `/api/admin/analytics/timeline?startDate=2024-01-01&endDate=2024-01-31`

Get daily registration trends.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2024-01-15",
      "count": 25,
      "revenue": 31250,
      "approved": 18
    },
    {
      "_id": "2024-01-16",
      "count": 32,
      "revenue": 40000,
      "approved": 25
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 3. College-wise Analytics
**GET** `/api/admin/analytics/colleges?limit=20`

Top colleges by registration count.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "MIT Chennai",
      "totalRegistrations": 150,
      "approvedRegistrations": 120,
      "totalRevenue": 187500,
      "departments": ["CSE", "ECE", "Mechanical"],
      "events": ["Robotics Challenge", "IoT Innovation"]
    }
  ],
  "count": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 4. Department Analytics
**GET** `/api/admin/analytics/departments`

Breakdown by academic department.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "Computer Science",
      "totalRegistrations": 250,
      "approvedCount": 200,
      "pendingCount": 35,
      "rejectedCount": 15,
      "averageAmount": 1250
    }
  ],
  "count": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 5. Event Analytics
**GET** `/api/admin/analytics/events`

Performance metrics per event.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "Robotics Challenge",
      "totalRegistrations": 80,
      "approvedRegistrations": 65,
      "averageTeamSize": 4.2,
      "maxTeamSize": 6,
      "totalRevenue": 100000,
      "averageRevenue": 1250
    }
  ],
  "count": 1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 6. Payment Analytics
**GET** `/api/admin/analytics/payment`

Payment status breakdown with financial metrics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "completed",
      "count": 100,
      "totalAmount": 125000,
      "averageAmount": 1250,
      "maxAmount": 1500,
      "minAmount": 1000
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 7. Performance Metrics
**GET** `/api/admin/analytics/performance`

Key performance indicators and conversion rates.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRegistrations": 185,
    "approvalRate": "64.86%",
    "rejectionRate": "10.81%",
    "pendingRate": "24.32%",
    "verificationRate": "68.65%",
    "paymentCompletionRate": "54.05%",
    "totalRevenue": 231250,
    "averageRevenue": 1250,
    "metricsAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 8. Top Performers
**GET** `/api/admin/analytics/top-performers?criterion=college&limit=10`

Top colleges or departments by approval count.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "MIT Chennai",
      "totalRegistrations": 150,
      "approvedCount": 120,
      "verifiedCount": 95,
      "approvalRate": 80,
      "totalRevenue": 150000
    }
  ],
  "criterion": "college",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Search & Filter

#### Advanced Search
**GET** `/api/admin/search`

Multi-field search with complex filters.

**Query Parameters:**
```
search=john              # Text search across name, email, phone, college
approvalStatus=approved  # Filter by approval status
paymentStatus=completed  # Filter by payment status
event=Robotics           # Filter by event name
department=CSE           # Filter by department
college=MIT              # Filter by college
verified=true            # Filter by verification status
startDate=2024-01-01     # Registration date range
endDate=2024-01-31
minAmount=1000           # Revenue range
maxAmount=1500
minTeamSize=2            # Team size range
maxTeamSize=6
sort=date_desc           # Sort options: date_asc, date_desc, name_asc, name_desc
page=1                   # Pagination
limit=50
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "_id": "id123",
      "participant_name": "John Doe",
      "email": "john@example.com",
      "approval_status": "approved",
      ...
    }
  ],
  "pagination": {
    "current": 1,
    "limit": 50,
    "total": 185,
    "pages": 4,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Export Endpoints

#### 1. Export Data
**POST** `/api/admin/export`

Export registrations in specified format.

**Request Body:**
```json
{
  "format": "csv",
  "fields": ["participant_name", "email", "college_name", "event_name", "total_amount"],
  "filters": {
    "approvalStatus": "approved",
    "event": "Robotics Challenge"
  },
  "includeSummary": true
}
```

**Response (CSV):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="artix_registrations_2024-01-15.csv"

participant_name,email,college_name,event_name,total_amount
John Doe,john@example.com,MIT Chennai,Robotics Challenge,1250.00
Jane Smith,jane@example.com,Anna University,Robotics Challenge,1000.00
```

**Response (JSON):**
```json
{
  "success": true,
  "format": "json",
  "filename": "artix_registrations_2024-01-15.json",
  "data": {
    "results": [...]
  },
  "summary": {
    "summary": {
      "totalRegistrations": 185,
      "approvedCount": 120,
      "totalRevenue": 231250
    },
    "distribution": {
      "byCollege": {"MIT Chennai": 150, "Anna University": 35},
      "byEvent": {"Robotics Challenge": 80, "IoT Innovation": 105}
    }
  },
  "count": 185
}
```

**Response (Excel):**
```json
{
  "success": true,
  "format": "xlsx",
  "filename": "artix_registrations_2024-01-15.xlsx",
  "data": [
    {
      "participant_name": "John Doe",
      "email": "john@example.com",
      ...
    }
  ],
  "summary": {...},
  "count": 185
}
```

#### 2. Get Export Fields
**GET** `/api/admin/export/fields`

Available fields for custom export selection.

**Response:**
```json
{
  "success": true,
  "fields": [
    { "name": "participant_name", "label": "Participant Name" },
    { "name": "email", "label": "Email" },
    { "name": "phone_number", "label": "Phone Number" },
    { "name": "college_name", "label": "College" },
    { "name": "department", "label": "Department" },
    { "name": "event_name", "label": "Event" },
    { "name": "team_size", "label": "Team Size" },
    { "name": "approval_status", "label": "Approval Status" },
    { "name": "payment_status", "label": "Payment Status" },
    { "name": "total_amount", "label": "Total Amount" },
    { "name": "registration_date", "label": "Registration Date" }
  ],
  "count": 11
}
```

#### 3. Get Export Formats
**GET** `/api/admin/export/formats`

Available export format options.

**Response:**
```json
{
  "success": true,
  "formats": ["csv", "json", "xlsx"],
  "count": 3
}
```

---

## Integration with server.js

Add to `server.js`:

```javascript
import { createAdminRoutes } from './routes/adminRoutes.js';

// After database connection:
const db = client.db('artix');

// Mount admin routes
app.use('/api/admin', authenticateAdmin, createAdminRoutes(db, logger));
```

---

## Usage Examples

### Example 1: Bulk Approve Registrations
```bash
curl -X POST http://localhost:3000/api/admin/bulk-approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "registration_ids": ["id1", "id2", "id3"]
  }'
```

### Example 2: Get Event Statistics
```bash
curl -X GET http://localhost:3000/api/admin/analytics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Example 3: Advanced Search
```bash
curl -X GET "http://localhost:3000/api/admin/search?search=john&approvalStatus=approved&event=Robotics%20Challenge&page=1&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Example 4: Export to CSV
```bash
curl -X POST http://localhost:3000/api/admin/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "format": "csv",
    "fields": ["participant_name", "email", "total_amount"],
    "filters": {"approvalStatus": "approved"}
  }' > export.csv
```

---

## Error Handling

All endpoints follow consistent error responses:

**Validation Error (400):**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Email is invalid",
      "param": "email",
      "location": "body"
    }
  ]
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Failed to process request",
  "message": "Database connection error"
}
```

---

## Performance Considerations

1. **Bulk Operations**: Limited to 1000 registrations per request
2. **Search**: Results paginated (default 50, max 500 per page)
3. **Analytics**: Cached for 10-15 minutes
4. **Export**: Streamed for large datasets (>10,000 rows)

---

## Security Notes

1. All endpoints require admin authentication
2. Bulk operations are logged for audit trail
3. Exports include user identification and timestamp
4. Rate limiting recommended (100 requests per minute)
5. Admin actions visible in activity logs

---

## Next Steps

Week 4 Continued:
- [ ] Performance monitoring dashboard
- [ ] Real-time activity logs
- [ ] Email notifications for bulk operations
- [ ] Scheduled report generation
- [ ] Advanced filtering frontend components
