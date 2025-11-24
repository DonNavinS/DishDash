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
