# ProLink

Nigerian freelancing marketplace — escrow-based platform connecting clients with verified freelance service providers. Analogous to Upwork/Fiverr, tailored for the Nigerian market (NGN/Naira, NIN/CAC verification, Paystack payments).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (React 19, TypeScript, Tailwind CSS 4) |
| Backend | Express 5 (Node.js 20+) |
| Database | PostgreSQL via Prisma ORM 7.8 |
| Real-time | Socket.IO 4.8 |
| Payments | Paystack (escrow-based) |
| Auth | JWT (httpOnly cookies + localStorage fallback) + bcrypt |
| AI | Google Gemini 2.5 Flash |
| Push | ntfy.sh (backend), Expo Notifications (mobile) |
| Deployment | Vercel (frontend + backend serverless) |

## Project Structure

```
prolink-backend/     Express API server
  src/
    controllers/     20 controllers (thin, delegate to services)
    services/        13 services (business logic)
    routes/          22 route modules
    middleware/       Auth, validation, rate limiting, error handling
    socket/          Socket.IO event handlers
    config/          Prisma client, logger, Redis adapter
    cron/            Scheduled jobs (deadline reminders, auto-release)
    utils/           Response helpers, trust metrics, cache utilities
  prisma/schema.prisma   22 database models

prolink-frontend/    Next.js web application
  src/
    app/             App Router pages (route groups: auth, client, provider, admin)
    components/      Reusable React components
    context/         UserContext (global auth state)
    hooks/           Custom hooks (useAuth, useMessages)
    lib/             API client (Axios), Socket.IO, config, utilities
    types/           TypeScript interfaces
    middleware.ts     Edge middleware (security headers, bot blocking)

prolink-mobile/      React Native (Expo) mobile app
  app/               Expo Router screens
  components/        Reusable RN components
  lib/               API client, Socket.IO, SecureStore
```

## Development

```bash
# Backend
cd prolink-backend
npm install
npx prisma generate
npm run dev          # Starts on port 5000

# Frontend
cd prolink-frontend
npm install
npm run dev          # Starts on port 3000 (Turbopack)

# Mobile
cd prolink-mobile
npm install
npx expo start       # Opens Expo dev tools
```

## API Conventions

- Base URL: `/api/`
- Auth: `Authorization: Bearer <token>` header or httpOnly `token` cookie
- Errors: `{ error: "message" }` format
- Success: bare JSON with data
- Pagination: cursor-based for messages, offset-based for listings
- Rate limiting: applied per endpoint group (login, register, search, general)

## Key Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | public | Register (3-step: details, password, referral) |
| POST | /api/auth/login | public | Login (returns JWT) |
| GET | /api/profiles/me | auth | Current user profile |
| GET/POST | /api/jobs | optional/auth | Browse or create jobs |
| POST | /api/jobs/:id/bids | auth+provider | Submit bid |
| POST | /api/chats | auth | Initiate chat thread |
| POST | /api/payments/initialize | auth+client | Start Paystack checkout |
| POST | /api/payments/webhook | public | Paystack webhook |

## Database

22 Prisma models. Key relationships:
- User 1:1 Profile 1:1 BankAccount
- User 1:N Job 1:1 JobAssignment
- Job 1:N Bid, Job 1:N Milestone
- Milestone 1:N Dispute
- User 1:N ChatThread 1:N Message
- Profile N:N Skill (through ProfileSkill)

## Deployment

- **CI/CD**: GitHub Actions pipeline (`.github/workflows/pipeline.yml`)
  - Quality checks → Staging (develop branch) → Production (main branch)
- **Frontend**: Vercel (auto-deployed from repo)
- **Backend**: Vercel serverless (migrated from Render)
- **Database**: PostgreSQL (managed, connection via DATABASE_URL env var)

## Environment Variables

See `prolink-backend/.env.example` and `prolink-frontend/.env.example` for full lists. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Token signing secret
- `PAYSTACK_SECRET_KEY` — Paystack API key
- `NEXT_PUBLIC_API_BASE_URL` — Backend API URL for frontend
- `CLOUDINARY_*` — File upload storage
