# ARTIX Backend Deployment Guide - Render

This guide will help you deploy the ARTIX 2K26 backend to Render in just a few steps.

## Prerequisites

1. **Render Account**: Create free account at [https://render.com](https://render.com)
2. **GitHub Repository**: Your ARTIX code is already pushed to GitHub
3. **MongoDB Atlas Connection**: Have your MongoDB connection string ready
4. **Environment Variables**: Gather all required credentials

## Step 1: Create Render Account & Connect GitHub

1. Go to [https://render.com](https://render.com) and sign up
2. Click **"New Web Service"** on the dashboard
3. Select **"Build and deploy from a Git repository"**
4. Click **"Connect GitHub"** and authorize Render to access your GitHub account
5. Find and select the repository: **`Akash7653/ARTIX`**
6. Click **"Connect"**

## Step 2: Configure the Web Service

**Service Configuration:**

| Field | Value |
|-------|-------|
| **Name** | `artix-backend` |
| **Branch** | `main` |
| **Root Directory** | `artix-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### Example Configuration:
```
Service Name:     artix-backend
Branch:           main
Root Directory:   artix-backend (critical!)
Runtime:          Node
Build Command:    npm install
Start Command:    npm start
```

## Step 3: Add Environment Variables

On the Render dashboard, scroll down to **"Environment"** section and add these variables:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=<your_mongodb_atlas_connection_string>
FRONTEND_URL=https://your-deployed-frontend-url
ADMIN_PASSWORD=<secure_password>
ADMIN_EMAIL=<admin_email>
```

### Getting MongoDB Atlas Connection String:

1. Go to [MongoDB Atlas](https://account.mongodb.com/account/login)
2. Click **"Overview"** → **"Connect"**
3. Select **"Connect your application"**
4. Choose **"Node.js"** driver
5. Copy the connection string
6. Replace `<password>` and database name as needed
7. Format: `mongodb+srv://username:password@cluster.mongodb.net/artix_2026?retryWrites=true&w=majority`

### FRONTEND_URL:
- If frontend is on Vercel: `https://your-frontend.vercel.app`
- If frontend is on Render: `https://your-frontend.onrender.com`
- Update after deploying frontend

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Build the application
   - Install dependencies
   - Start the server
3. Deployment takes 3-5 minutes
4. Once complete, you'll get a URL like: `https://artix-backend.onrender.com`

## Step 5: Test the Backend

Once deployed, test these endpoints:

```bash
# Health Check
curl https://artix-2yda.onrender.com/

# Register Participant
curl -X POST https://artix-2yda.onrender.com/api/register \
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
    "selectedEvents": ["event1"],
    "transactionId": "TXN123",
    "utrId": "UTR123"
  }'
```

## Step 6: Update Frontend with Backend URL

After backend is deployed, update the frontend:

1. In `artix-frontend/src/lib/api.ts`, the API URL is now configured:
```typescript
const API_BASE_URL = 'https://artix-2yda.onrender.com/api';
```

✅ **Already updated!**

2. Commit and push to GitHub
3. Your frontend deployment will auto-rebuild

## Important Notes

### Environment Variables in Production
- **NEVER** commit `.env` file to GitHub
- Always use `.env.example` as template
- Set environment variables in Render dashboard only
- Render automatically loads from "Environment" section

### MongoDB Connection
- Ensure MongoDB Atlas allows connections from Render
- Go to MongoDB Atlas → Network Access
- Add IP `0.0.0.0/0` (Allow from anywhere)
  - Better: Add Render's IP space once deployment is active

### File Uploads
- Render has ephemeral storage (files deleted on redeploy)
- For persistent uploads, consider:
  - AWS S3
  - Google Cloud Storage
  - Cloudinary
- Or move uploads to database as base64

### Common Issues

**Issue: Build fails with "cannot find module"**
- Solution: Ensure `Root Directory` is set to `artix-backend`

**Issue: "Cannot GET /"**
- Solution: Add health check route or check start command

**Issue: MongoDB connection fails**
- Solution: Verify connection string in environment variables
- Check MongoDB Atlas network access settings

**Issue: CORS errors**
- Solution: Update `FRONTEND_URL` environment variable with correct domain

## Monitoring & Logs

1. Go to your service on Render dashboard
2. Click **"Logs"** tab to see real-time logs
3. Errors will show here immediately

## URL Structure

After deployment:
- **Backend**: `https://artix-backend.onrender.com`
- **API Endpoints**:
  - Register: `POST https://artix-backend.onrender.com/api/register`
  - Get Registration: `GET https://artix-backend.onrender.com/api/registration/:id`
  - Verify Entry: `POST https://artix-backend.onrender.com/api/registrations/:id/verify`
  - Update Payment: `POST https://artix-backend.onrender.com/api/registrations/:id/payment`

## Next Steps

1. ✅ Deploy backend to Render
2. ⏭️ Update frontend API URL
3. ⏭️ Deploy frontend (Vercel or Render)
4. ⏭️ Test full workflow
5. ⏭️ Set up custom domain (optional)

## Support

For Render support: [https://render.com/docs](https://render.com/docs)

---

**Deployed Backend URL**: [Will be shown after deployment] 🚀
