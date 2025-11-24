# Vercel Postgres Database Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Vercel Postgres database with Drizzle ORM, create schema for all 7 tables, implement migrations, and seed initial data.

**Architecture:** Use Drizzle ORM for type-safe database access with Vercel Postgres. Schema-first approach with migrations tracked in git. Configurable seed script for minimal (admin only) or full (test data) modes.

**Tech Stack:** Drizzle ORM, Vercel Postgres, @vercel/postgres, drizzle-kit, Zod (validation), tsx (TypeScript execution)

---

## Task 1: Install Dependencies and Configure Drizzle

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Modify: `.env.example`
- Create: `.env.local` (not committed)

**Step 1: Install Drizzle ORM and database packages**

Run:
```bash
pnpm add drizzle-orm @vercel/postgres
pnpm add -D drizzle-kit tsx
```

Expected: Packages installed successfully

**Step 2: Update package.json scripts**

Add to `package.json` scripts section:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx lib/db/seed.ts"
  }
}
```

**Step 3: Create Drizzle configuration**

Create `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

**Step 4: Update environment variable template**

Modify `.env.example`, add database section:

```bash
# Database (Vercel Postgres - Week 1+)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Seed configuration
SEED_MODE=minimal
ADMIN_EMAIL=your-email@example.com
ADMIN_NAME=Your Name
```

**Step 5: Verify configuration**

Run: `cat drizzle.config.ts`

Expected: File exists with correct configuration

**Step 6: Commit configuration**

Run:
```bash
git add package.json drizzle.config.ts .env.example
git commit -m "chore: Configure Drizzle ORM for Vercel Postgres

- Install drizzle-orm, @vercel/postgres, and drizzle-kit
- Add database management scripts to package.json
- Create Drizzle configuration for migrations
- Update environment variable template

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Vercel Postgres Database

**Files:**
- Create: `.env.local` (local only, not committed)

**Step 1: Create database in Vercel Dashboard**

Manual steps:
1. Go to https://vercel.com/dashboard
2. Navigate to your DishDash project
3. Go to Storage tab
4. Click "Create Database"
5. Select "Postgres"
6. Name: `dishdash-db`
7. Region: Choose closest to you
8. Click "Create"

Expected: Database created successfully

**Step 2: Copy environment variables**

In Vercel Dashboard:
1. Go to the database you just created
2. Click ".env.local" tab
3. Copy all the POSTGRES_* variables

Expected: You have connection strings copied

**Step 3: Create local environment file**

Create `.env.local` and paste the Vercel variables:

```bash
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Seed configuration
SEED_MODE=minimal
ADMIN_EMAIL=seneviratnanavin@gmail.com
ADMIN_NAME=Navin Seneviratna
```

**Step 4: Verify .env.local is gitignored**

Run: `git check-ignore .env.local`

Expected: `.env.local` (confirms it's ignored)

**Step 5: Add environment variables to Vercel project**

Manual steps:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable from `.env.local`
3. Set for: Production, Preview, Development
4. Save changes

Expected: All environment variables added to Vercel

**Step 6: No commit needed** (environment files are not committed)

---

## Task 3: Define Database Schema

**Files:**
- Create: `lib/db/schema.ts`

**Step 1: Create lib/db directory**

Run:
```bash
mkdir -p lib/db
```

**Step 2: Create schema file with users table**

Create `lib/db/schema.ts`:

```typescript
import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const todoStatusEnum = pgEnum('todo_status', ['todo', 'eaten']);
export const priceBandEnum = pgEnum('price_band', ['$', '$$', '$$$', '$$$$']);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('user').notNull(),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
);

// Restaurants table
export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    location: varchar('location', { length: 200 }).notNull(),
    cuisineTags: text('cuisine_tags').array().default([]).notNull(),
    photoUrl: varchar('photo_url', { length: 500 }),
    notes: text('notes'),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('restaurants_created_by_idx').on(table.createdBy),
  })
);

// Friends table
export const friends = pgTable(
  'friends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).unique(),
    photoUrl: varchar('photo_url', { length: 500 }),
    userId: uuid('user_id')
      .references(() => users.id)
      .unique(),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('friends_user_id_idx').on(table.userId),
    createdByIdx: index('friends_created_by_idx').on(table.createdBy),
  })
);

// Visits table
export const visits = pgTable(
  'visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    restaurantId: uuid('restaurant_id')
      .references(() => restaurants.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    visitedAt: timestamp('visited_at').defaultNow().notNull(),
    rating: integer('rating'),
    priceBand: priceBandEnum('price_band'),
    notes: text('notes'),
    photoUrl: varchar('photo_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdVisitedAtIdx: index('visits_user_id_visited_at_idx').on(
      table.userId,
      table.visitedAt
    ),
    restaurantIdIdx: index('visits_restaurant_id_idx').on(table.restaurantId),
  })
);

// VisitCompanions junction table
export const visitCompanions = pgTable(
  'visit_companions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    visitId: uuid('visit_id')
      .references(() => visits.id, { onDelete: 'cascade' })
      .notNull(),
    friendId: uuid('friend_id')
      .references(() => friends.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    visitIdFriendIdIdx: uniqueIndex('visit_companions_visit_friend_idx').on(
      table.visitId,
      table.friendId
    ),
    visitIdIdx: index('visit_companions_visit_id_idx').on(table.visitId),
    friendIdIdx: index('visit_companions_friend_id_idx').on(table.friendId),
  })
);

// TodoEatList table
export const todoEatList = pgTable(
  'todo_eat_list',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    restaurantId: uuid('restaurant_id')
      .references(() => restaurants.id, { onDelete: 'cascade' })
      .notNull(),
    status: todoStatusEnum('status').default('todo').notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userIdRestaurantIdIdx: uniqueIndex('todo_eat_list_user_restaurant_idx').on(
      table.userId,
      table.restaurantId
    ),
    userIdStatusIdx: index('todo_eat_list_user_status_idx').on(
      table.userId,
      table.status
    ),
    restaurantIdIdx: index('todo_eat_list_restaurant_id_idx').on(
      table.restaurantId
    ),
  })
);

// Invites table
export const invites = pgTable(
  'invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 8 }).notNull().unique(),
    email: varchar('email', { length: 255 }),
    createdBy: uuid('created_by')
      .references(() => users.id)
      .notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    claimedBy: uuid('claimed_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('invites_code_idx').on(table.code),
    expiresAtIdx: index('invites_expires_at_idx').on(table.expiresAt),
  })
);

// Relations (for Drizzle query builder)
export const usersRelations = relations(users, ({ many }) => ({
  restaurantsCreated: many(restaurants),
  friendsCreated: many(friends),
  visits: many(visits),
  todoEatLists: many(todoEatList),
  invitesCreated: many(invites),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [restaurants.createdBy],
    references: [users.id],
  }),
  visits: many(visits),
  todoEatLists: many(todoEatList),
}));

export const friendsRelations = relations(friends, ({ one, many }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [friends.createdBy],
    references: [users.id],
  }),
  visitCompanions: many(visitCompanions),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [visits.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [visits.userId],
    references: [users.id],
  }),
  companions: many(visitCompanions),
}));

export const visitCompanionsRelations = relations(
  visitCompanions,
  ({ one }) => ({
    visit: one(visits, {
      fields: [visitCompanions.visitId],
      references: [visits.id],
    }),
    friend: one(friends, {
      fields: [visitCompanions.friendId],
      references: [friends.id],
    }),
  })
);

export const todoEatListRelations = relations(todoEatList, ({ one }) => ({
  user: one(users, {
    fields: [todoEatList.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [todoEatList.restaurantId],
    references: [restaurants.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  createdBy: one(users, {
    fields: [invites.createdBy],
    references: [users.id],
  }),
  claimedBy: one(users, {
    fields: [invites.claimedBy],
    references: [users.id],
  }),
}));
```

**Step 3: Verify schema syntax**

Run: `pnpm tsc --noEmit`

Expected: No TypeScript errors

**Step 4: Commit schema**

Run:
```bash
git add lib/db/schema.ts
git commit -m "feat: Define database schema with Drizzle ORM

- Create all 7 tables: users, restaurants, friends, visits, visit_companions, todo_eat_list, invites
- Define enums for user_role, todo_status, price_band
- Set up foreign key relationships with cascade deletes
- Add indexes for query performance
- Define relations for Drizzle query builder

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Database Connection

**Files:**
- Create: `lib/db/index.ts`

**Step 1: Create database connection file**

Create `lib/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export schema for external use
export { schema };

// Export types
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Restaurant = typeof schema.restaurants.$inferSelect;
export type NewRestaurant = typeof schema.restaurants.$inferInsert;

export type Friend = typeof schema.friends.$inferSelect;
export type NewFriend = typeof schema.friends.$inferInsert;

export type Visit = typeof schema.visits.$inferSelect;
export type NewVisit = typeof schema.visits.$inferInsert;

export type VisitCompanion = typeof schema.visitCompanions.$inferSelect;
export type NewVisitCompanion = typeof schema.visitCompanions.$inferInsert;

export type TodoEatListItem = typeof schema.todoEatList.$inferSelect;
export type NewTodoEatListItem = typeof schema.todoEatList.$inferInsert;

export type Invite = typeof schema.invites.$inferSelect;
export type NewInvite = typeof schema.invites.$inferInsert;
```

**Step 2: Verify TypeScript types**

Run: `pnpm tsc --noEmit`

Expected: No TypeScript errors

**Step 3: Commit database connection**

Run:
```bash
git add lib/db/index.ts
git commit -m "feat: Create database connection and export types

- Set up Drizzle instance with Vercel Postgres
- Export database instance for queries
- Export TypeScript types for all tables

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Generate and Apply Initial Migration

**Files:**
- Create: `drizzle/migrations/0000_initial_schema.sql` (auto-generated)
- Create: `drizzle/migrations/meta/` (auto-generated)

**Step 1: Generate migration from schema**

Run:
```bash
pnpm db:generate
```

Expected:
- Migration file created in `drizzle/migrations/`
- Contains CREATE TABLE statements for all 7 tables
- Contains CREATE INDEX statements
- Contains CREATE TYPE statements for enums

**Step 2: Review generated migration**

Run:
```bash
cat drizzle/migrations/0000_*.sql
```

Expected: SQL looks correct with all tables, indexes, and enums

**Step 3: Apply migration to database**

Run:
```bash
pnpm db:push
```

Expected:
- "Applying migrations..."
- "Migration successful"
- No errors

**Step 4: Verify tables in database**

Run:
```bash
pnpm db:studio
```

Manual verification:
1. Drizzle Studio opens in browser
2. Navigate to Tables tab
3. Verify all 7 tables exist:
   - users
   - restaurants
   - friends
   - visits
   - visit_companions
   - todo_eat_list
   - invites

Expected: All tables visible in Drizzle Studio

**Step 5: Commit migration files**

Run:
```bash
git add drizzle/
git commit -m "chore: Generate and apply initial database migration

- Create migration for all 7 tables
- Apply migration to Vercel Postgres database
- Tables: users, restaurants, friends, visits, visit_companions, todo_eat_list, invites

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create Seed Script

**Files:**
- Create: `lib/db/seed.ts`

**Step 1: Create seed script with minimal mode**

Create `lib/db/seed.ts`:

```typescript
import { db, schema } from './index';
import { eq } from 'drizzle-orm';

async function seed() {
  const seedMode = process.env.SEED_MODE || 'minimal';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dishdash.com';
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  console.log(`🌱 Seeding database in ${seedMode} mode...`);

  // Check if admin user already exists
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log('⏭️  Admin user already exists, skipping seed');
    return;
  }

  // Create admin user
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      name: adminName,
      role: 'admin',
    })
    .returning();

  console.log(`✅ Created admin user: ${adminUser.email}`);

  if (seedMode === 'full') {
    console.log('🌾 Seeding full test data...');

    // Create restaurants
    const restaurantData = [
      {
        name: "Mario's Italian Kitchen",
        location: 'San Francisco, CA',
        cuisineTags: ['Italian', 'Pasta'],
        notes: 'Amazing carbonara!',
        createdBy: adminUser.id,
      },
      {
        name: 'Sushi Zen',
        location: 'San Francisco, CA',
        cuisineTags: ['Japanese', 'Sushi'],
        createdBy: adminUser.id,
      },
      {
        name: 'Taqueria El Primo',
        location: 'Oakland, CA',
        cuisineTags: ['Mexican', 'Tacos'],
        notes: 'Best al pastor in the Bay',
        createdBy: adminUser.id,
      },
      {
        name: 'Thai Basil',
        location: 'Berkeley, CA',
        cuisineTags: ['Thai', 'Curry'],
        createdBy: adminUser.id,
      },
      {
        name: 'The Burger Spot',
        location: 'San Francisco, CA',
        cuisineTags: ['American', 'Burgers'],
        createdBy: adminUser.id,
      },
    ];

    const restaurants = await db
      .insert(schema.restaurants)
      .values(restaurantData)
      .returning();

    console.log(`✅ Created ${restaurants.length} restaurants`);

    // Create friends
    const friendData = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        createdBy: adminUser.id,
      },
      {
        name: 'Mike Rodriguez',
        createdBy: adminUser.id,
      },
      {
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        createdBy: adminUser.id,
      },
    ];

    const friends = await db
      .insert(schema.friends)
      .values(friendData)
      .returning();

    console.log(`✅ Created ${friends.length} friends`);

    // Create visits
    const [visit1] = await db
      .insert(schema.visits)
      .values({
        restaurantId: restaurants[0]!.id, // Mario's
        userId: adminUser.id,
        visitedAt: new Date('2025-11-20'),
        rating: 5,
        priceBand: '$$',
        notes: 'Best carbonara ever!',
      })
      .returning();

    const [visit2] = await db
      .insert(schema.visits)
      .values({
        restaurantId: restaurants[1]!.id, // Sushi Zen
        userId: adminUser.id,
        visitedAt: new Date('2025-11-15'),
        rating: 4,
        priceBand: '$$$',
        notes: 'Fresh fish, great service',
      })
      .returning();

    console.log(`✅ Created 2 visits`);

    // Add companions to visits
    await db.insert(schema.visitCompanions).values({
      visitId: visit1.id,
      friendId: friends[0]!.id, // Sarah
    });

    await db.insert(schema.visitCompanions).values([
      {
        visitId: visit2.id,
        friendId: friends[1]!.id, // Mike
      },
      {
        visitId: visit2.id,
        friendId: friends[2]!.id, // Emma
      },
    ]);

    console.log(`✅ Added companions to visits`);

    // Create ToDo Eat List entries
    await db.insert(schema.todoEatList).values([
      {
        userId: adminUser.id,
        restaurantId: restaurants[2]!.id, // Taqueria
        status: 'todo',
      },
      {
        userId: adminUser.id,
        restaurantId: restaurants[3]!.id, // Thai Basil
        status: 'todo',
      },
      {
        userId: adminUser.id,
        restaurantId: restaurants[4]!.id, // Burger Spot
        status: 'eaten',
        completedAt: new Date(),
      },
    ]);

    console.log(`✅ Created 3 ToDo Eat List entries`);

    // Create invite
    await db.insert(schema.invites).values({
      code: 'TEST1234',
      createdBy: adminUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    console.log(`✅ Created invite code: TEST1234`);
  }

  console.log('✨ Seed complete!');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
```

**Step 2: Verify seed script syntax**

Run: `pnpm tsc --noEmit`

Expected: No TypeScript errors

**Step 3: Commit seed script**

Run:
```bash
git add lib/db/seed.ts
git commit -m "feat: Create configurable database seed script

- Support minimal mode (admin only) and full mode (test data)
- Create admin user from environment variables
- Full mode includes: 5 restaurants, 3 friends, 2 visits, 3 ToDo entries, 1 invite
- Idempotent: skip if admin already exists

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Run Seed and Verify

**Files:**
- None (database modification only)

**Step 1: Run seed in minimal mode**

Run:
```bash
SEED_MODE=minimal pnpm db:seed
```

Expected:
- "🌱 Seeding database in minimal mode..."
- "✅ Created admin user: [your-email]"
- "✨ Seed complete!"

**Step 2: Verify admin user in database**

Run:
```bash
pnpm db:studio
```

Manual verification:
1. Drizzle Studio opens
2. Navigate to users table
3. Verify 1 user exists with role='admin'

Expected: Admin user visible in database

**Step 3: Test full seed mode (optional)**

Run:
```bash
SEED_MODE=full pnpm db:seed
```

Expected:
- "⏭️  Admin user already exists, skipping seed" (if minimal run first)
- Or full seed runs with all test data

**Step 4: Verify test data (if full mode)**

In Drizzle Studio:
- restaurants: 5 entries
- friends: 3 entries
- visits: 2 entries
- visit_companions: 3 entries
- todo_eat_list: 3 entries
- invites: 1 entry

**Step 5: Create API test endpoint**

Create `app/api/db-test/route.ts`:

```typescript
import { db, schema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const users = await db.select().from(schema.users);
    const restaurants = await db.select().from(schema.restaurants);
    const friends = await db.select().from(schema.friends);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      counts: {
        users: users.length,
        restaurants: restaurants.length,
        friends: friends.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Step 6: Test API endpoint**

Run dev server:
```bash
pnpm dev
```

In browser or curl:
```bash
curl http://localhost:3000/api/db-test
```

Expected:
```json
{
  "status": "ok",
  "database": "connected",
  "counts": {
    "users": 1,
    "restaurants": 0,
    "friends": 0
  }
}
```

Or with full seed:
```json
{
  "status": "ok",
  "database": "connected",
  "counts": {
    "users": 1,
    "restaurants": 5,
    "friends": 3
  }
}
```

**Step 7: Commit test endpoint**

Run:
```bash
git add app/api/db-test/route.ts
git commit -m "feat: Add database connection test endpoint

- Create GET /api/db-test route
- Return connection status and record counts
- Useful for verifying database setup

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Update Documentation and Final Verification

**Files:**
- Modify: `README.md`

**Step 1: Update README with database setup**

Add to README.md after "Getting Started" section:

```markdown
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
```

**Step 2: Verify README renders correctly**

View README in GitHub or VS Code preview.

Expected: Markdown formatting correct, all sections visible

**Step 3: Run all checks**

Run:
```bash
pnpm tsc --noEmit && pnpm lint && pnpm format:check
```

Expected: All checks pass

**Step 4: Build production**

Run:
```bash
pnpm build
```

Expected: Build succeeds with no errors

**Step 5: Commit README update**

Run:
```bash
git add README.md
git commit -m "docs: Update README with database setup instructions

- Add Vercel Postgres setup guide
- Document database scripts
- Explain seed modes
- List all database tables

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 6: Push all changes**

Run:
```bash
git push origin navinseneviratna1922/sc-55/set-up-nextjs-16-projec
```

Expected: All commits pushed to GitHub

**Step 7: Verify deployment builds**

Wait for Vercel deployment:
- Check Vercel Dashboard
- Verify build succeeds
- Test `/api/db-test` endpoint on deployed URL

Expected: Deployment successful, API endpoint returns correct data

---

## Success Criteria Summary

All acceptance criteria from SC-56 met:

- ✅ Vercel Postgres connected to project
- ✅ All database tables created with proper relationships
- ✅ Database migrations set up (Drizzle Kit configured)
- ✅ Seed data for testing (optional admin user)
- ✅ Connection pooling configured (@vercel/postgres)

## Additional Deliverables

- ✅ Type-safe database access with Drizzle ORM
- ✅ Full seed script with minimal/full modes
- ✅ Test API endpoint for verification
- ✅ Comprehensive documentation
- ✅ All TypeScript types exported

## Next Steps

After database setup is complete:
1. **SC-57**: Configure NextAuth v5 with Magic Link + Google OAuth
2. **SC-58**: Implement admin role and user management UI
3. **SC-59**: Build Restaurant CRUD functionality
4. **SC-60**: Build Friend management with avatars
5. **SC-61**: Create ToDo Eat List feature
