# 🚀 RENDER DEPLOYMENT CHECKLIST

## Pre-Deployment (5 minutes)

- [ ] **Render Account**: Sign up at https://render.com
- [ ] **GitHub Connected**: Render has access to your GitHub account
- [ ] **MongoDB URI Ready**: Have your Atlas connection string
- [ ] **Frontend URL**: Know where your frontend will be deployed
- [ ] **Admin Credentials**: Have secure password & email

## Deployment Steps (10 minutes)

### Step 1: Create Web Service
- [ ] Log into Render dashboard
- [ ] Click "New Web Service"
- [ ] Select "Build and deploy from a Git repository"
- [ ] Connect and select: `Akash7653/ARTIX`

### Step 2: Configure Service
- [ ] Service Name: `artix-backend`
- [ ] Branch: `main`
- [ ] **Root Directory**: `artix-backend` ⚠️ IMPORTANT
- [ ] Runtime: `Node`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`

### Step 3: Set Environment Variables
Add these in the Environment section:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-frontend-url
ADMIN_PASSWORD=secure_password_here
ADMIN_EMAIL=admin@example.com
```

- [ ] MongoDB URI set and tested
- [ ] Frontend URL updated (can be localhost during testing)
- [ ] Admin credentials secure

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check logs for any errors
- [ ] Get deployment URL: `https://artix-backend.onrender.com`

## Post-Deployment (5 minutes)

### Step 5: Verify Backend
- [ ] Test health endpoint: `curl https://artix-backend.onrender.com/`
- [ ] Check logs in Render dashboard
- [ ] Test API endpoints if needed

### Step 6: Update Frontend
- [ ] Update `artix-frontend/src/lib/api.ts` with Render URL
- [ ] Commit and push changes
- [ ] Deploy frontend

### Step 7: Test Full Workflow
- [ ] Open frontend URL
- [ ] Register a test participant
- [ ] Verify Registration ID appears
- [ ] Check admin dashboard (if accessible)

## Environment Variables Guide

| Variable | Example | Notes |
|----------|---------|-------|
| PORT | 5000 | Render's default port |
| NODE_ENV | production | Use for Render |
| MONGODB_URI | `mongodb+srv://...` | From MongoDB Atlas |
| FRONTEND_URL | `https://artix.vercel.app` | Your deployed frontend |
| ADMIN_PASSWORD | `complex_password` | Min 8 characters |
| ADMIN_EMAIL | `admin@artix.com` | For admin login |

## Troubleshooting

### Build Fails
**Error**: "Cannot find module"  
**Fix**: Check "Root Directory" is `artix-backend`

### Service Won't Start  
**Error**: "Cannot GET /"  
**Fix**: Verify Start Command is `npm start`

### MongoDB Connection Error
**Error**: "MongoServerError: connect ECONNREFUSED"  
**Fix**: 
- Verify MongoDB URI in environment variables
- Check MongoDB Atlas → Network Access
- Add IP `0.0.0.0/0` for now (update later)

### CORS Errors in Frontend
**Error**: "Access to XMLHttpRequest blocked"  
**Fix**: Update `FRONTEND_URL` environment variable

## Deployed URLs After Completion

- **Backend**: https://artix-backend.onrender.com
- **Frontend**: (your-frontend-url)
- **Admin Dashboard**: https://artix-backend.onrender.com/admin

## Quick Links

- Render Dashboard: https://dashboard.render.com
- MongoDB Atlas: https://account.mongodb.com
- Documentation: https://render.com/docs
- Support: https://render.com/support

---

**Status**: ⏳ Ready to deploy  
**Time Estimate**: 20-30 minutes total  
**Difficulty**: ⭐ Easy
