# AI Fashion Stylist — Production Operations Runbook

## Architecture Overview

```
Client (Web/Mobile)
    │
    ▼
Express API (Port 4000)
    ├─ Auth:        Clerk JWT → RBAC (user/moderator/admin)
    ├─ Security:    Helmet + CORS + XSS sanitizer + prompt injection guard
    ├─ Rate limits: 100 RPM global, 10 RPM per-user on AI routes
    ├─ Validation:  Zod schemas on all inputs
    ├─ Responses:   RFC 7807 errors + success wrapper
    │
    ├─ AI Orchestrator (packages/ai-core)
    │   ├─ Gemini 1.5 Flash (primary)
    │   ├─ OpenAI GPT-4o Mini (fallback)
    │   ├─ Circuit breakers (5 failures → 2 min cooldown)
    │   ├─ Anti-hallucination (Zod schema validation on all AI output)
    │   └─ Degraded static response (last resort)
    │
    ├─ MongoDB (Atlas)
    │   ├─ users            — profiles + daily quota
    │   ├─ recommendations  — TTL 30d, auto-expire via index
    │   ├─ ai_cache         — outfit/trend/weather cache
    │   └─ feedback         — analytics
    │
    ├─ Redis (BullMQ queues)
    │   ├─ image-generation — concurrency 3, 3 retries, exponential backoff
    │   │   └─ Idempotent: jobId = img:{requestHash}
    │   ├─ data-lifecycle   — cleanup every 6h (idempotent: date-scoped jobId)
    │   └─ ai-retry         — 5 retries for failed AI calls
    │
    └─ Prometheus /metrics → Grafana dashboards + alerting
```

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | Atlas connection string |
| `REDIS_URL` | ⚠ optional | `redis://localhost:6379` | Graceful degradation if absent |
| `CLERK_SECRET_KEY` | ✅ | — | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | ✅ | — | |
| `GEMINI_API_KEY` | ✅ | — | |
| `OPENAI_API_KEY` | ✅ | — | Fallback AI |
| `REPLICATE_API_TOKEN` | ✅ | — | Image generation |
| `CLOUDINARY_*` | ✅ | — | Image storage |
| `WEATHER_API_KEY` | ✅ | — | OpenWeatherMap |
| `ADMIN_METRICS_TOKEN` | ⚠ prod only | — | Protects /metrics |
| `DAILY_QUOTA_LIMIT` | ❌ | `5` | |
| `GLOBAL_RATE_LIMIT_RPM` | ❌ | `100` | |

## Running Locally

```bash
# 1. Start infrastructure
docker-compose up mongo redis -d

# 2. Install deps
pnpm install

# 3. Copy env
cp apps/api/.env.example apps/api/.env
# Fill in real API keys

# 4. Dev server
pnpm --filter @ai-fashion/api dev

# 5. Optional observability stack
docker-compose --profile observability up prometheus grafana -d
# → Prometheus: http://localhost:9090
# → Grafana:    http://localhost:3001  (admin/admin)
```

## CI/CD Pipeline

```
push → install → lint + type-check + dep-audit (parallel)
                      ↓
         unit + integration + security + ai-validation (parallel)
                      ↓
              production build + Docker (ghcr.io)
                      ↓
         load test gate (≥95 score) + delivery checklist
                      ↓ (main branch only)
                 deploy → Render
```

## Monitoring Alerts

| Alert | Threshold | Severity |
|---|---|---|
| HighErrorRate | >5% 5xx over 5m | critical |
| HighP99Latency | >3s P99 over 3m | warning |
| QueueDepthHigh | >100 waiting | warning |
| CircuitBreakerOpen | state=2 for 1m | critical |
| HallucinationRejectionSpike | >0.1/s over 2m | warning |
| QuotaExhaustion | >50/h | info |

## Failure Scenarios & Responses

### Redis down
- Queue workers auto-disable
- Image generation falls back to `setImmediate` in same process
- Health endpoint reports `redis: "unavailable"` 
- All other API functionality unaffected

### Gemini down
- Circuit breaker trips after 5 failures (120s cooldown)
- Requests automatically route to OpenAI fallback
- `aiProvider: "openai"` in response

### Both AI providers down
- Returns stale cached response if available
- Returns deterministic degraded static response as last resort
- `confidenceScore: 0.5` signals degraded mode

### MongoDB down
- Returns 503 from health check
- All reads/writes fail with 500
- Circuit breaker on load balancer should route away

## Data Lifecycle

- Recommendations: MongoDB TTL index at `expiresAt` (30 days)
- Failed image jobs: deleted after 7 days via lifecycle worker
- Stuck `generating` status: reset to `failed` after 1h (worker crash recovery)
- AI cache: TTL index — outfit 6h, trends 24h, weather 30m
- Zero-hit stale cache entries: cleaned every 6h

## Security Controls

| Layer | Control |
|---|---|
| Transport | HSTS, helmet, CSP |
| Auth | Clerk JWT verification on every protected route |
| RBAC | user/moderator/admin roles from Clerk publicMetadata |
| Input | XSS strip, prompt injection neutralization, MongoDB operator strip |
| Rate limiting | 100 RPM global, 10 RPM AI per-user |
| Body size | 100kb limit |
| AI output | Zod schema validation → reject hallucinated structures |
| Data isolation | All DB queries scoped to `userId` |
| Prototype pollution | `__proto__`, `constructor`, `prototype` keys stripped |

## Key Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /health | none | Returns redis+queue status |
| GET | /metrics | admin token | Prometheus format |
| POST | /api/v1/recommend | user | Quota-gated, idempotent |
| GET | /api/v1/recommend/history | user | Paginated |
| GET | /api/v1/recommend/saved | user | Liked outfits |
| GET | /api/v1/recommend/:id | user | Single recommendation |
| DELETE | /api/v1/recommend/:id | user | |
| GET/POST/PATCH | /api/v1/profile | user | Profile CRUD |
| POST | /api/v1/feedback/:id | user | like/dislike |
| GET | /api/v1/weather | user | |
| GET | /api/v1/trends | user | |
