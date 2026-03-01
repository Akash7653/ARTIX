# ARTIX 2K26 - Setup & Deployment Guide

## 🚀 Development Environment Setup

### Step 1: Clone/Setup Project Structure

```bash
# Your project structure should look like:
ARTIX/
├── artix-frontend/
├── artix-backend/
└── README.md
```

### Step 2: Backend Configuration

```bash
# 1. Navigate to backend
cd artix-backend

# 2. Install dependencies
npm install

# 3. Verify .env file exists with:
cat .env

# Output should show:
# PORT=5000
# NODE_ENV=development
# MONGODB_URI=mongodb+srv://....
# FRONTEND_URL=http://localhost:5173
# ADMIN_PASSWORD=artix2026admin

# 4. Start backend
npm start

# Expected output:
# ✅ Connected to MongoDB
# 🚀 ARTIX Server running on http://localhost:5000
```

### Step 3: Frontend Configuration

```bash
# 1. Navigate to frontend
cd artix-frontend

# 2. Install dependencies
npm install

# 3. Verify .env.local exists with:
cat .env.local

# Output should show:
# VITE_API_URL=http://localhost:5000/api

# 4. Start frontend dev server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

### Step 4: Verify Setup

1. Open browser and go to `http://localhost:5173`
2. Fill in the registration form
3. Select events and upload a payment screenshot
4. Submit the form
5. Verify registration ID and QR code are generated
6. Visit `http://localhost:5173/admin-scan` to test the scanner

---

## 📦 MongoDB Atlas Setup (If Not Already Done)

### 1. Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create account
3. Create a new project: "ARTIX 2026"
4. Create a cluster (free tier M0 is fine for testing)
5. Choose region close to your deployment location

### 2. Database Setup

1. In MongoDB Atlas, navigate to "Collections"
2. Create database: `artix_2026`
3. The collections will be created automatically when the backend runs

### 3. User & Connection

1. Create a database user:
   - Username: `thrinadhgujjarlapudi_db_user`
   - Password: `LsviEx9Ws6LkZ6b4`
2. Under "Network Access", add IP: `0.0.0.0/0` (for development)
3. Copy connection string and update `.env` if needed

### 4. Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?appName=IOT-DataBase
```

Replace:
- `USERNAME` with your database user
- `PASSWORD` with your database password
- `CLUSTER` with your cluster name

---

## 🌐 Production Deployment

### Option 1: Vercel (Frontend)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Navigate to frontend directory
cd artix-frontend

# 4. Deploy
vercel

# 5. Set environment variables in Vercel dashboard
# Go to Settings > Environment Variables
# Add:
# VITE_API_URL=https://your-backend-url/api
```

### Option 2: Railway (Backend + Frontend)

```bash
# 1. Go to https://railway.app
# 2. Connect your GitHub repository
# 3. Add environment variables:
#    - PORT=5000
#    - MONGODB_URI=your_connection_string
#    - FRONTEND_URL=your_frontend_url
#    - NODE_ENV=production
#    - ADMIN_PASSWORD=your_secure_password

# 4. Deploy
# Railway will automatically build and deploy
```

### Option 3: Docker Deployment

#### Backend Dockerfile

Create `artix-backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./artix-backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=your_mongodb_uri
      - FRONTEND_URL=http://localhost:5173
      - ADMIN_PASSWORD=artix2026admin
    volumes:
      - ./artix-backend/uploads:/app/uploads

  frontend:
    build: ./artix-frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    depends_on:
      - backend
```

Build and run:
```bash
docker-compose up --build
```

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Registration form validates required fields
- [ ] Event selection toggles correctly
- [ ] Combo selection disables individual events
- [ ] Team members form shows with Project Expo
- [ ] Payment QR code generates
- [ ] Payment screenshot upload works
- [ ] Registration ID displays after submission
- [ ] Entry QR code is downloadable
- [ ] Mobile responsive design works

### Backend Tests
- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] POST /api/register endpoint works
- [ ] Duplicate email prevention works
- [ ] QR code file upload succeeds
- [ ] POST /api/verify-qr works
- [ ] POST /api/admin/approve-entry works with password
- [ ] GET /api/admin/stats returns correct data
- [ ] Payment records created in database

### Admin Scanner Tests
- [ ] Admin login requires password
- [ ] QR scanner loads and functions
- [ ] Scanned QR displays registration details
- [ ] Approve entry changes status
- [ ] Duplicate entry shows warning
- [ ] Mobile camera access works

### Database Tests
```bash
# Connect to MongoDB
mongo "your_connection_string"

# Check collections
db.registrations.find().pretty()
db.payments.find().pretty()
db.team_members.find().pretty()

# Verify indexes
db.registrations.getIndexes()
```

---

## 🔄 CI/CD Pipeline Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy ARTIX

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies (Backend)
        run: |
          cd artix-backend
          npm install
      
      - name: Install dependencies (Frontend)
        run: |
          cd artix-frontend
          npm install
      
      - name: Run frontend build
        run: |
          cd artix-frontend
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Frontend)
        run: |
          cd artix-frontend
          npm install -g vercel
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Performance Optimization

### Frontend
```bash
# Check bundle size
npm run build
# Output will show bundle analysis

# Optimize images
# Use WebP format where possible
# Lazy load images
```

### Backend
```javascript
// Add request logging
import morgan from 'morgan';
app.use(morgan('combined'));

// Add compression
import compression from 'compression';
app.use(compression());

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### MongoDB
```javascript
// Create indexes for better query performance
db.registrations.createIndex({ email: 1 });
db.registrations.createIndex({ registration_id: 1 });
db.registrations.createIndex({ entry_status: 1 });
```

---

## 🔒 Security Best Practices

### For Production

1. **HTTPS Only**
   - Use SSL/TLS certificates
   - Redirect HTTP to HTTPS

2. **Environment Variables**
   - Never commit `.env` files
   - Use secure secret management (AWS Secrets Manager, Azure Key Vault)

3. **MongoDB Security**
   - Use strong passwords
   - Restrict IP access
   - Enable encryption at rest
   - Regular backups

4. **API Security**
   - Implement rate limiting
   - Use CORS properly
   - Validate all inputs
   - Sanitize file uploads

5. **Admin Panel**
   - Use strong passwords
   - Consider 2FA for admin access
   - Log all admin activities

### Update .env for Production

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_secure_mongodb_uri
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_PASSWORD=very_strong_random_password_here
```

---

## 📈 Monitoring & Logging

### Add Error Tracking (Sentry)

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

### Monitor MongoDB Performance

```javascript
// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 });

// Check slow queries
db.system.profile.find({ millis: { $gt: 100 } }).pretty()
```

---

## 🆘 Troubleshooting Production Issues

### Backend won't start
```bash
# Check Node version
node --version

# Check MongoDB connection
npm test

# View logs
tail -f logs/server.log
```

### Slow registration submissions
```bash
# Check MongoDB indexes
db.registrations.stats().indexSizes

# Monitor queries
db.currentOp()
```

### High memory usage
```bash
# Restart backend
# Check for memory leaks
# Monitor node process
node --inspect server.js
```

---

## 📞 Support Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Last Updated**: March 1, 2026
