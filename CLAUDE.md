# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint with auto-fix
npm run test       # Run tests: tsx --test lib/**/*.test.ts
```

Database:
```bash
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Apply pending migrations
npx prisma studio      # Open Prisma DB GUI
```

## Architecture

**Teen Mind** is a Thai mental health assessment platform built with Next.js 15 App Router. It has two distinct surfaces:

1. **LIFF (`/liff`)** — Mobile-first LINE Front-end Framework app. Citizens access it inside the LINE app to complete mental health questionnaires (PHQA-based) and manage their profile.
2. **Admin Dashboard (`/admin`)** — Web dashboard for staff to monitor assessments, view analytics maps, manage consultations, and track risk cases.

### Routing layout

```
app/
├── liff/          # Citizen-facing: auth, question flow, profile, referent, privacy
├── admin/(app)/   # Admin: dashboard, map, accounts, members, questions, alerts, schools, volunteers
├── api/           # REST endpoints consumed by both surfaces
└── page.tsx       # Redirects to /liff
```

### Key data flow

- **Auth**: LINE OAuth via NextAuth (`lib/auth-options.ts`). JWT strategy, 1-day maxAge. Session extended with `userId`, `role`, `lineId`. Admin users have a `Profile_Admin` record with a `Roles` reference.
- **Database**: MySQL + Prisma ORM. Client singleton in `utils/prisma.ts`. Schema is in `prisma/schema.prisma` (~20 tables).
- **Assessment scoring**: Logic lives in `lib/assessment-scale.ts` and `lib/assessment-recalculate-preview.ts`. Follow-up round logic is in `lib/question-followup-rounds.ts`.
- **API routes**: All under `app/api/`. Dashboard analytics are split across `app/api/dashboard/` (age segments, maps, productivity, risk, usage stats). Geographic lookups (provinces/districts/subdistricts) use Thai administrative data stored in DB.
- **Maps**: Leaflet + react-leaflet with clustering and heatmap layers. Types for the custom `leaflet-heat` plugin are in `types/leaflet-heat.d.ts`.
- **Data export**: XLSX via the `xlsx` package.
- **LINE messaging**: `utils/linesdk.ts` wraps LINE Bot SDK for sending messages.

### State management

- Server state: TanStack React Query (configured in `app/providers.tsx`)
- Auth state: NextAuth `useSession` / server-side `getSession` (`lib/get-session.ts`)
- No global client state manager — component-local state via React hooks

### UI conventions

- Component library: HeroUI v2 (`@heroui/react`)
- Styling: Tailwind CSS + `tailwind-variants`
- Thai font: Prompt (Google Fonts, configured in `config/fonts.ts`)
- Theme: light/dark via `next-themes`
- Admin layout is wrapped in a route group `(app)` with a shared sidebar

### Environment variables required

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

The app runs under PM2 (`teenmind-server.js` at project root). Production uses `npm run build && npm run start`.
