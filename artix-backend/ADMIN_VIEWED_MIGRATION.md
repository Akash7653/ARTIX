# Admin Viewed Tracking - Migration Guide

This guide explains the new `admin_viewed` field that tracks which registrations have been reviewed by admins.

## Overview

- **New Field**: `admin_viewed` (boolean, default: `false`)
- **Purpose**: Track whether an admin has opened/reviewed a registration
- **Set to `true` when**:
  - Admin clicks "View" to expand registration details
  - Admin clicks "Approve" or "Reject"

## Migration Steps

### Option 1: Automatic (Recommended)
The `initDb.js` script now automatically adds `admin_viewed: false` to all existing registrations when run:

```bash
cd artix-backend
node initDb.js
```

### Option 2: Manual Migration
Run the dedicated migration script to mark all existing registrations as pending review:

```bash
cd artix-backend
node markExistingAsPending.js
```

This will:
- Find all registrations without the `admin_viewed` field
- Set `admin_viewed: false` for them
- Show you statistics about the update

### Option 3: Manual Database Query
Connect to MongoDB and run:

```javascript
db.registrations.updateMany(
  { admin_viewed: { $exists: false } },
  { $set: { admin_viewed: false } }
)
```

## Backend Changes

All registration endpoints now support tracking:

1. **GET `/api/admin/registration/:registrationId`**
   - When admin views registration details, automatically sets `admin_viewed: true`

2. **POST `/api/admin/registrations/:registrationId/approve`**
   - Sets `admin_viewed: true` when admin approves/rejects

3. **POST `/api/admin/generate-verification-id`**
   - Implicitly marks as viewed (called after approval)

## New Registrations

All new registrations created include `admin_viewed: false` by default.

## Status Indicators

- `admin_viewed: false` → Registration not yet reviewed by admin (NEW/PENDING REVIEW)
- `admin_viewed: true` → Admin has opened/reviewed this registration (VIEWED)

## Verification

To verify the migration worked:

```javascript
// Get count of unreviewed registrations
db.registrations.countDocuments({ admin_viewed: false })

// Get count of reviewed registrations
db.registrations.countDocuments({ admin_viewed: true })

// View all unreviewed registrations
db.registrations.find({ admin_viewed: false }).pretty()
```

## Notes

- Non-blocking: If marking a registration as viewed fails, the operation continues
- Historical: Existing registrations will be marked as `false`, allowing admins to see which are truly new
- Feature-complete: Frontend can now show "New" badges next to `admin_viewed: false` entries (future enhancement)
