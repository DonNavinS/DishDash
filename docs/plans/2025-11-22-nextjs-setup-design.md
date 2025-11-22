# Next.js 16 Project Setup Design

**Date**: 2025-11-22
**Story**: SC-55 - Set up Next.js 16 project with App Router on Vercel
**Epic**: Week 1: Foundation & Authentication

## Overview

Initialize DishDash as a Next.js 16 project with App Router, TypeScript (strict mode), Tailwind CSS, and shadcn/ui. Deploy to Vercel free tier with proper folder structure and development tooling configured.

## Design Decisions

### Package Manager & Dependencies

**Selected: pnpm**
- Faster installation times
- Efficient disk usage through content-addressable storage
- Stricter dependency management prevents subtle bugs
- Growing ecosystem support

**Core Dependencies:**
- Next.js 16 (latest stable)
- React 19 (RC - compatible with Next.js 16)
- TypeScript with strict configuration
- Tailwind CSS (v3 or v4 depending on stability)
- shadcn/ui for component library

### TypeScript Configuration

**Selected: Strict Mode**
- All strict type-checking options enabled
- Catches more bugs at compile time
- Better IDE support and autocomplete
- Minimal setup cost for new project, high long-term value

**tsconfig.json Key Settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Folder Structure

**Selected: Hybrid Approach**
- Structured but not over-engineered
- Clear separation of concerns
- Scalable for 3-week timeline

```
dish-dash/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route group for auth pages
│   ├── api/               # API route handlers
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components (as needed)
├── lib/                   # Utilities and configurations
│   ├── utils.ts          # Helper functions
│   └── ...               # Database, auth config (added in Week 1+)
├── public/               # Static assets
├── styles/               # Global styles (if needed beyond Tailwind)
├── types/                # TypeScript type definitions
└── .env.example          # Environment variable template
```

**Rationale:**
- Route groups `(auth)` keep URLs clean while organizing related pages
- `components/ui/` reserved for shadcn/ui to avoid mixing with custom components
- `lib/` centralized location for shared utilities, configs, and integrations
- `types/` for shared TypeScript interfaces (User, Restaurant, Visit, etc.)

### Tailwind CSS & shadcn/ui

**Tailwind Configuration:**
- Mobile-first breakpoints (critical for PWA)
- Dark mode with `class` strategy (enables future toggle)
- Custom color scheme using CSS variables
- Content paths: `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`

**shadcn/ui Setup:**
- Initialize with `pnpm dlx shadcn-ui@latest init`
- Use Tailwind CSS variables for theming
- Install essential components initially:
  - `button` - primary UI element
  - `form` / `input` - for Week 1 forms
  - `card` - for list items
  - `avatar` - for user/friend profiles
- Components are customizable and added to `components/ui/`

**Global Styles (`app/globals.css`):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CSS variables for theming */
  }

  /* Mobile-first typography */
}
```

### Development Tooling

**Selected: Standard Next.js ESLint + Prettier**
- Default Next.js ESLint config catches common issues
- Prettier for consistent formatting
- Tailwind CSS plugin for Prettier (class sorting)

**Configuration:**
- `.prettierrc`: Single quotes, 2-space indent, trailing commas
- ESLint: Extends `next/core-web-vitals`
- Optional git hooks (can defer to later weeks)

### Environment Variables

**Selected: `.env.local` with `.env.example`**
- Follows Next.js conventions
- `.env.example` committed to repo as documentation
- `.env.local` gitignored for secrets
- Seamless Vercel integration

**`.env.example` Template:**
```bash
# Database (Vercel Postgres - Week 1+)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Auth (NextAuth v5 - Week 1+)
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Email (Resend - Week 1+)
RESEND_API_KEY=

# Storage (Vercel Blob - Week 2+)
BLOB_READ_WRITE_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Rationale:**
Sets up structure for all Week 1-3 integrations without requiring actual services yet. Environment variable pattern is established from day one.

### Vercel Deployment

**Selected: Deploy after Tailwind and folder structure**
- Validates production build early
- More meaningful than default Next.js starter
- Balances "deploy early" with "deploy something real"

**Deployment Configuration:**
- Connect GitHub repository to Vercel
- Framework Preset: Next.js
- Build Command: `pnpm build`
- Install Command: `pnpm install`
- Root Directory: `./`
- Enable automatic deployments on `main` branch
- Feature branch previews for PRs

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_APP_URL`: Set to Vercel deployment URL

### Initial Pages

**Minimal but Meaningful Starter:**

1. **`app/layout.tsx`**:
   - Root layout with metadata
   - Font configuration (Inter or similar)
   - Import Tailwind globals
   - Viewport meta for mobile

2. **`app/page.tsx`**:
   - Simple landing page
   - "DishDash" branding
   - Tagline: "Track, plan, and share your restaurant adventures"
   - Basic styling with Tailwind

3. **`app/api/health/route.ts`**:
   - Simple health check endpoint
   - Returns `{ status: 'ok' }`
   - Verifies API routes work correctly

## Success Criteria

### Build & Development
- ✅ `pnpm dev` runs without errors
- ✅ `pnpm build` completes successfully
- ✅ `pnpm tsc --noEmit` passes (no type errors)
- ✅ Hot reload works in development

### Deployment
- ✅ Vercel deployment succeeds
- ✅ Production site accessible at Vercel URL
- ✅ Health check endpoint returns 200 OK
- ✅ Automatic deployments configured

### Code Quality
- ✅ ESLint runs without errors
- ✅ Prettier formats code consistently
- ✅ TypeScript strict mode enabled and passing

### Structure
- ✅ Folder structure matches design
- ✅ shadcn/ui installed and accessible
- ✅ Tailwind CSS working (verified by styled page)
- ✅ `.env.example` in repository

## Implementation Phases

### Phase 1: Initialize Project
- Create Next.js 16 project with pnpm
- Configure TypeScript strict mode
- Set up folder structure
- Initialize git (already done)

### Phase 2: Configure Styling
- Install and configure Tailwind CSS
- Initialize shadcn/ui
- Install essential UI components
- Create global styles

### Phase 3: Development Tooling
- Configure ESLint
- Set up Prettier
- Create `.env.example`
- Update `.gitignore`

### Phase 4: Initial Pages
- Create root layout
- Build landing page
- Add health check API route
- Test locally

### Phase 5: Deploy to Vercel
- Connect GitHub to Vercel
- Configure build settings
- Set environment variables
- Verify deployment

## Future Considerations

### Week 1 Next Steps
After this foundation is complete, Week 1 will continue with:
- NextAuth v5 setup (magic link + Google OAuth)
- Vercel Postgres database setup
- Admin role implementation
- Restaurant and Friend management forms

### Extensibility
This setup supports:
- PWA configuration (Week 3 - next-pwa)
- Image optimization (Vercel Blob in Week 2)
- API routes for database operations
- Server and Client Components as needed
- Offline capabilities via service workers

## Notes

- This is a greenfield project with no legacy constraints
- 3-week timeline prioritizes pragmatism over perfection
- Mobile-first is critical - all decisions support PWA goals
- Free tier services only (Vercel Hobby plan)
- All tools chosen are well-documented and widely supported
