import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
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

// NextAuth tables
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull().unique(),
    expires: timestamp('expires').notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
