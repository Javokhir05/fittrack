const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

// Simple in-memory cache for read-heavy exercise list (Week 7 scalability requirement)
let cache = { data: null, expiresAt: 0 };
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function invalidateCache() {
  cache = { data: null, expiresAt: 0 };
}

async function getAll() {
  if (cache.data && Date.now() < cache.expiresAt) {
    return { data: cache.data, fromCache: true };
  }
  const exercises = await prisma.exercise.findMany({ orderBy: { name: 'asc' } });
  cache = { data: exercises, expiresAt: Date.now() + CACHE_TTL_MS };
  return { data: exercises, fromCache: false };
}

async function getById(id) {
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) throw new AppError('Exercise not found', 404);
  return exercise;
}

async function create(data) {
  const exercise = await prisma.exercise.create({ data });
  invalidateCache();
  return exercise;
}

async function update(id, data) {
  await getById(id);
  const exercise = await prisma.exercise.update({ where: { id }, data });
  invalidateCache();
  return exercise;
}

async function remove(id) {
  await getById(id);
  await prisma.exercise.delete({ where: { id } });
  invalidateCache();
}

module.exports = { getAll, getById, create, update, remove };
