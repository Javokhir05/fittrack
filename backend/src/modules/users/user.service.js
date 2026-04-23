// user.service.js
const { prisma } = require('../../config/database');

async function getAll() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateRole(id, role) {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });
}

module.exports = { getAll, updateRole };
