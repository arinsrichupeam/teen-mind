# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint with auto-fix
npm run test       # Run all tests: tsx --test lib/**/*.test.ts
```

Run a single test file:
```bash
npx tsx --test lib/assessment-scale.test.ts
```

Database:
```bash
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Apply pending migrations
npx prisma studio      # Open Prisma DB GUI
```

## Architecture

**Teen Mind** is a Thai mental health assessment platform built with Next.js 15 App Router. It has two distinct surfaces:

1. **LIFF (`/liff`)** — Mobile-first LINE Front-end Framework app. Citizens access it inside the LINE app to complete mental health questionnaires and manage their profile.
2. **Admin Dashboard (`/admin`)** — Web dashboard for staff to monitor assessments, view analytics maps, manage consultations, and track risk cases.

### Routing layout

```
app/
├── liff/          # Citizen-facing: auth, question flow, profile, referent, privacy
├── admin/(app)/   # Admin: dashboard, map, accounts, members, questions, alerts, schools, volunteers
├── admin/(auth)/  # Admin auth routes (register) — separate layout, no sidebar
├── api/           # REST endpoints consumed by both surfaces
└── page.tsx       # Redirects to /liff
```

### Auth

LINE OAuth via NextAuth (`lib/auth-options.ts`). JWT strategy, 1-day maxAge. Admin users have a `Profile_Admin` record with a `Roles` FK.

Server-side auth helpers from `lib/get-session.ts`:
- `getSession()` — thin wrapper around `getServerSession(authOptions)`, returns session or null
- `requireAdmin()` — validates session + `Profile_Admin` record; returns `{ session, adminProfile }` or `null`
- `requireReferent()` — validates session + citizen `Profile` + `Referent` record; returns `{ session, referent }` or null

Always use `requireAdmin()` in admin API routes. Never expose admin endpoints with just `getSession()`.

### Database

MySQL + Prisma ORM. Client singleton in `utils/prisma.ts`. Schema in `prisma/schema.prisma` (~22 models).

Key models and their purpose:
- `User` / `Account` — NextAuth OAuth records (provider: "line")
- `Profile` — Citizen record (citizenId 13-digit, birthday, hn, schoolId). Linked to `User`.
- `Profile_Admin` — Staff record (roleId → `Roles`, affiliationId, alert boolean for emergency push)
- `Questions_Master` — Assessment form. Has FK to `Profile` and optional `Referent`. Stores lat/lng and status (0–3).
- `Questions_PHQA` — PHQ-A scores (9 questions, for age < 18)
- `Questions_9Q` — 9Q scores (PHQ-9 adult variant, for age ≥ 18)
- `Questions_PHQA_Addon` — 2-question addon required with PHQ-A
- `Questions_8Q` — Suicide risk screen (8 questions with weighted scoring)
- `Questions_2Q` — Initial 2-question depression screen
- `Questions_Problem` — 24 boolean fields across family/social/study/lifestyle categories
- `Referent` — Counselor/volunteer linked to `Affiliation` and `Volunteer_Type`
- `School` — School with `screeningDate` (used as fallback birthday for age calculation)
- `Provinces` / `Districts` / `Subdistricts` — Thai geographic hierarchy stored in DB

### Assessment logic

Scale selection is age-based (`lib/assessment-scale.ts`):
- `MAIN_ASSESSMENT_AGE_CUTOFF = 18`
- Age < 18 → **PHQ-A** (Questions_PHQA + mandatory Questions_PHQA_Addon)
- Age ≥ 18 → **9Q** (Questions_9Q)
- Age is calculated from `Profile.birthday` or `School.screeningDate` as fallback

Risk level scoring:
| Scale | Sum range | Result |
|-------|-----------|--------|
| PHQ-A | 0–4 | Green |
| PHQ-A | 5–9 | Green-Low |
| PHQ-A | 10–14 | Yellow |
| PHQ-A | 15–19 | Orange |
| PHQ-A | 20–27 | Red |
| 9Q | 0–6 | Green |
| 9Q | 7–12 | Yellow |
| 9Q | 13–18 | Orange |
| 9Q | 19–27 | Red |

8Q (suicide risk) uses weighted per-question values — not a simple sum.

### Follow-up round logic (`lib/question-followup-rounds.ts`)

Each assessment tracks **3 rounds** of follow-up. Each round requires:
- A telemed/consult schedule + consultant name
- A SOAP note (subjective, objective, assessment, plan)
- A follow-up date

`Questions_Master.status` is computed (not stored directly):
- `0` — No HN on profile
- `1` — HN present, round 1 not yet complete
- `2` — Round 1 complete, rounds 2–3 in progress
- `3` — All 3 rounds fully complete

Use `calculateQuestionStatus()` to derive status from a record. Don't hardcode status values.

### API route conventions

All routes live under `app/api/`. Standard response shapes:
```typescript
// Success
{ data: T }                     // or top-level keys e.g. { questionsList, pagination }
{ success: true, data: T }

// Error
{ error: string }               // with appropriate HTTP status (400, 401, 500)
{ success: false, error: string }
```

Pagination shape (when used):
```typescript
{ page: number, limit: number, total: number, totalPages: number }
```

Every admin API route must call `requireAdmin()` first and return 401 if it returns null.

LINE side-effects on assessment creation:
- Result flex message is pushed to the citizen (via `utils/linesdk.ts`)
- If result is **Red**, emergency alerts are pushed to all `Profile_Admin` records with `alert = true`

### State management

- Server state: TanStack React Query (configured in `app/providers.tsx`)
- Auth state: NextAuth `useSession` (client) / `getSession` (server)
- No global client state — component-local React hooks only

### UI conventions

- Component library: HeroUI v2 (`@heroui/react`)
- Styling: Tailwind CSS + `tailwind-variants`
- Thai font: Prompt (Google Fonts, `config/fonts.ts`)
- Theme: light/dark via `next-themes`
- Admin layout is in the `(app)` route group with a shared sidebar (`layout-context.ts` holds sidebar state)
- Use `useDisclosure()` (HeroUI) for modal open/close state

### Testing

Tests use Node.js built-in test runner (`node:test`) with `assert/strict`:
```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
```

Tests live alongside source files as `*.test.ts` in `lib/`. Coverage is focused on pure business logic (assessment scoring, age segments, recalculation). There are no API or component tests.

### Data validation conventions

- `citizenId`: 13-digit Thai national ID with checksum (validated in `lib/profile-utils.ts`)
- Dates: Thai Buddhist Era display, stored as UTC in DB; dashboard date params come in as Thai BE format and are parsed before Prisma queries
- Geographic data: provinces/districts/subdistricts are always queried from DB, not hardcoded

### Environment variables

```
DATABASE_URL              # MySQL connection string
NEXTAUTH_SECRET
NEXTAUTH_URL
LINE_CLIENT_ID
LINE_CLIENT_SECRET
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
ABS_BASE_URL              # External HIS/patient lookup API
ABS_USERNAME
ABS_PASSWORD
```

### Deployment

Runs under PM2. Build then start the process:
```bash
npm run build
pm2 start yarn --name teenmind -- start   # or via teenmind-server.js at project root
```
