const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

const workoutInclude = {
  exercises: {
    include: { exercise: true },
  },
  user: { select: { id: true, name: true } },
};

async function getMyWorkouts(userId) {
  return prisma.workout.findMany({
    where: { userId },
    include: workoutInclude,
    orderBy: { date: 'desc' },
  });
}

async function getById(id, userId, role) {
  const workout = await prisma.workout.findUnique({ where: { id }, include: workoutInclude });
  if (!workout) throw new AppError('Workout not found', 404);
  if (workout.userId !== userId && role !== 'ADMIN' && !workout.isPublic) {
    throw new AppError('Forbidden', 403);
  }
  return workout;
}

async function create(userId, { name, notes, date, isPublic, exercises }) {
  return prisma.workout.create({
    data: {
      name, notes, isPublic,
      date: date ? new Date(date) : undefined,
      userId,
      exercises: {
        create: (exercises || []).map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          weightKg: e.weightKg,
        })),
      },
    },
    include: workoutInclude,
  });
}

async function update(id, userId, role, data) {
  const workout = await getById(id, userId, role);
  if (workout.userId !== userId && role !== 'ADMIN') throw new AppError('Forbidden', 403);

  const { exercises, ...rest } = data;
  return prisma.$transaction(async (tx) => {
    if (exercises) {
      await tx.workoutExercise.deleteMany({ where: { workoutId: id } });
      await tx.workoutExercise.createMany({
        data: exercises.map((e) => ({ workoutId: id, ...e })),
      });
    }
    return tx.workout.update({ where: { id }, data: rest, include: workoutInclude });
  });
}

async function remove(id, userId, role) {
  const workout = await getById(id, userId, role);
  if (workout.userId !== userId && role !== 'ADMIN') throw new AppError('Forbidden', 403);
  await prisma.workout.delete({ where: { id } });
}

module.exports = { getMyWorkouts, getById, create, update, remove };
