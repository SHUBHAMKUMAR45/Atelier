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

The system follows a **Zero-Trust Persistence** and **Resilient Communication** model:

```
[FRONTEND] 3x Exponential Backoff Retry → [API] Zod Validation → [SERVICE] Read-after-Write Verify → [DB]
```

### Key Guarantees:
- **Zero-Trust Persistence**: Every DB write in the Profile service is verified with an immediate follow-up read to guarantee data integrity.
- **Standardized API Contract**: Every response follows the unified `{ success: boolean, data: T | null, error: string | null, traceId: string }` signature.
- **Fail-Safe AI**: Gemini → OpenAI → Local Cache → Degraded Response (circuit breakers per provider).
- **Atomic Quota**: MongoDB `findOneAndUpdate` with `$lt` guard prevents over-usage.
- **Input Sanitization**: Deep recursive sanitization prevents prototype pollution and XSS.

---

## API Reference

**Standard Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "traceId": "ae82..."
}
```

### Endpoints (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommend` | Generate outfit (AI) |
| GET | `/recommend/history` | Paginated history |
| POST | `/profile/setup` | Create/Verify user profile |
| GET | `/profile/me` | Current user profile |
| PATCH | `/profile/measurements` | Update body measurements |
| PATCH | `/profile/preferences` | Update style preferences |
| GET | `/wardrobe` | List wardrobe items |
| POST | `/wardrobe` | Add new item |
| GET | `/health` | Liveness & Readiness check |

---

## Testing & QA

```bash
# Unit & Integration Tests
npm run test

# Persistence Verification (Manual)
npm run test:persistence

# System Smoke Test (E2E)
# Requires running API with BYPASS_AUTH=true and NODE_ENV=development
npm run smoke-test
```
