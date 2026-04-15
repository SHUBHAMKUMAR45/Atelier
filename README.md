# Atelier — AI Fashion Stylist

A production-grade AI styling system. Personalized outfit recommendations powered by Gemini, OpenAI, and Replicate.

---

## Stack

| Layer    | Tech |
|----------|------|
| Web      | Next.js 14 (App Router) → Vercel |
| Mobile   | Expo React Native |
| API      | Express + TypeScript → Render (Docker) |
| Database | MongoDB Atlas |
| Auth     | Clerk |
| Storage  | Cloudinary |
| AI       | Gemini → OpenAI (fallback) → Replicate (images) |

---

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+

git clone https://github.com/your-org/ai-fashion-stylist
cd ai-fashion-stylist

pnpm install

# Setup env
cp apps/api/.env.example apps/api/.env
# Fill in all values in apps/api/.env

# Start everything
pnpm dev
```

---

## Development

```bash
pnpm dev            # All apps in parallel (Turborepo)
pnpm build          # Production build
pnpm lint           # ESLint all packages
pnpm type-check     # TypeScript check all packages
pnpm test           # Run all tests
```

### Run just the API
```bash
cd apps/api
pnpm dev            # tsx watch mode with hot-reload
```

### Docker (API)
```bash
docker-compose up   # API + local MongoDB
```

---

## Architecture

```
Gemini → OpenAI → Cache → Degraded Response
         (circuit breaker per provider)
         (3x retry with exponential backoff)
         (in-flight request deduplication)
```

Key guarantees:
- **Never crashes** on AI failure — always returns valid degraded response
- **Atomic quota** — MongoDB `findOneAndUpdate` with `$lt` guard
- **userId-scoped** — every DB query filtered by authenticated user
- **Prompt injection defense** — all user input sanitized before LLM
- **Partial responses** — text returned immediately, images async

---

## Deployment

### API → Render
1. Connect repo in Render dashboard
2. Point to `render.yaml`
3. Set secrets in Render Environment panel
4. Push to `main` → auto-deploy triggers

### Web → Vercel
1. Import repo in Vercel dashboard
2. Set root dir to `apps/web`
3. Add env vars from `.env.example`
4. Push to `main` → auto-deploy triggers

### Required GitHub Secrets

| Secret | Where to get |
|--------|-------------|
| `RENDER_DEPLOY_HOOK_URL` | Render → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings |
| `MONGODB_URI_TEST` | MongoDB Atlas test cluster |
| `GEMINI_API_KEY` | Google AI Studio |
| `OPENAI_API_KEY` | OpenAI Platform |
| `CLERK_SECRET_KEY` | Clerk Dashboard |
| `CODECOV_TOKEN` | Codecov.io |

---

## API Reference

```
Base URL: https://api.ai-fashion.app/api/v1

POST   /recommend                → Generate outfit
GET    /recommend/history        → Paginated history
GET    /recommend/:id            → Single outfit
DELETE /recommend/:id            → Delete
POST   /feedback/:id             → Like / dislike
GET    /feedback/saved           → Saved outfits
GET    /profile                  → Get profile
POST   /profile/setup            → Create/update
PATCH  /profile/measurements     → Update measurements
PATCH  /profile/preferences      → Update preferences
GET    /quota                    → Daily quota status
GET    /trends                   → Fashion trends
GET    /weather?lat=&lon=        → Weather context
GET    /health                   → Liveness check
```

---

## SLOs

| Metric | Target |
|--------|--------|
| P95 recommendation latency | < 10s |
| Cached response latency | < 500ms |
| Availability | ≥ 99% |
| Error rate | < 1% |
| Daily quota per user | 5 requests |
