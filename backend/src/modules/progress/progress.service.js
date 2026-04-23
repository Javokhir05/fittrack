// progress.service.js
const { prisma } = require('../../config/database');

async function getMyProgress(userId) {
  return prisma.progressEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });
}

async function create(userId, data) {
  return prisma.progressEntry.create({
    data: { userId, ...data },
  });
}

async function remove(id, userId) {
  const entry = await prisma.progressEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) {
    const { AppError } = require('../../middleware/errorHandler');
    throw new AppError('Not found or forbidden', 404);
  }
  await prisma.progressEntry.delete({ where: { id } });
}

module.exports = { getMyProgress, create, remove };
