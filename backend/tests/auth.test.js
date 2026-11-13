const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_tests';

const app = require('../src/config/express');

// Mock Prisma
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

const { prisma } = require('../src/config/database');
const bcrypt = require('bcryptjs');

const USER = { id: 1, email: 'a@b.com', name: 'A', role: 'USER' };

function cookiesOf(res) {
  return (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]);
}
function rawCookie(res, name) {
  return (res.headers['set-cookie'] || []).find((c) => c.startsWith(`${name}=`));
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.refreshToken.create.mockResolvedValue({});
  prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
  prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
});

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
    prisma.user.findUnique.mockResolvedValue({ ...USER, password: hashed });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'a@b.com', password: 'wrong',
    });
    expect(res.status).toBe(401);
    expect(rawCookie(res, 'access_token')).toBeUndefined();
  });

  it('sets httpOnly auth cookies and never returns a token in the body', async () => {
    const hashed = await bcrypt.hash('Correct1!', 12);
    prisma.user.findUnique.mockResolvedValue({ ...USER, password: hashed });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'a@b.com', password: 'Correct1!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual(USER);
    expect(JSON.stringify(res.body)).not.toMatch(/token/i);

    const access = rawCookie(res, 'access_token');
    const refresh = rawCookie(res, 'refresh_token');
    expect(access).toMatch(/HttpOnly/i);
    expect(access).toMatch(/SameSite=Strict/i);
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/Path=\/api\/v1\/auth/);

    // Only a hash of the refresh token is stored, never the raw value.
    const rawRefresh = refresh.split(';')[0].split('=')[1];
    const stored = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(stored.tokenHash).toHaveLength(64);
    expect(stored.tokenHash).not.toBe(rawRefresh);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('accepts the access token from the cookie', async () => {
    const token = jwt.sign({ userId: 1, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: 60 });
    prisma.user.findUnique.mockResolvedValue({ ...USER, password: 'x' });

    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `access_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('a@b.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('still accepts a Bearer header (API clients)', async () => {
    const token = jwt.sign({ userId: 1, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: 60 });
    prisma.user.findUnique.mockResolvedValue({ ...USER, password: 'x' });

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 401 with no credentials', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  const header = { 'X-Requested-With': 'fetch' };

  it('returns 401 without a refresh cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set(header);
    expect(res.status).toBe(401);
  });

  it('rotates the token: revokes the old one and sets new cookies', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 7, userId: 1, revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000), user: USER,
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh').set(header).set('Cookie', 'refresh_token=abc');

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual(USER);
    expect(cookiesOf(res).some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookiesOf(res).some((c) => c.startsWith('refresh_token='))).toBe(true);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7, revokedAt: null } })
    );
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('rejects an expired refresh token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 7, userId: 1, revokedAt: null,
      expiresAt: new Date(Date.now() - 1000), user: USER,
    });
    const res = await request(app)
      .post('/api/v1/auth/refresh').set(header).set('Cookie', 'refresh_token=abc');
    expect(res.status).toBe(401);
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('treats reuse of a long-rotated token as theft and revokes every session', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 7, userId: 1, revokedAt: new Date(Date.now() - 60_000), rotatedAt: new Date(Date.now() - 60_000),
      expiresAt: new Date(Date.now() + 60_000), user: USER,
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh').set(header).set('Cookie', 'refresh_token=stolen');

    expect(res.status).toBe(401);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 1, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('tolerates a just-rotated token (two tabs refreshing at once)', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 7, userId: 1, revokedAt: new Date(Date.now() - 2000), rotatedAt: new Date(Date.now() - 2000),
      expiresAt: new Date(Date.now() + 60_000), user: USER,
    });
    const res = await request(app)
      .post('/api/v1/auth/refresh').set(header).set('Cookie', 'refresh_token=abc');
    expect(res.status).toBe(200);
  });

  it('does NOT tolerate a token revoked by logout/theft, even seconds later', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 7, userId: 1, revokedAt: new Date(Date.now() - 2000), rotatedAt: null,
      expiresAt: new Date(Date.now() + 60_000), user: USER,
    });
    const res = await request(app)
      .post('/api/v1/auth/refresh').set(header).set('Cookie', 'refresh_token=abc');
    expect(res.status).toBe(401);
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the refresh token and clears both cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('X-Requested-With', 'fetch')
      .set('Cookie', 'refresh_token=abc');

    expect(res.status).toBe(200);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { revokedAt: expect.any(Date) } })
    );
    const cleared = res.headers['set-cookie'].join(';');
    expect(cleared).toMatch(/access_token=;/);
    expect(cleared).toMatch(/refresh_token=;/);
  });
});

describe('CSRF guard', () => {
  it('blocks a state-changing request that carries auth cookies but no X-Requested-With', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', 'refresh_token=abc');
    expect(res.status).toBe(403);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('does not affect safe (GET) requests', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', 'refresh_token=abc');
    expect(res.status).toBe(401); // unauthenticated, but not 403
  });
});

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});