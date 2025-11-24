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

  if (!adminUser) {
    throw new Error('Failed to create admin user');
  }

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

    if (!visit1 || !visit2) {
      throw new Error('Failed to create visits');
    }

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
