# Atelier — Production Deployment Guide

> Last updated: May 2026  
> Stack: Next.js 14 · Express · MongoDB Atlas · Vercel · Railway

---

## ⚠️ Before You Deploy: Rotate All Keys

If you received this repo as a zip, the `.env` files contain **placeholders only**.  
You must generate fresh credentials for every service before deploying.

| Service | Where to rotate | Env var |
|---------|----------------|---------|
| Clerk | dashboard.clerk.com → API Keys | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Clerk Webhook | dashboard.clerk.com → Webhooks | `CLERK_WEBHOOK_SECRET` |
| OpenAI | platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Google Gemini | aistudio.google.com/app/apikey | `GEMINI_API_KEY` |
| Replicate | replicate.com/account/api-tokens | `REPLICATE_API_TOKEN` |
| Cloudinary | console.cloudinary.com | `CLOUDINARY_API_SECRET` |
| Weather | openweathermap.org/api | `WEATHER_API_KEY` |
| Admin token | generate locally | `ADMIN_METRICS_TOKEN` |

Generate the admin token:
```bash
openssl rand -hex 32
```

---

## Architecture

```
Vercel (Next.js)  →  Railway (Express API)  →  MongoDB Atlas
                   ↘  Gemini / OpenAI / Replicate (AI)
                   ↘  Cloudinary (images)
                   ↘  OpenWeatherMap (weather)
```

---

## 1. Database — MongoDB Atlas

1. Create a free M0 cluster at cloud.mongodb.com
2. **Create a dedicated database user** — do NOT use the admin user
   - Go to: Database Access → Add New Database User
   - Role: `readWriteAnyDatabase` scoped to `ai-fashion-stylist`
   - Note the password
3. Whitelist Railway egress IPs (or allow all: `0.0.0.0/0` for initial setup)
   - Network Access → Add IP Address
4. Get connection string: Connect → Drivers → Node.js
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Atelier
   ```
5. Indexes are created automatically on first boot via `ensureIndexes()` in `db/connection.ts`

---

## 2. Backend — Railway

### Initial setup
1. Create a new project at railway.app
2. Connect your GitHub repo
3. Railway detects the `railway.json` → uses `apps/api/Dockerfile`

### Environment variables
Set all variables from `apps/api/.env.example` in Railway's Variables panel.

Key variables:
```
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_...
GEMINI_API_KEY=...
ALLOWED_ORIGINS=https://your-app.vercel.app
ADMIN_METRICS_TOKEN=<openssl rand -hex 32>
```

### Health check
Railway will ping `GET /health` every 30s.  
The endpoint returns `200 { status: "ok" }` when DB is connected.

### Custom domain (optional)
Settings → Networking → Add custom domain

---

## 3. Frontend — Vercel

### Initial setup
1. Import repo at vercel.com/new
2. Set **Root Directory** to `apps/web`
3. Framework preset: **Next.js**

### Environment variables
Set in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
```

The `@` references in `vercel.json` map to these variables automatically.

### Verify deployment
After first deploy:
- [ ] `/` loads the landing page
- [ ] `/sign-in` shows Clerk sign-in
- [ ] `/dashboard` redirects to sign-in when unauthenticated
- [ ] Network tab: API calls hit your Railway URL (not localhost)
- [ ] Browser console: no CSP violations

---

## 4. Clerk — Auth Setup

1. Go to dashboard.clerk.com → your app
2. Set allowed redirect URLs:
   - `https://your-app.vercel.app/dashboard`
   - `https://your-app.vercel.app/profile`
3. Configure webhook:
   - Endpoint: `https://your-api.railway.app/api/webhook/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret → set as `CLERK_WEBHOOK_SECRET`
4. For production: switch to **Live** keys (`pk_live_`, `sk_live_`)

---

## 5. Sentry — Error Monitoring

1. Create a project at sentry.io → Platform: Next.js
2. Copy DSN → set as `NEXT_PUBLIC_SENTRY_DSN` in Vercel
3. Errors only capture in production (`NODE_ENV=production`)
4. PII protection: all text masked in session replays by default

---

## 6. Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Fill in your local/dev values in both files

# 4. Start all services
pnpm dev

# Web:    http://localhost:3000
# API:    http://localhost:4000
# Mobile: pnpm --filter @ai-fashion/mobile start
```

---

## 7. Build Validation

Run this before every deployment:

```bash
pnpm install --frozen-lockfile
pnpm type-check      # 0 TypeScript errors required
pnpm lint            # 0 ESLint errors required
pnpm build           # Full production build
docker build -f apps/api/Dockerfile -t atelier-api .   # API container
```

---

## 8. Post-Deployment Checklist

- [ ] All 6 API keys are fresh (not from dev)
- [ ] `ADMIN_METRICS_TOKEN` is a random 32-byte hex string
- [ ] `ALLOWED_ORIGINS` includes your Vercel URL
- [ ] Clerk webhook is configured and verified
- [ ] Sentry DSN is set and receiving events
- [ ] MongoDB Atlas network access is restricted to Railway IPs
- [ ] `/health` endpoint returns `200` on Railway
- [ ] Vercel preview deployment passed
- [ ] CSP headers visible in browser DevTools → Network → Response Headers

---

## 9. Runbook — Common Issues

**API returns 401 on all routes**  
→ `CLERK_SECRET_KEY` mismatch between dev/prod keys. Check Railway env vars.

**Images not loading in production**  
→ Domain not in `next.config.ts` `remotePatterns`. Add and redeploy.

**Outfit generation never completes**  
→ Check Railway logs for circuit breaker state. Gemini or OpenAI key may be invalid.  
→ Circuit resets after 2 minutes automatically.

**MongoDB connection failures on boot**  
→ Check Atlas Network Access whitelist. Railway IPs may have changed.  
→ The API retries 5 times with exponential backoff before crashing.

**Rate limit errors (429)**  
→ Default: 5 outfits/day per user. Change `DAILY_QUOTA_LIMIT` in Railway env vars.
