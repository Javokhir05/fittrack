const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const userPassword = await bcrypt.hash('User1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fittrack.com' },
    update: {},
    create: { email: 'admin@fittrack.com', password: adminPassword, name: 'Admin', role: 'ADMIN' },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@fittrack.com' },
    update: {},
    create: { email: 'user@fittrack.com', password: userPassword, name: 'Test User', role: 'USER' },
  });

  const exercises = [
    { name: 'Barbell Squat', category: 'Strength', muscleGroup: 'Legs', description: 'Compound lower body movement' },
    { name: 'Bench Press', category: 'Strength', muscleGroup: 'Chest', description: 'Horizontal push movement' },
    { name: 'Deadlift', category: 'Strength', muscleGroup: 'Back', description: 'Hip hinge movement' },
    { name: 'Pull-up', category: 'Bodyweight', muscleGroup: 'Back', description: 'Vertical pull movement' },
    { name: 'Running', category: 'Cardio', muscleGroup: 'Full Body', description: 'Aerobic endurance' },
    { name: 'Plank', category: 'Core', muscleGroup: 'Core', description: 'Isometric core hold' },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: ex,
    });
  }

  console.log('Seeded:', { admin: admin.email, user: user.email, exercises: exercises.length });
}

main().catch(console.error).finally(() => prisma.$disconnect());
