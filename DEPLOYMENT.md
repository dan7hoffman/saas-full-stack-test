# Deployment Guide

## Quick Start: Deploy to Railway (Recommended for MVP)

### Prerequisites
- GitHub account
- Railway account (sign up at railway.app)
- Domain name (optional, Railway provides subdomain)

---

## Step 1: Prepare Your Repository

1. **Commit and push all changes to GitHub**
   ```bash
   git add .
   git commit -m "feat: Prepare for production deployment"
   git push origin main
   ```

2. **Create production environment file**
   - Copy `.env.example` to `.env.production`
   - Update with production values (Railway will override these)

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `saas-full-stack-test` repository
5. Railway will auto-detect Node.js

### 2.2 Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically creates and links the database
4. Connection string is available at `${{Postgres.DATABASE_URL}}`

### 2.3 Add Redis (Optional)

1. Click "+ New" → "Database" → "Redis"
2. Connection string: `${{Redis.REDIS_URL}}`

### 2.4 Configure Backend Environment Variables

In Railway backend service → Variables tab:

```bash
# Automatically provided by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PORT=${{PORT}}

# You need to set these (generate secure values)
NODE_ENV=production
SESSION_SECRET=<generate-32-char-random-string>
CSRF_SECRET=<generate-32-char-random-string>

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-app.vercel.app

# Email configuration (use Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=<your-resend-api-key>
SMTP_FROM=Your App <noreply@yourdomain.com>

# Optional settings
REQUIRE_EMAIL_VERIFICATION=true
SESSION_DURATION_DAYS=30
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

### 2.5 Configure Build Settings

Railway should auto-detect, but verify:

**Root Directory:** `backend`
**Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
**Start Command:** `npm start`

### 2.6 Deploy

1. Click "Deploy"
2. Railway will:
   - Install dependencies
   - Generate Prisma client
   - Run migrations
   - Build TypeScript
   - Start server

3. Get your backend URL: `https://your-app.up.railway.app`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Configure Production API URL

Edit `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend.up.railway.app', // Your Railway backend URL
};
```

Commit this change:
```bash
git add frontend/src/environments/environment.prod.ts
git commit -m "feat: Configure production API URL"
git push origin main
```

### 3.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Angular
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build:prod`
   - **Output Directory:** `dist/frontend/browser`

5. Click "Deploy"

### 3.3 Update Backend CORS

Go back to Railway backend → Variables:

Update `FRONTEND_URL` to your Vercel URL:
```bash
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy backend for CORS changes to take effect.

---

## Step 4: Configure Email Service (Resend)

### 4.1 Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month)
3. Verify your domain (or use their test domain for MVP)

### 4.2 Get API Key

1. Go to "API Keys" in Resend dashboard
2. Create new API key
3. Copy the key (starts with `re_`)

### 4.3 Update Railway Environment

Go to Railway backend → Variables:

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=Your App <noreply@yourdomain.com>
```

Redeploy backend.

---

## Step 5: Set Up Custom Domain (Optional)

### 5.1 Add Domain to Vercel (Frontend)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `app.yoursite.com`)
3. Configure DNS records as shown by Vercel

### 5.2 Add Domain to Railway (Backend)

1. Railway Project → Backend Service → Settings → Domains
2. Click "Generate Domain" or add custom domain (e.g., `api.yoursite.com`)
3. Configure DNS CNAME record

### 5.3 Update Environment Variables

**Railway Backend:**
```bash
FRONTEND_URL=https://app.yoursite.com
```

**Vercel Frontend:**
Edit `environment.prod.ts`:
```typescript
apiUrl: 'https://api.yoursite.com'
```

---

## Step 6: Test Production Deployment

### 6.1 Health Check
```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-10-27T..."
}
```

### 6.2 Test User Registration

1. Go to your frontend URL
2. Register a new user
3. Check email for verification link
4. Verify email and log in

### 6.3 Test Multi-Tenancy

1. Create an account and add financial data
2. Invite another user to your organization
3. Verify they can see shared data
4. Register a separate user (different org)
5. Verify they CANNOT see first org's data

---

## Alternative Deployment: Free Tier (Render + Neon + Vercel)

If you want to start with $0 cost:

### Backend: Render.com (Free)

1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Add environment variables (same as Railway above)

**Note:** Free tier sleeps after 15 minutes of inactivity. Cold starts take ~30 seconds.

### Database: Neon (Free)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to Render environment variables:
   ```bash
   DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/db?sslmode=require
   ```

### Redis: Upstash (Free)

1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection string
4. Add to Render:
   ```bash
   REDIS_URL=redis://default:pass@xyz.upstash.io:6379
   ```

### Frontend: Vercel (Free)

Same steps as above.

---

## Cost Comparison

| Option | Monthly Cost | Pros | Cons |
|--------|--------------|------|------|
| **Railway (Recommended)** | ~$10-15 | Always-on, fast, integrated, backups | Not free |
| **Render Free Tier** | $0 | Truly free | Cold starts, no Redis included |
| **Fly.io** | ~$5-7 | Fast, always-on, cheap | More complex setup |
| **Vercel + Supabase** | $0-25 | Great DX, generous free tier | Supabase limited to 500MB free |

---

## Security Checklist (Production)

Before going live:

- [ ] Generate secure `SESSION_SECRET` (32+ characters random)
- [ ] Generate secure `CSRF_SECRET` (32+ characters random)
- [ ] Set `NODE_ENV=production`
- [ ] Configure real SMTP service (not MailHog)
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Enable HTTPS (Railway/Vercel handle this automatically)
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Test tenant isolation (different orgs can't see each other's data)
- [ ] Set up monitoring (Railway/Render have built-in monitoring)
- [ ] Configure error tracking (optional: Sentry)
- [ ] Set up database backups (Railway does this automatically)

---

## Monitoring & Logs

### Railway
- Logs: Project → Service → Logs tab
- Metrics: Project → Service → Metrics tab
- Database: Project → Postgres → Metrics

### Vercel
- Logs: Project → Deployments → Click deployment → Logs
- Analytics: Project → Analytics tab

### Add Error Tracking (Optional)

**Sentry (Recommended)**
- Free tier: 5k errors/month
- Sign up at [sentry.io](https://sentry.io)
- Add to both frontend and backend

---

## Scaling Strategy

As your app grows:

| Users | Recommendation | Monthly Cost |
|-------|----------------|--------------|
| **0-100** | Railway starter or Render free | $0-15 |
| **100-1,000** | Railway Pro, add caching | $20-50 |
| **1,000-10,000** | Scale Railway, read replicas | $100-300 |
| **10,000+** | Migrate to AWS/GCP with orchestration | $500+ |

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify `DATABASE_URL` is set correctly
- Ensure migrations ran successfully

### CORS errors
- Verify `FRONTEND_URL` matches your Vercel domain exactly
- Check CORS middleware in `backend/src/index.ts`

### Database connection failed
- Verify connection string format
- Check if database service is running
- Ensure SSL is enabled for Neon: `?sslmode=require`

### Email not sending
- Verify SMTP credentials in Railway
- Check Resend dashboard for errors
- Test with Resend's test mode first

---

## Need Help?

- Railway Discord: [railway.app/discord](https://railway.app/discord)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- GitHub Issues: Open an issue in your repo

---

**You're ready to deploy!** 🚀

Start with Railway for the best developer experience, or go free with Render + Neon + Vercel.
