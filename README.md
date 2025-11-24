# DishDash

A mobile-first, installable PWA for tracking, planning, and sharing restaurant adventures.

## Project Overview

DishDash helps food explorers:
- Save restaurants they want to try on a "ToDo Eat List"
- Log actual visits with friends
- Invite people via QR codes
- Capture optional post-meal photos
- See trends in what they eat and where

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Package Manager**: pnpm
- **Hosting**: Vercel (free tier)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm 8.x or later

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dish-dash
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Vercel Postgres

This project uses Vercel Postgres with Drizzle ORM.

**Initial Setup:**

1. Create Vercel Postgres database in Vercel Dashboard
2. Copy environment variables to `.env.local`
3. Generate and apply migrations:
   ```bash
   pnpm db:generate
   pnpm db:push
   ```
4. Seed the database:
   ```bash
   pnpm db:seed
   ```

**Database Scripts:**

- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:push` - Apply migrations to database
- `pnpm db:migrate` - Run migrations (alternative to push)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:seed` - Seed database with initial data

**Seed Modes:**

- `SEED_MODE=minimal` - Admin user only (default)
- `SEED_MODE=full` - Admin + test data (restaurants, friends, visits)

### Database Schema

The database includes 7 tables:
- **users** - Authenticated users (admin and regular)
- **restaurants** - Restaurant directory
- **friends** - Dining companions
- **visits** - Logged restaurant visits
- **visit_companions** - Junction table for visit + friends
- **todo_eat_list** - Per-user restaurant wishlist
- **invites** - QR-based invite codes

See `docs/plans/2025-11-23-postgres-database-design.md` for full schema documentation.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Project Structure

```
dish-dash/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes (route group)
│   ├── api/               # API route handlers
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                   # Utilities and configurations
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── docs/                 # Documentation and plans
```

## Development Timeline

### Week 1: Foundations & Lists
- ✅ Next.js 16 setup with App Router
- 🚧 NextAuth v5 with Magic Link + Google
- 🚧 Vercel Postgres database
- 🚧 Restaurant and Friend management
- 🚧 ToDo Eat List

### Week 2: Visits, ToDo Completion & QR Magic
- ⏳ Visit logging flow
- ⏳ Auto-mark ToDo items as eaten
- ⏳ QR-based invites and account linking

### Week 3: Photos, Stats & PWA Polish
- ⏳ Post-meal photos
- ⏳ Dashboard with stats
- ⏳ PWA capabilities (offline, install)

## Deployment

The project is deployed on Vercel with automatic deployments:

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from all branches

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `NEXT_PUBLIC_APP_URL` - Application URL
- Database, auth, email, and storage credentials (added in Week 1+)

## Contributing

This is a personal project following a 3-week challenge timeline.

## License

Private project - All rights reserved
