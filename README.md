# SkillQuest — Gamified Learning Platform

A full-stack web application that turns learning into a game. Earn XP, level up, unlock skill trees, complete daily challenges, and get AI-generated study materials — all in a polished dark/light UI.

---

## Features

| Feature | Description |
|---|---|
| **XP & Levels** | Earn experience points for every completed lesson. Multi-level-ups handled in a single award. |
| **Skill Trees** | Interactive SVG canvas with zoom/pan. Skills unlock as prerequisites are mastered. |
| **Achievements** | 60+ badges across common, rare, epic, and legendary tiers with XP bonuses. |
| **Leaderboards** | Global and weekly rankings; per-skill leaderboards for focused competition. |
| **Daily Challenges** | Auto-generated daily tasks with countdown timer and streak rewards. |
| **AI Handouts** | Type any topic → get structured notes + a 5-question MCQ quiz powered by GPT-4o-mini. |
| **Stripe Payments** | Premium tier via Stripe Checkout with webhook-driven subscription management. |
| **Dark / Light theme** | Full theme system via CSS custom properties; persisted per user. |
| **JWT Auth** | Access + refresh token rotation with automatic silent re-auth. |

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Framer Motion + GSAP (animations)
- Zustand (global state) · React Query (server state)
- Radix UI primitives · react-hot-toast

**Backend**
- Node.js · Express · Prisma ORM
- SQLite (local dev) / PostgreSQL (production)
- OpenAI API · Stripe SDK
- JWT (jsonwebtoken) · bcryptjs
- Helmet · express-rate-limit · express-validator

**Infrastructure**
- Frontend → Vercel
- Backend → Render
- Database → Supabase or Railway (PostgreSQL)

---

## Architecture

```
Browser (Next.js)
     │
     │  HTTPS + Bearer token
     ▼
Express API (Render)
     │              │
     ▼              ▼
Prisma ORM      OpenAI API
     │          Stripe API
     ▼
PostgreSQL (Supabase)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### 1. Clone the repo

```bash
git clone https://github.com/your-username/skillquest.git
cd skillquest
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in JWT secrets, optionally add OPENAI_API_KEY and Stripe keys
npm install
npm run db:migrate   # creates SQLite DB and runs migrations
npm run db:seed      # populates 10 skills, 50 lessons, 20 achievements
npm run dev          # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL is already set to http://localhost:5000/api
npm install
npm run dev          # starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and create an account.

---

## Project Structure

```
skillquest/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Data models
│   │   ├── migrations/            # SQL migration history
│   │   └── seed.js                # Sample data
│   └── src/
│       ├── controllers/           # Business logic
│       │   ├── authController.js
│       │   ├── generateController.js
│       │   └── progressController.js
│       ├── routes/                # Express routers (one per resource)
│       ├── services/
│       │   ├── xpService.js       # Gamification engine (XP, levels, achievements)
│       │   └── openaiService.js
│       ├── middleware/
│       │   └── auth.js            # JWT verification middleware
│       └── index.js               # App entry point
│
└── frontend/
    ├── app/                       # Next.js App Router pages
    │   ├── page.tsx               # Landing page
    │   ├── dashboard/
    │   ├── skills/
    │   ├── achievements/
    │   ├── leaderboard/
    │   ├── handouts/              # AI-generated study materials
    │   └── auth/
    ├── components/
    │   ├── skill-tree/SkillTree.tsx   # Interactive SVG canvas
    │   ├── ui/                        # XPBar, LevelUpModal, AchievementBadge
    │   ├── dashboard/                 # StatsCard, DailyChallengeCard
    │   └── layout/                    # Sidebar, MobileHeader
    ├── store/
    │   ├── userStore.ts           # Auth + XP state (Zustand + persist)
    │   └── themeStore.ts
    └── lib/
        └── api.ts                 # Axios client with token refresh interceptor
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register a new account |
| POST | `/api/auth/login` | — | Login, returns JWT pair |
| POST | `/api/auth/refresh` | — | Rotate access token |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/skills` | — | List all skills (with progress if authed) |
| GET | `/api/skills/:id` | — | Skill detail + lessons |
| POST | `/api/progress/complete-lesson` | ✓ | Complete a lesson, award XP |
| GET | `/api/leaderboard/global` | — | Global XP rankings |
| GET | `/api/achievements` | ✓ | All achievements + unlock status |
| GET | `/api/challenges/today` | ✓ | Today's daily challenge |
| POST | `/api/generate` | ✓ | Generate AI notes + MCQs for a topic |
| GET | `/api/generate/history` | ✓ | Paginated handout history |
| POST | `/api/stripe/create-checkout` | ✓ | Start Stripe Checkout session |
| POST | `/api/stripe/webhook` | — | Stripe event handler |

---

## Key Design Decisions

**SQLite → PostgreSQL portability** — The Prisma schema uses `DATABASE_PROVIDER` env var so the same codebase runs SQLite locally and PostgreSQL in production with no code changes. JSON columns are stored as strings in SQLite and can be migrated to native `jsonb` on Postgres.

**XP formula** — XP needed to advance from level *n* to *n+1* is `floor(100 × n^1.5)`. This gives a natural difficulty curve: level 1→2 costs 100 XP, level 10→11 costs 3162 XP. Multi-level-ups from a single lesson are handled atomically.

**Silent token refresh** — The Axios response interceptor queues all 401 requests while a single refresh call is in flight, then replays them — no lost requests during token expiry.

**AI handout pipeline** — OpenAI is called with `response_format: { type: "json_object" }` to guarantee JSON output. The controller validates the shape (exactly 5 MCQs, 4 options each, answer in options) before persisting — no silent data corruption.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions (Vercel + Render + Supabase).

---

## License

MIT
