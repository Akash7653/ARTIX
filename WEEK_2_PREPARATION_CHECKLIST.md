# 📋 WEEK 2 PREPARATION CHECKLIST

**Timeline**: Ready to start after Week 1 sign-off  
**Estimated Duration**: 5-7 commits, 2-3 hours implementation  
**Priority Level**: HIGH (All 4 tasks critical)

---

## 📌 WEEK 2 OVERVIEW

**Goal**: Improve observability, performance, documentation, and security  
**Focus Areas**: 
1. Logging & Monitoring
2. Database Performance
3. API Documentation
4. File Upload Security

---

## ✅ TASK 1: LOGGING SYSTEM

**Status**: 🔵 READY TO IMPLEMENT  
**Priority**: 🔴 CRITICAL

### What Will Be Done:
- [ ] Install `winston` logging package
- [ ] Create log directories (`logs/` in both frontend and backend)
- [ ] Set up file logging (error.log, combined.log)
- [ ] Add logging to critical operations:
  - [ ] Registration creation
  - [ ] Admin login attempts
  - [ ] WhatsApp sends (success/failure)
  - [ ] Errors (caught by try/catch)
- [ ] Display logs in admin dashboard
- [ ] Create log rotation (keep only 14 days)

### Implementation Files:
- **Backend**: `artix-backend/server.js` (add logger setup)
- **Backend**: Create `artix-backend/utils/logger.js` (new file)
- **New Directory**: `artix-backend/logs/`

### Expected Code:
```javascript
// Setup
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Usage
logger.info('User registered', { email, phone });
logger.error('WhatsApp send failed', { error, participant_id });
```

### Benefits:
- 🔍 Debug issues in production
- 📊 Monitor app health
- 🚨 Alert on critical errors
- 📈 Track registration trends

---

## ✅ TASK 2: DATABASE PAGINATION

**Status**: 🔵 READY TO IMPLEMENT  
**Priority**: 🔴 CRITICAL (Current issue: admin dashboard slow with 10k+ registrations)

### What Will Be Done:
- [ ] Add `skip` and `limit` parameters to registration queries
- [ ] Update `/api/admin/registrations` endpoint:
  - [ ] Accept `?page=1&limit=50` query parameters
  - [ ] Return pagination metadata (total, page, pages)
- [ ] Update `/api/admin/registrations/search` for search results
- [ ] Add sorting options (by date, name, approval status)
- [ ] Create database indexes on:
  - [ ] `email` (for search)
  - [ ] `approval_status` (for filtering)
  - [ ] `created_at` (for sorting)

### Implementation Files:
- **Backend**: `artix-backend/server.js` (update registration queries)
- **Frontend**: `artix-frontend/src/components/AdminDashboard.tsx` (pagination UI)

### Expected Response:
```javascript
{
  "registrations": [...],
  "total": 10234,
  "page": 1,
  "limit": 50,
  "pages": 205,
  "hasMore": true
}
```

### Benefits:
- ⚡ Admin dashboard loads in <1s (currently 5-10s)
- 📱 Better mobile experience
- 💾 Reduce memory usage
- 🔍 Efficient search on large datasets

---

## ✅ TASK 3: API DOCUMENTATION

**Status**: 🔵 READY TO IMPLEMENT  
**Priority**: 🟡 HIGH (Nice to have, helps integration)

### What Will Be Done:
- [ ] Install `swagger-jsdoc` & `swagger-ui-express`
- [ ] Create `/api-docs` endpoint
- [ ] Document all 20+ endpoints with:
  - [ ] Request body examples
  - [ ] Response examples
  - [ ] Error codes (401, 429, 500, etc.)
  - [ ] Required headers (Authorization for admin)
- [ ] Add API endpoint comments in code
- [ ] Create interactive Swagger UI explorer

### Implementation Files:
- **Backend**: `artix-backend/swagger.js` (new file - documentation config)
- **Backend**: `artix-backend/server.js` (import & mount swagger)

### Expected Output:
```
Running on: http://localhost:3001/api-docs
Shows interactive explorer with:
- All endpoints listed
- Try It Out button for each endpoint
- Auto-generated curl commands
- Response examples
```

### Benefits:
- 📚 Self-documenting API
- 🔧 Easy for frontend developers
- 🚀 Reduces support questions
- 🔒 Shows which endpoints need JWT

---

## ✅ TASK 4: FILE UPLOAD SECURITY

**Status**: 🟡 PARTIALLY DONE (5MB limit exists, need MIME validation)  
**Priority**: 🔴 CRITICAL

### What Will Be Done:
- [ ] Validate file MIME type (JPG/PNG only)
- [ ] Validate file extension (reject .exe, .bat, .cmd, etc.)
- [ ] Add virus/malware scanning (optional: ClamAV)
- [ ] Store files outside web root (security improvement)
- [ ] Rename files with UUID (prevent directory traversal)
- [ ] Add anti-spam limit (1 upload per 10 seconds)

### Implementation Files:
- **Backend**: `artix-backend/server.js` (update file upload handler)
- **Create**: `artix-backend/utils/fileValidator.js` (new)

### Expected Validation:
```javascript
// Block these
❌ backdoor.exe
❌ script.bat
❌ malware.cmd
❌ virus.js

// Allow these
✅ photo.jpg
✅ document.png
```

### Benefits:
- 🛡️ Prevent malware uploads
- 🔐 Secure file storage
- 🚨 Alert on suspicious uploads
- 📊 Bandwidth protection

---

## 🗓️ WEEK 2 IMPLEMENTATION ORDER

1. **Day 1 Morning**: Logging system (1 commit)
2. **Day 1 Afternoon**: Database pagination (1 commit)
3. **Day 2 Morning**: API documentation (1 commit)
4. **Day 2 Afternoon**: File upload security (1 commit)
5. **Day 2 Evening**: Testing & deployment commit (1 commit)

**Total Commits Expected**: 5-6  
**Total Files Modified**: 3-4  
**Total Files Created**: 2-3  
**New Lines of Code**: 800-1000+

---

## 🔧 TECHNICAL DEPENDENCIES

### Packages to Install:
```bash
npm install winston              # Logging
npm install multer              # File uploads (ready)
npm install uuid                # Unique file names
npm install file-type           # MIME validation
```

### Already Installed (Ready):
- jsonwebtoken ✅
- express-validator ✅
- helmet ✅
- bcryptjs ✅

---

## 🚀 PRE-WEEK-2 CHECKLIST

Before starting Week 2, verify:
- [ ] All Week 1 commits pushed to GitHub
- [ ] Backend running without errors
- [ ] Frontend showing validation errors correctly
- [ ] Rate limiting working (test with rapid requests)
- [ ] ErrorBoundary tested (intentionally trigger error)
- [ ] JWT login endpoint working (get token, use it)

---

## 📊 WEEK 2 SUCCESS METRICS

After completion, should have:
- ✅ Structured logs in `artix-backend/logs/` directory
- ✅ Admin dashboard pagination UI with "Page 1 of 205" indicator
- ✅ `/api-docs` endpoint with Swagger UI explorer
- ✅ File upload validation preventing malware
- ✅ All endpoints documented in Swagger
- ✅ Admin API calls using JWT tokens

---

## 💡 QUICK REFERENCE

**Logging**: Winston → logs/ directory → 14-day rotation  
**Pagination**: skip/limit → metadata response → admin UI  
**Docs**: Swagger UI → `/api-docs` → interactive explorer  
**File Security**: MIME validation → UUID rename → antispam rate limit  

---

## 🎯 WEEK 3 PREVIEW (Teaser)

After Week 2 is done:
- Caching optimization (Redis)
- Admin pagination UI implementation
- Performance monitoring
- Accessibility improvements (WCAG)

---

**Status**: ✅ READY FOR WEEK 2  
**Next Action**: User confirmation to begin Week 2 implementation
