const request = require('supertest');
const app = require('../src/config/express');

// Mock Prisma
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

const { prisma } = require('../src/config/database');
const bcrypt = require('bcryptjs');

describe('POST /api/v1/auth/register', () => {
  it('returns 201 and user on valid input', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1, email: 'test@test.com', name: 'Test', role: 'USER', createdAt: new Date(),
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@test.com', password: 'Password1!', name: 'Test',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('test@test.com');
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 401 on wrong password', async () => {
    const hashed = await bcrypt.hash('correct', 12);
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.com', password: hashed, role: 'USER' });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'a@b.com', password: 'wrong',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
