# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account
- Google OAuth credentials
- AWS account (for S3 file storage)
- Stripe account (for payments)
- Vercel/Netlify account (for frontend)
- AWS/Render account (for backend)

## Environment Setup

### Backend Environment Variables

Create `server/.env`:

```env
NODE_ENV=production
PORT=5000
SERVER_URL=https://api.skyworld.com

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skyworld?retryWrites=true&w=majority

JWT_ACCESS_SECRET=your-super-secret-access-token-key
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://skyworld.com/auth/google/callback

FRONTEND_URL=https://skyworld.com

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=skyworld-uploads

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend Environment Variables

Create `client/.env.production`:

```env
VITE_API_URL=https://api.skyworld.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or use 0.0.0.0/0 for production)
5. Get connection string and add to `MONGODB_URI`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback` (development)
   - `https://skyworld.com/auth/google/callback` (production)
6. Copy Client ID and Secret to environment variables

## Backend Deployment (AWS/Render)

### Option 1: Render

1. Connect your GitHub repository
2. Create a new Web Service
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add environment variables
6. Deploy

### Option 2: AWS EC2

1. Launch EC2 instance (Ubuntu)
2. Install Node.js and PM2
3. Clone repository
4. Install dependencies: `cd server && npm install`
5. Set up PM2: `pm2 start server/index.js --name skyworld-api`
6. Set up Nginx reverse proxy
7. Configure SSL with Let's Encrypt

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.skyworld.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to client directory: `cd client`
3. Run: `vercel`
4. Follow prompts
5. Add environment variables in Vercel dashboard
6. Deploy

### Vercel Configuration

Create `client/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Database Indexes

Run these MongoDB commands to create indexes:

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

// Projects
db.projects.createIndex({ serviceRequestId: 1 }, { unique: true });
db.projects.createIndex({ clientId: 1 });
db.projects.createIndex({ developerIds: 1 });
db.projects.createIndex({ status: 1 });

// Service Requests
db.servicerequests.createIndex({ clientId: 1, status: 1 });
db.servicerequests.createIndex({ assignedDeveloperId: 1 });

// Payments
db.payments.createIndex({ clientId: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ transactionId: 1 }, { unique: true, sparse: true });

// Messages
db.messages.createIndex({ projectId: 1, createdAt: -1 });

// Audit Logs
db.auditlogs.createIndex({ userId: 1, timestamp: -1 });
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.skyworld.com
```

## Monitoring

### Application Monitoring

- Set up PM2 monitoring: `pm2 monit`
- Use PM2 web dashboard: `pm2 web`
- Configure log rotation

### Error Tracking

- Integrate Sentry for error tracking
- Set up alerts for critical errors

### Performance Monitoring

- Use New Relic or DataDog
- Monitor API response times
- Set up uptime monitoring (UptimeRobot, Pingdom)

## Backup Strategy

### Database Backups

MongoDB Atlas provides automatic backups. Configure:
- Daily snapshots
- Point-in-time recovery
- Retention period: 30 days

### File Backups

- S3 versioning enabled
- Cross-region replication
- Regular backup verification

## Security Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database access restricted
- [ ] API keys secured
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] DDoS protection enabled

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd server && npm install
      - run: cd server && npm test
      - name: Deploy to Render
        run: |
          # Add deployment commands
```

## Post-Deployment

1. Verify all endpoints are working
2. Test authentication flows
3. Check database connections
4. Verify file uploads
5. Test payment integration
6. Monitor error logs
7. Set up alerts

## Rollback Procedure

1. Revert to previous deployment
2. Restore database from backup if needed
3. Verify system functionality
4. Investigate issues
5. Fix and redeploy

