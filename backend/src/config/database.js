const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: e.duration }, 'DB query');
  });
}

async function checkDbConnection() {
  await prisma.$queryRaw`SELECT 1`;
  logger.info('Database connection established');
}

module.exports = { prisma, checkDbConnection };
