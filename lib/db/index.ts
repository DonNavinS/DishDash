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
