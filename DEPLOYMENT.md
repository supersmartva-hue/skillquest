# SkillQuest — Free Deployment Guide

Stack: **Vercel** (frontend) + **Render** (backend) + **Render PostgreSQL** (database)  
All three have permanently free tiers. No credit card required.

---

## Step 0 — Push to GitHub (do this first)

```bash
cd "F:/Projects Folder/skillquest"
git init
git add .
git commit -m "Initial commit"
```

Then go to https://github.com/new, create a **public** repo named `skillquest`, copy the remote URL, and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/skillquest.git
git push -u origin main
```

---

## Step 1 — Deploy Backend + Database on Render

### 1a. Create account
Go to https://render.com → Sign up with GitHub (free, no card needed).

### 1b. New PostgreSQL database
1. Dashboard → **New** → **PostgreSQL**
2. Name: `skillquest-db`
3. Plan: **Free**
4. Click **Create Database**
5. Wait ~1 min → copy the **Internal Database URL** (starts with `postgres://`)

### 1c. New Web Service (backend)
1. Dashboard → **New** → **Web Service**
2. Connect your GitHub repo → select `skillquest`
3. Settings:
   - **Name:** `skillquest-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate --schema prisma/schema.postgresql.prisma && npx prisma db push --schema prisma/schema.postgresql.prisma --accept-data-loss`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **Environment Variables** — add all of these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_PROVIDER` | `postgresql` |
| `DATABASE_URL` | *(paste Internal Database URL from step 1b)* |
| `JWT_SECRET` | `1586f2635dc1671668a2b9592916f1d203e9da452f5f4d336fdd4dbd922fffb2` |
| `JWT_REFRESH_SECRET` | `4503f38aea30e67c5d171f0c0ea83fbbeb69a5b314b48b6a28665ce8e11c1cc4` |
| `FRONTEND_URL` | *(fill in after Step 2 — your Vercel URL)* |
| `OPENAI_API_KEY` | *(optional — your key from platform.openai.com)* |
| `STRIPE_SECRET_KEY` | *(optional — skip if not using payments)* |
| `STRIPE_WEBHOOK_SECRET` | *(optional)* |
| `STRIPE_PREMIUM_PRICE_ID` | *(optional)* |

5. Click **Create Web Service** → wait ~3 min for first deploy.
6. Your API URL will be: `https://skillquest-api.onrender.com`

### 1d. Seed the database (one-time)
After the backend is live, open the Render dashboard → **Shell** tab and run:

```bash
node prisma/seed.js
```

This creates 10 skills, 50 lessons, and 20 achievements.

---

## Step 2 — Deploy Frontend on Vercel

### 2a. Create account
Go to https://vercel.com → Sign up with GitHub (free, no card needed).

### 2b. Import project
1. Dashboard → **Add New** → **Project**
2. Import your `skillquest` GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Next.js *(auto-detected)*
   - **Build Command:** `npm run build`
4. **Environment Variables:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://skillquest-api.onrender.com/api` |

5. Click **Deploy** → wait ~2 min.
6. Your app URL will be: `https://skillquest.vercel.app` (or similar).

### 2c. Update FRONTEND_URL in Render
1. Go back to Render → your `skillquest-api` service → Environment
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Click **Save Changes** → Render auto-redeploys

---

## Step 3 — Verify Everything Works

1. Open your Vercel URL
2. Click **Sign Up** and create an account
3. You should land on the dashboard with XP, skills, and daily challenge

Health check: `https://skillquest-api.onrender.com/health` should return `{"status":"ok"}`

---

## Notes

- **Render free tier** spins down after 15 min of inactivity — first request after sleep takes ~30s. Upgrade to Starter ($7/mo) to keep it always-on.
- **JWT secrets above are pre-generated** and safe to use. Treat them as passwords — don't share them publicly.
- **OpenAI key** is only needed for the AI Handouts feature. The rest of the app works without it.
- **Stripe keys** are only needed for the Premium upgrade flow.

---

## Local Development

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev          # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev          # http://localhost:3000
```
