# Vercel Postgres Database Design

**Story**: SC-56 - Configure Vercel Postgres database and create schema
**Date**: 2025-11-23
**Status**: Design Complete

## Overview

Database schema for DishDash using Drizzle ORM with Vercel Postgres, supporting all Week 1-3 features including user management, restaurant discovery, ToDo Eat List, visit logging, and QR invites.

## Technology Stack

- **ORM**: Drizzle ORM (TypeScript-first, excellent type inference)
- **Database**: Vercel Postgres (serverless-optimized)
- **Migration Tool**: drizzle-kit (schema-first migrations)
- **Connection**: @vercel/postgres (built-in pooling)
- **Validation**: Zod schemas for input validation

## Architecture Philosophy

The schema is organized around three core concepts:

1. **Identity** - Users, Friends, and their relationships
2. **Discovery** - Restaurants and the ToDo Eat List
3. **Experience** - Visits and their companions

This separation keeps the data model clean and supports the natural user flow: discover restaurants → add to ToDo list → log visits → track progress.

## Database Schema

### Users Table

Stores authenticated users (admin and regular users).

```typescript
users {
  id: uuid (primary key)
  email: string (unique, not null)
  name: string (not null)
  role: enum ('admin', 'user') default 'user'
  avatar_url: string (nullable)
  created_at: timestamp default now()
  updated_at: timestamp default now()
}
```

**Key Decisions:**
- UUID for IDs (better for distributed systems, harder to guess)
- Email is unique and required (needed for NextAuth)
- Role defaults to 'user', only Navin gets 'admin'
- avatar_url nullable (fallback to generated avatars in UI)

**Indexes:**
- Index on `email` (for auth lookups)

### Restaurants Table

All restaurants that can be added to ToDo lists or visited.

```typescript
restaurants {
  id: uuid (primary key)
  name: string (not null)
  location: string (not null)
  cuisine_tags: string[] (default [])
  photo_url: string (nullable)
  notes: text (nullable)
  created_by: uuid (foreign key -> users.id)
  created_at: timestamp default now()
  updated_at: timestamp default now()
}
```

**Key Decisions:**
- cuisine_tags as Postgres array for easy filtering
- created_by tracks who added it (useful for admin moderation)
- photo_url nullable (not all restaurants will have photos)
- notes for user comments like "hype from TikTok"

**Indexes:**
- Index on `created_by` (for admin queries)
- GIN index on `cuisine_tags` (for array searches)

### Friends Table

Dining companions that can be added to visits. Can be linked to user accounts via QR invites.

```typescript
friends {
  id: uuid (primary key)
  name: string (not null)
  email: string (nullable, unique when set)
  photo_url: string (nullable)
  user_id: uuid (nullable, foreign key -> users.id, unique)
  created_by: uuid (not null, foreign key -> users.id)
  created_at: timestamp default now()
  updated_at: timestamp default now()
}
```

**Key Decisions:**
- email nullable (can add friends without email initially)
- user_id nullable (null until they join via QR and claim profile)
- user_id is unique (one friend profile = one user account max)
- created_by tracks who added this friend
- When user_id is set, friend profile is "claimed" by that user

**Indexes:**
- Index on `user_id` (for "is this friend linked?" lookups)
- Index on `created_by` (for "friends I added" queries)

### Visits Table

Logged restaurant visits with ratings, notes, and optional photos.

```typescript
visits {
  id: uuid (primary key)
  restaurant_id: uuid (not null, foreign key -> restaurants.id, on delete cascade)
  user_id: uuid (not null, foreign key -> users.id, on delete cascade)
  visited_at: timestamp (not null, default now())
  rating: integer (1-5, nullable)
  price_band: enum ('$', '$$', '$$$', '$$$$') (nullable)
  notes: text (nullable)
  photo_url: string (nullable)
  created_at: timestamp default now()
  updated_at: timestamp default now()
}
```

**Key Decisions:**
- visited_at separate from created_at (can log past visits)
- rating is 1-5 integer (simple, works with star/emoji UI)
- price_band uses standard $ notation
- on delete cascade (if restaurant/user deleted, visits go too)
- photo_url for optional post-meal photos (Week 3 feature)

**Indexes:**
- Index on `(user_id, visited_at desc)` (for user visit history)
- Index on `restaurant_id` (for restaurant visit counts)

### VisitCompanions Table

Junction table for many-to-many relationship between visits and friends.

```typescript
visit_companions {
  id: uuid (primary key)
  visit_id: uuid (not null, foreign key -> visits.id, on delete cascade)
  friend_id: uuid (not null, foreign key -> friends.id, on delete cascade)
  created_at: timestamp default now()
}

// Constraints:
// - UNIQUE (visit_id, friend_id) - can't add same friend twice to one visit
```

**Key Decisions:**
- Simple junction table for many-to-many relationship
- Cascade deletes (if visit or friend deleted, relationship goes too)
- Unique constraint prevents duplicate companions on same visit

**Indexes:**
- Index on `visit_id` (for "who was at this visit?")
- Index on `friend_id` (for "which visits included this friend?")

### TodoEatList Table

Per-user tracking of restaurants they want to try and those they've eaten at.

```typescript
todo_eat_list {
  id: uuid (primary key)
  user_id: uuid (not null, foreign key -> users.id, on delete cascade)
  restaurant_id: uuid (not null, foreign key -> restaurants.id, on delete cascade)
  status: enum ('todo', 'eaten') default 'todo'
  added_at: timestamp default now()
  completed_at: timestamp (nullable)
}

// Constraints:
// - UNIQUE (user_id, restaurant_id) - can't add same restaurant twice
```

**Key Decisions:**
- status tracks todo vs eaten (auto-updated when visit logged)
- completed_at set when status changes to 'eaten'
- Unique constraint: one entry per user per restaurant
- This is per-user (my ToDo list is separate from yours)
- When user logs a visit to a restaurant on their ToDo list:
  - Status automatically changes from 'todo' to 'eaten'
  - completed_at is set to current timestamp

**Indexes:**
- Index on `(user_id, status)` (for "my todos" and "my eaten" queries)
- Index on `restaurant_id` (for "who has this on their list?")

### Invites Table

QR-based invite codes for onboarding new users and linking friend profiles.

```typescript
invites {
  id: uuid (primary key)
  code: string (unique, not null) // Short random code for QR
  email: string (nullable) // Optional: pre-assign to specific email
  created_by: uuid (not null, foreign key -> users.id)
  expires_at: timestamp (not null) // Default: 7 days from creation
  used_at: timestamp (nullable) // Set when someone claims it
  claimed_by: uuid (nullable, foreign key -> users.id)
  created_at: timestamp default now()
}
```

**Key Decisions:**
- code is short, unique string (e.g., 8 characters) for QR URL
- email nullable (can create open invites or targeted ones)
- expires_at enforced (cleanup via Vercel Cron in Week 3)
- used_at and claimed_by track successful claims
- When claimed:
  - If email matches existing friend.email → link friend to user
  - If email is new → create new user account
  - Set used_at and claimed_by

**Indexes:**
- Index on `code` (for QR code lookups)
- Index on `expires_at` (for Cron cleanup queries)

## Relationships Summary

```
users (1) ──< (many) restaurants.created_by
users (1) ──< (many) friends.created_by
users (1) ──o (0-1) friends.user_id [friend claims user account]
users (1) ──< (many) visits.user_id
users (1) ──< (many) todo_eat_list.user_id
users (1) ──< (many) invites.created_by
users (1) ──o (0-1) invites.claimed_by

restaurants (1) ──< (many) visits.restaurant_id
restaurants (1) ──< (many) todo_eat_list.restaurant_id

visits (1) ──< (many) visit_companions.visit_id
friends (1) ──< (many) visit_companions.friend_id
```

## File Structure

```
lib/
  db/
    schema.ts          # All Drizzle table definitions
    index.ts           # Database connection and exports
    seed.ts            # Seed data script
drizzle/
  migrations/          # Generated migration files (git-tracked)
drizzle.config.ts      # Drizzle Kit configuration
.env.local            # Local database credentials (git-ignored)
```

## Implementation Steps

### 1. Install Dependencies

```bash
pnpm add drizzle-orm @vercel/postgres
pnpm add -D drizzle-kit
```

### 2. Create Vercel Postgres Database

- Go to Vercel Dashboard → Storage → Create Database
- Select Postgres
- Copy connection strings to `.env.local`

### 3. Configure Environment Variables

Add to `.env.local`:
```bash
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

Also add to `.env.example` (without values) for documentation.

### 4. Define Schema

Create `lib/db/schema.ts` with all table definitions using Drizzle syntax.

### 5. Configure Drizzle Kit

Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

### 6. Generate Initial Migration

```bash
pnpm drizzle-kit generate:pg
```

This creates migration files in `drizzle/migrations/`.

### 7. Apply Migration

```bash
pnpm drizzle-kit push:pg
```

This applies the migration to your Vercel Postgres database.

### 8. Create Seed Script

Create `lib/db/seed.ts` with configurable seed data.

### 9. Run Seed

```bash
pnpm tsx lib/db/seed.ts
```

Or add to `package.json` scripts:
```json
{
  "scripts": {
    "db:seed": "tsx lib/db/seed.ts",
    "db:migrate": "drizzle-kit push:pg",
    "db:generate": "drizzle-kit generate:pg"
  }
}
```

## Seed Data Strategy

### Minimal Mode (Clean Testing)
Controlled via `SEED_MODE=minimal` environment variable.

**Data:**
- 1 admin user (Navin with your email from env)

**Use case:** Testing fresh user flows, clean slate

### Full Mode (Development)
Controlled via `SEED_MODE=full` environment variable.

**Data:**
- 1 admin user (Navin)
- 5 restaurants:
  - Mario's Italian Kitchen (Italian, San Francisco)
  - Sushi Zen (Japanese, San Francisco)
  - Taqueria El Primo (Mexican, Oakland)
  - Thai Basil (Thai, Berkeley)
  - The Burger Spot (American, San Francisco)
- 3 friends:
  - Sarah Chen (with photo)
  - Mike Rodriguez (no photo, generated avatar)
  - Emma Wilson (with photo)
- 2 visits already logged:
  - Visit to Mario's Italian Kitchen with Sarah
  - Visit to Sushi Zen with Mike and Emma
- 3 ToDo Eat List entries:
  - Taqueria El Primo (status: 'todo')
  - Thai Basil (status: 'todo')
  - The Burger Spot (status: 'eaten', has visit)
- 1 active invite code (expires in 7 days)

**Use case:** Testing UI with realistic data, dashboard/stats features

## Connection Pooling

Using `@vercel/postgres` which provides:
- Automatic connection pooling for serverless functions
- Environment-based configuration
- Optimized for Vercel Postgres
- No additional configuration needed

## Data Validation

### Database Level
- NOT NULL constraints on required fields
- UNIQUE constraints on emails, invite codes, composite keys
- CHECK constraints on rating (1-5 range)
- Foreign key constraints with CASCADE behavior
- Default values for timestamps and enums

### Application Level (Zod)
Input validation schemas for all forms:
- Email format validation
- String length limits:
  - Restaurant name: max 200 chars
  - Location: max 200 chars
  - Notes: max 2000 chars
- Array validation for cuisine_tags
- URL validation for photo_url fields
- Date validation for visited_at
- Rating range validation (1-5)
- Enum validation for role, status, price_band

## Error Handling

### Database Errors
- **Unique constraint violations** → "Already exists" user-friendly message
- **Foreign key violations** → "Related item not found"
- **Connection errors** → Retry logic with exponential backoff
- **Transaction rollbacks** on multi-step operations (e.g., creating visit + updating ToDo status)

### Migration Safety
- All migrations are idempotent (safe to re-run)
- Down migrations included for rollback capability
- Test migrations on local/staging before production
- Migration files tracked in git for team synchronization

## Security Considerations

### Query Safety
- All queries use parameterized statements (Drizzle handles this automatically)
- No raw SQL concatenation
- Input sanitization via Zod schemas

### Access Control
- Row-level security via application logic:
  - Users can only see their own visits, ToDo lists
  - Users can only edit their own data
  - Admin can see/edit all data
- Admin role checked server-side for sensitive operations
- Rate limiting on invite creation (prevent spam/abuse)

### Data Privacy
- User data is private by default
- Admin can moderate for policy violations
- QR invite codes expire automatically
- Input sanitization for user-generated content (notes, names)
- HTTPS-only connections enforced

## Business Logic Rules

### Auto-marking ToDo as Eaten
When a visit is created:
1. Check if `todo_eat_list` has entry where:
   - `user_id` = visit creator
   - `restaurant_id` = visited restaurant
   - `status` = 'todo'
2. If found, update that entry:
   - Set `status` = 'eaten'
   - Set `completed_at` = current timestamp
3. Show celebratory UI message (optional)

### Friend-to-User Linking via QR
When invite is claimed:
1. User scans QR code with unique invite `code`
2. User signs in via magic link or Google
3. Check if `friends` table has entry where:
   - `email` matches authenticated user email
   - `user_id` IS NULL (not yet claimed)
4. If found, update friend:
   - Set `user_id` = authenticated user ID
   - Friend profile is now "claimed"
5. Update invite:
   - Set `used_at` = current timestamp
   - Set `claimed_by` = authenticated user ID

## Testing Strategy

### Migration Testing
- Test migrations on local database first
- Verify schema matches Drizzle definitions
- Check all indexes are created
- Validate constraints work as expected

### Seed Testing
- Test both minimal and full seed modes
- Verify foreign key relationships
- Check default values
- Ensure idempotent (can re-run safely)

### Query Testing
- Test all CRUD operations
- Verify cascade deletes work correctly
- Test unique constraints
- Validate auto-updating logic (ToDo status)

## Acceptance Criteria Mapping

✅ **Vercel Postgres connected to project**
- Database created in Vercel Dashboard
- Environment variables configured
- Connection tested via Drizzle

✅ **All database tables created with proper relationships**
- 7 tables defined: users, restaurants, friends, visits, visit_companions, todo_eat_list, invites
- Foreign keys established with CASCADE behavior
- Unique constraints on critical fields

✅ **Database migrations set up**
- Drizzle Kit configured
- Initial migration generated
- Migration applied to database
- Future schema changes use migration workflow

✅ **Seed data for testing (optional admin user)**
- Configurable seed script (minimal/full modes)
- Admin user created with proper role
- Optional test data for development

✅ **Connection pooling configured**
- @vercel/postgres provides automatic pooling
- Optimized for serverless environment
- No additional configuration needed

## Next Steps (Week 1)

After database setup is complete:
1. **SC-57**: Configure NextAuth v5 with Magic Link + Google OAuth
2. **SC-58**: Implement admin role and user management UI
3. **SC-59**: Build Restaurant CRUD functionality
4. **SC-60**: Build Friend management with avatars
5. **SC-61**: Create ToDo Eat List feature

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Drizzle Kit CLI](https://orm.drizzle.team/kit-docs/overview)
