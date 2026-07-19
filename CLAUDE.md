# Propel Coaches — Web Dashboard

## Required Reading — Obsidian Vault Context

Before starting work in this repo, also read these files from my Obsidian "second brain":

- `/Users/charlesbettiol/Documents/Obsidian Vault/Projects/Propel App/background.md` — product vision, two-sided architecture (AI Coach side vs Human Coach side), target users, monetization, competitive positioning, roadmap
- `/Users/charlesbettiol/Documents/Obsidian Vault/Projects/Propel App/screens-and-conventions.md` — sister mobile app's screen-by-screen breakdown, conventions, and file-path index. Useful context because this dashboard shares the same Supabase backend as the mobile app.

## Project Overview

Coach-facing web dashboard for Propel Coaches — Next.js 14 app with marketing site, auth, coach workspace, and client portal. Connects to the same Supabase backend as the mobile app.

## Tech Stack
- **Framework:** Next.js 14 (App Router) + React 18
- **Styling:** Tailwind CSS
- **Backend:** Supabase (auth via SSR helpers, shared DB with mobile app)
- **AI:** Anthropic SDK + OpenAI SDK (in-dashboard AI features)
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** Vercel (auto-deploy on push to `main`)

## Repo
- GitHub: `github.com/charlesbettiolcoaching/propel-coaches-web` (recently renamed from `charbettiol-coach-web`)
- Vercel project: connected via GitHub integration

## Route Groups (under `src/app/`)
- **Public marketing:** landing, pricing, compare, blog, help, privacy-policy, terms, trial
- **`(auth)`:** login, register, forgot-password, onboarding
- **`(dashboard)`:** coach workspace — clients, programs, messages, admin, AI coach config
- **`(client)`:** client-facing web views (alternative to mobile app)

## Vercel Crons (`vercel.json`)
- `/api/messages/scheduled` — daily 09:00
- `/api/cron/email-sequences` — daily 10:00
- `/api/cron/ai-coach-expiry` — daily 12:00

## Conventions
- Supabase client lives in `src/lib/supabase/` (`client.ts` for browser, `server.ts` for SSR)
- Auth middleware in `src/middleware.ts`
- All env vars in `.env.local` (never commit) — see `AI_SETUP.md` in repo root for required keys
- Match the mobile app's design language — same brand, same colour palette
